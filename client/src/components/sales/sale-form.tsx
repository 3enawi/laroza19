import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSaleSchema, type InsertSale, type InsertSaleItem } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, Plus } from "lucide-react";
import AvailableInventory from "./available-inventory";
import { z } from "zod";

const saleFormSchema = z.object({
  channel: z.string().min(1, "قناة البيع مطلوبة"),
  paymentMethod: z.string().min(1, "طريقة الدفع مطلوبة"),
  customerName: z.string().min(1, "اسم الزبون مطلوب"),
  customerPhone: z.string().min(1, "رقم هاتف الزبون مطلوب"),
  trackingNumber: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, "المنتج مطلوب"),
    color: z.string().min(1, "اللون مطلوب"),
    size: z.string().min(1, "المقاس مطلوب"),
    quantity: z.number().min(1, "الكمية يجب أن تكون على الأقل 1"),
    unitPrice: z.string().min(1, "سعر الوحدة مطلوب"),
  })).min(1, "يجب إضافة عنصر واحد على الأقل"),
});

type SaleFormData = z.infer<typeof saleFormSchema>;

interface SaleFormProps {
  onClose: () => void;
}

export default function SaleForm({ onClose }: SaleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      channel: "",
      paymentMethod: "",
      customerName: "",
      customerPhone: "",
      trackingNumber: "",
      items: [{ productId: "", color: "", size: "", quantity: 1, unitPrice: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const paymentMethod = form.watch("paymentMethod");
  const channel = form.watch("channel");

  const createSaleMutation = useMutation({
    mutationFn: async (data: { sale: InsertSale; items: InsertSaleItem[] }) => {
      const response = await apiRequest("POST", "/api/sales", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم تسجيل البيع بنجاح",
        description: "تم حفظ البيع وتحديث المخزون",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "خطأ في تسجيل البيع",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => {
    return sum + (item.quantity * parseFloat(item.unitPrice || "0"));
  }, 0);

  const feePercentage = paymentMethod === "visa" ? 0.05 : 0;
  const fees = subtotal * feePercentage;
  const total = subtotal + fees;

  const onSubmit = (data: SaleFormData) => {
    const saleData: InsertSale = {
      channel: data.channel as "in-store" | "online",
      paymentMethod: data.paymentMethod,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      trackingNumber: data.trackingNumber || null,
      subtotal: subtotal.toFixed(2),
      fees: fees.toFixed(2),
      total: total.toFixed(2),
    };

    const itemsData: InsertSaleItem[] = data.items.map(item => ({
      productId: item.productId,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    createSaleMutation.mutate({
      sale: saleData,
      items: itemsData,
    });
  };

  // Update unit price when product or channel changes
  const updateUnitPrice = (index: number, productId: string) => {
    const product = (products as any)?.find((p: any) => p.id === productId);
    if (product) {
      const channel = form.getValues("channel");
      const price = channel === "online" ? product.onlinePrice : product.storePrice;
      form.setValue(`items.${index}.unitPrice`, price);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>تسجيل بيع جديد</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Sale Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>قناة البيع <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      // Update prices for all items when channel changes
                      watchedItems.forEach((item, index) => {
                        if (item.productId) {
                          updateUnitPrice(index, item.productId);
                        }
                      });
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-sales-channel">
                          <SelectValue placeholder="اختر قناة البيع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in-store">في المتجر</SelectItem>
                        <SelectItem value="online">أونلاين</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>طريقة الدفع <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder="اختر طريقة الدفع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="visa">فيزا (+5% رسوم)</SelectItem>
                        <SelectItem value="bank-transfer">حوالة بنكية</SelectItem>
                        <SelectItem value="cash-on-delivery">الدفع عند الاستلام</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الزبون <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="أدخل اسم الزبون" 
                        {...field}
                        data-testid="input-customer-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="مثال: +971501234567" 
                        {...field}
                        data-testid="input-customer-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tracking Number for Online Sales */}
            {channel === "online" && (
              <FormField
                control={form.control}
                name="trackingNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم التتبع (للمبيعات الأونلاين)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="أدخل رقم التتبع للشحنة" 
                        {...field}
                        value={field.value || ""}
                        data-testid="input-tracking-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Sale Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium">عناصر البيع</h4>
                <Button 
                  type="button" 
                  onClick={() => append({ productId: "", color: "", size: "", quantity: 1, unitPrice: "0" })}
                  data-testid="button-add-item"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة عنصر
                </Button>
              </div>
              
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المنتج</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                updateUnitPrice(index, value);
                                // Reset color and size when product changes
                                form.setValue(`items.${index}.color`, "");
                                form.setValue(`items.${index}.size`, "");
                              }} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid={`select-product-${index}`}>
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
                                  data-testid={`input-color-${index}`}
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
                                  data-testid={`input-size-${index}`}
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
                                  data-testid={`input-quantity-${index}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>سعر الوحدة</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field}
                                  data-testid={`input-unit-price-${index}`}
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
                            data-testid={`button-remove-item-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Available Inventory Display */}
                      {watchedItems[index]?.productId && (
                        <AvailableInventory 
                          productId={watchedItems[index].productId}
                          selectedColor={watchedItems[index].color}
                          selectedSize={watchedItems[index].size}
                          onColorSelect={(color) => form.setValue(`items.${index}.color`, color)}
                          onSizeSelect={(size) => form.setValue(`items.${index}.size`, size)}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Summary */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span data-testid="text-subtotal">{subtotal.toFixed(2)} درهم</span>
                  </div>
                  {paymentMethod === "visa" && (
                    <div className="flex justify-between">
                      <span>رسوم فيزا (5%):</span>
                      <span data-testid="text-fees">{fees.toFixed(2)} درهم</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>المجموع الإجمالي:</span>
                    <span data-testid="text-total">{total.toFixed(2)} درهم</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 space-x-reverse pt-6 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={createSaleMutation.isPending}
                data-testid="button-save-sale"
              >
                {createSaleMutation.isPending ? "جاري الحفظ..." : "تسجيل البيع"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
