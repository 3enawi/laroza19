import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ProductWithInventory } from "@shared/schema";

interface EditProductModalProps {
  product: ProductWithInventory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditProductModal({ product, open, onOpenChange }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    modelNumber: product.modelNumber,
    companyName: product.companyName,
    productType: product.productType,
    storePrice: product.storePrice.toString(),
    onlinePrice: product.onlinePrice.toString(),
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelNumber: data.modelNumber,
          companyName: data.companyName,
          productType: data.productType,
          storePrice: data.storePrice,
          onlinePrice: data.onlinePrice,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث المنتج بنجاح"
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المنتج",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProductMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل المنتج - {product.modelNumber}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="modelNumber">رقم الموديل</Label>
            <Input
              id="modelNumber"
              value={formData.modelNumber}
              onChange={(e) => handleInputChange('modelNumber', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="companyName">اسم الشركة</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="productType">نوع المنتج</Label>
            <Select value={formData.productType} onValueChange={(value) => handleInputChange('productType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dress">فستان</SelectItem>
                <SelectItem value="evening-wear">فستان سهرة</SelectItem>
                <SelectItem value="hijab">حجاب</SelectItem>
                <SelectItem value="abaya">عباية</SelectItem>
                <SelectItem value="accessories">إكسسوارات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="storePrice">سعر المتجر (درهم)</Label>
            <Input
              id="storePrice"
              type="number"
              step="0.01"
              value={formData.storePrice}
              onChange={(e) => handleInputChange('storePrice', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="onlinePrice">سعر الأونلاين (درهم)</Label>
            <Input
              id="onlinePrice"
              type="number"
              step="0.01"
              value={formData.onlinePrice}
              onChange={(e) => handleInputChange('onlinePrice', e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={updateProductMutation.isPending}>
              {updateProductMutation.isPending ? "جاري التحديث..." : "حفظ التغييرات"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}