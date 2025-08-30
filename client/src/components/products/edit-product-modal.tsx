import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, type InsertProduct, type ProductWithInventory } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ColorSizeManager from "./color-size-manager";

interface EditProductModalProps {
  product: ProductWithInventory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditProductModal({ product, open, onOpenChange }: EditProductModalProps) {
  const [inventory, setInventory] = useState<Record<string, Record<string, number>>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current inventory for this product
  const { data: currentInventory } = useQuery({
    queryKey: ["/api/products", product.id, "inventory"],
    enabled: open,
  });

  // Initialize inventory state from product data
  useEffect(() => {
    if (currentInventory && Array.isArray(currentInventory)) {
      const inventoryMap: Record<string, Record<string, number>> = {};
      currentInventory.forEach((item: any) => {
        if (!inventoryMap[item.color]) {
          inventoryMap[item.color] = {};
        }
        inventoryMap[item.color][item.size] = item.quantity;
      });
      setInventory(inventoryMap);
    }
  }, [currentInventory]);

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      modelNumber: product.modelNumber,
      companyName: product.companyName,
      productType: product.productType,
      storePrice: product.storePrice.toString(),
      onlinePrice: product.onlinePrice.toString(),
      imageUrl: product.imageUrl || "",
      specifications: product.specifications || "",
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: { product: InsertProduct; inventory: any[] }) => {
      const response = await apiRequest("PUT", `/api/products/${product.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث المنتج والمخزون بنجاح",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ في التحديث",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProduct) => {
    // Convert inventory object to array format
    const inventoryArray = [];
    for (const color of Object.keys(inventory)) {
      for (const size of Object.keys(inventory[color])) {
        if (inventory[color][size] >= 0) {
          inventoryArray.push({
            color,
            size,
            quantity: inventory[color][size],
          });
        }
      }
    }

    updateProductMutation.mutate({
      product: data,
      inventory: inventoryArray,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>تعديل المنتج - {product.modelNumber}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Product Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="modelNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الموديل <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="مثال: DRS-001" 
                        {...field}
                        data-testid="input-edit-model-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الشركة <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="مثال: شركة الأزياء الراقية" 
                        {...field}
                        data-testid="input-edit-company-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المنتج <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-product-type">
                          <SelectValue placeholder="اختر نوع المنتج" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dress">فستان</SelectItem>
                        <SelectItem value="evening-wear">فستان سهرة</SelectItem>
                        <SelectItem value="hijab">حجاب</SelectItem>
                        <SelectItem value="abaya">عباية</SelectItem>
                        <SelectItem value="accessories">إكسسوارات</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>صورة المنتج</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="رابط الصورة" 
                        {...field}
                        value={field.value || ""}
                        data-testid="input-edit-image-url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="storePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر المتجر (درهم) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        data-testid="input-edit-store-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="onlinePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر الأونلاين (درهم) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        data-testid="input-edit-online-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="specifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مواصفات المنتج</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="وصف تفصيلي للمنتج..." 
                      rows={3}
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-edit-specifications"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color & Size Management with Delete Functionality */}
            <ColorSizeManager inventory={inventory} onInventoryChange={setInventory} />

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 space-x-reverse pt-6 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-edit"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={updateProductMutation.isPending}
                data-testid="button-save-edit"
              >
                {updateProductMutation.isPending ? "جاري التحديث..." : "حفظ التغييرات"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}