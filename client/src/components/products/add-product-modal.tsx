import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, type InsertProduct, COLORS, SIZES } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ColorSizeManager from "./color-size-manager";

interface AddProductModalProps {
  onClose: () => void;
}

export default function AddProductModal({ onClose }: AddProductModalProps) {
  const [inventory, setInventory] = useState<Record<string, Record<string, number>>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      modelNumber: "",
      companyName: "",
      productType: "",
      storePrice: "0",
      onlinePrice: "0",
      imageUrl: "",
      specifications: "",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: { product: InsertProduct; inventory: any[] }) => {
      const response = await apiRequest("POST", "/api/products", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "تم إضافة المنتج بنجاح",
        description: "تم حفظ المنتج والمخزون بنجاح",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "خطأ في إضافة المنتج",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        form.setValue("imageUrl", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: InsertProduct) => {
    // Convert inventory object to array format
    const inventoryArray = [];
    for (const color of Object.keys(inventory)) {
      for (const size of Object.keys(inventory[color])) {
        if (inventory[color][size] > 0) {
          inventoryArray.push({
            color,
            size,
            quantity: inventory[color][size],
          });
        }
      }
    }

    createProductMutation.mutate({
      product: data,
      inventory: inventoryArray,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>إضافة منتج جديد</DialogTitle>
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
                        data-testid="input-model-number"
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
                        data-testid="input-company-name"
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
                        <SelectTrigger data-testid="select-product-type">
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
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="button-upload-image"
                        >
                          رفع صورة من الجهاز
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                          data-testid="file-input-image"
                        />
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="أو أدخل رابط الصورة" 
                          {...field}
                          value={imageFile ? `تم رفع الصورة: ${imageFile.name}` : field.value || ""}
                          readOnly={!!imageFile}
                          data-testid="input-image-url"
                        />
                      </FormControl>
                      {imagePreview && (
                        <div className="mt-2 relative">
                          <img 
                            src={imagePreview} 
                            alt="معاينة الصورة" 
                            className="w-32 h-32 object-cover rounded-md border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview("");
                              form.setValue("imageUrl", "");
                            }}
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      )}
                    </div>
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
                        data-testid="input-store-price"
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
                        data-testid="input-online-price"
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
                      data-testid="textarea-specifications"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color & Size Management */}
            <ColorSizeManager inventory={inventory} onInventoryChange={setInventory} />

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
                disabled={createProductMutation.isPending}
                data-testid="button-save-product"
              >
                {createProductMutation.isPending ? "جاري الحفظ..." : "حفظ المنتج"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
