import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ColorSizeManager from "./ColorSizeManager";
import { PRODUCT_TYPES } from "@/lib/constants";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddProductModal({ open, onOpenChange }: AddProductModalProps) {
  const [formData, setFormData] = useState({
    modelNumber: "",
    companyName: "", 
    productType: "",
    storePrice: "",
    onlinePrice: "",
    imageUrl: "",
    specifications: "",
  });
  
  const [inventory, setInventory] = useState<Record<string, Record<string, number>>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProductMutation = useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم إضافة المنتج بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة المنتج",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      modelNumber: "",
      companyName: "",
      productType: "",
      storePrice: "",
      onlinePrice: "",
      imageUrl: "",
      specifications: "",
    });
    setInventory({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare inventory data
    const inventoryItems = [];
    for (const color in inventory) {
      for (const size in inventory[color]) {
        if (inventory[color][size] > 0) {
          inventoryItems.push({
            color,
            size,
            quantity: inventory[color][size],
            productId: "", // Will be set by the backend
          });
        }
      }
    }

    createProductMutation.mutate({
      product: formData,
      inventory: inventoryItems,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>إضافة منتج جديد</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="modelNumber">رقم الموديل <span className="text-destructive">*</span></Label>
              <Input
                id="modelNumber"
                data-testid="input-model-number"
                value={formData.modelNumber}
                onChange={(e) => handleInputChange("modelNumber", e.target.value)}
                placeholder="مثال: DRS-001"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="companyName">اسم الشركة <span className="text-destructive">*</span></Label>
              <Input
                id="companyName"
                data-testid="input-company-name"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                placeholder="مثال: شركة الأزياء الراقية"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="productType">نوع المنتج <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value) => handleInputChange("productType", value)}>
                <SelectTrigger data-testid="select-product-type">
                  <SelectValue placeholder="اختر نوع المنتج" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="imageUrl">رابط الصورة</Label>
              <Input
                id="imageUrl"
                data-testid="input-image-url"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div>
              <Label htmlFor="storePrice">سعر المتجر (درهم) <span className="text-destructive">*</span></Label>
              <Input
                id="storePrice"
                data-testid="input-store-price"
                type="number"
                step="0.01"
                value={formData.storePrice}
                onChange={(e) => handleInputChange("storePrice", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="onlinePrice">سعر الأونلاين (درهم) <span className="text-destructive">*</span></Label>
              <Input
                id="onlinePrice"
                data-testid="input-online-price"
                type="number"
                step="0.01"
                value={formData.onlinePrice}
                onChange={(e) => handleInputChange("onlinePrice", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="specifications">مواصفات المنتج</Label>
            <Textarea
              id="specifications"
              data-testid="textarea-specifications"
              value={formData.specifications}
              onChange={(e) => handleInputChange("specifications", e.target.value)}
              placeholder="وصف تفصيلي للمنتج..."
              rows={3}
            />
          </div>

          {/* Colors and Sizes */}
          <div>
            <ColorSizeManager 
              inventory={inventory}
              onInventoryChange={setInventory}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 space-x-reverse pt-6 border-t border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
}
