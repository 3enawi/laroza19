import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReturnSchema, type InsertReturn, type InsertReturnItem } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, Plus } from "lucide-react";
import { z } from "zod";

const returnFormSchema = z.object({
  originalSaleId: z.string().min(1, "الفاتورة الأصلية مطلوبة"),
  returnType: z.string().min(1, "نوع المرتجع مطلوب"),
  exchangeType: z.string().optional(),
  newProductId: z.string().optional(),
  newColor: z.string().optional(),
  newSize: z.string().optional(),
  refundAmount: z.string().min(1, "مبلغ الاسترداد مطلوب"),
  items: z.array(z.object({
    productId: z.string().min(1, "معرف المنتج مطلوب"),
    color: z.string().min(1, "اللون مطلوب"),
    size: z.string().min(1, "المقاس مطلوب"),
    quantity: z.number().min(1, "الكمية يجب أن تكون على الأقل 1"),
  })).min(1, "يجب إضافة عنصر واحد على الأقل"),
}).refine((data) => {
  if (data.returnType === "exchange") {
    if (!data.exchangeType) return false;
    if (data.exchangeType === "product-to-product" && !data.newProductId) return false;
    if (data.exchangeType === "color-change" && !data.newColor) return false;
    if (data.exchangeType === "size-change" && !data.newSize) return false;
  }
  return true;
}, {
  message: "يجب ملء جميع الحقول المطلوبة للاستبدال",
  path: ["exchangeType"],
});

type ReturnFormData = z.infer<typeof returnFormSchema>;

interface ReturnFormProps {
  onClose: () => void;
}

export default function ReturnForm({ onClose }: ReturnFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sales } = useQuery({
    queryKey: ["/api/sales"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      originalSaleId: "",
      returnType: "",
      exchangeType: "",
      newProductId: "",
      newColor: "",
      newSize: "",
      refundAmount: "0",
      items: [{ productId: "", color: "", size: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const createReturnMutation = useMutation({
    mutationFn: async (data: { return: InsertReturn; items: InsertReturnItem[] }) => {
      const response = await apiRequest("POST", "/api/returns", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم تسجيل المرتجع بنجاح",
        description: "تم حفظ المرتجع وتحديث المخزون",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "خطأ في تسجيل المرتجع",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const selectedSale = (sales as any)?.find((sale: any) => sale.id === form.watch("originalSaleId"));

  // Auto-populate refund amount when sale is selected
  const handleSaleChange = (saleId: string) => {
    const sale = (sales as any)?.find((s: any) => s.id === saleId);
    if (sale) {
      form.setValue("refundAmount", sale.total);
    }
  };

  const onSubmit = (data: ReturnFormData) => {
    const returnData: InsertReturn = {
      originalSaleId: data.originalSaleId,
      returnType: data.returnType as "refund" | "exchange",
      exchangeType: data.exchangeType || null,
      newProductId: data.newProductId || null,
      newColor: data.newColor || null,
      newSize: data.newSize || null,
      refundAmount: data.refundAmount,
    };

    const itemsData: InsertReturnItem[] = data.items.map(item => ({
      productId: item.productId,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
    }));

    createReturnMutation.mutate({
      return: returnData,
      items: itemsData,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>تسجيل مرتجع</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Return Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="originalSaleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الفاتورة الأصلية <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      handleSaleChange(value);
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-original-sale">
                          <SelectValue placeholder="اختر الفاتورة الأصلية" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(sales as any)?.map((sale: any) => (
                          <SelectItem key={sale.id} value={sale.id}>
                            {sale.invoiceNumber} - {sale.total} درهم
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="returnType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المرتجع <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      if (value === "refund") {
                        form.setValue("exchangeType", "");
                        form.setValue("newProductId", "");
                        form.setValue("newColor", "");
                        form.setValue("newSize", "");
                      }
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-return-type">
                          <SelectValue placeholder="اختر نوع المرتجع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="refund">استرداد</SelectItem>
                        <SelectItem value="exchange">استبدال</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="refundAmount"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>مبلغ الاسترداد (درهم) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        data-testid="input-refund-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Exchange Options - Show only when exchange is selected */}
            {form.watch("returnType") === "exchange" && (
              <Card className="bg-accent/10 border-accent/20">
                <CardContent className="p-6">
                  <h4 className="font-medium mb-4 text-accent-foreground">خيارات الاستبدال</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="exchangeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع الاستبدال <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            // Reset other fields when exchange type changes
                            form.setValue("newProductId", "");
                            form.setValue("newColor", "");
                            form.setValue("newSize", "");
                          }} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-exchange-type">
                                <SelectValue placeholder="اختر نوع الاستبدال" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="product-to-product">استبدال منتج بمنتج آخر</SelectItem>
                              <SelectItem value="color-change">تغيير اللون</SelectItem>
                              <SelectItem value="size-change">تغيير المقاس</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* New Product Selection for product-to-product exchange */}
                    {form.watch("exchangeType") === "product-to-product" && (
                      <FormField
                        control={form.control}
                        name="newProductId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المنتج الجديد <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-new-product">
                                  <SelectValue placeholder="اختر المنتج الجديد" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(products as any)?.map((product: any) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.modelNumber} - {product.companyName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* New Color for color change */}
                    {form.watch("exchangeType") === "color-change" && (
                      <FormField
                        control={form.control}
                        name="newColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اللون الجديد <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="مثال: أسود، أبيض، أحمر" 
                                {...field}
                                data-testid="input-new-color"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* New Size for size change */}
                    {form.watch("exchangeType") === "size-change" && (
                      <FormField
                        control={form.control}
                        name="newSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>المقاس الجديد <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="مثال: 38، 40، L، XL" 
                                {...field}
                                data-testid="input-new-size"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show original sale details if selected */}
            {selectedSale && (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">تفاصيل الفاتورة الأصلية:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">رقم الفاتورة:</span>
                      <p className="font-medium">{selectedSale.invoiceNumber}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">القناة:</span>
                      <p className="font-medium">{selectedSale.channel === 'online' ? 'أونلاين' : 'في المتجر'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">طريقة الدفع:</span>
                      <p className="font-medium">{selectedSale.paymentMethod}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">المجموع:</span>
                      <p className="font-bold text-primary">{selectedSale.total} درهم</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Return Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium">عناصر المرتجع</h4>
                <Button 
                  type="button" 
                  onClick={() => append({ productId: "", color: "", size: "", quantity: 1 })}
                  data-testid="button-add-return-item"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة عنصر
                </Button>
              </div>
              
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المنتج</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid={`select-return-product-${index}`}>
                                    <SelectValue placeholder="اختر المنتج" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {(products as any)?.map((product: any) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.modelNumber} - {product.companyName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`items.${index}.color`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اللون</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="مثال: أسود، أبيض، أحمر" 
                                  {...field}
                                  data-testid={`input-return-color-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`items.${index}.size`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المقاس</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="مثال: 38، 40، L، XL" 
                                  {...field}
                                  data-testid={`input-return-size-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الكمية</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                  data-testid={`input-return-quantity-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex items-end">
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                            data-testid={`button-remove-return-item-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 space-x-reverse pt-6 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel-return"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={createReturnMutation.isPending}
                data-testid="button-save-return"
              >
                {createReturnMutation.isPending ? "جاري الحفظ..." : "تسجيل المرتجع"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
