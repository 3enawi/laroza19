import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PAYMENT_METHODS, SALES_CHANNELS } from "@/lib/constants";
import AvailableInventory from "./AvailableInventory";

interface SaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SaleItem {
  productId: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export default function SaleForm({ open, onOpenChange }: SaleFormProps) {
  const [saleData, setSaleData] = useState({
    channel: "",
    paymentMethod: "",
  });
  
  const [items, setItems] = useState<SaleItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    queryFn: api.getProducts,
  });

  const createSaleMutation = useMutation({
    mutationFn: api.createSale,
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل البيع بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تسجيل البيع",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSaleData({ channel: "", paymentMethod: "" });
    setItems([]);
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      productId: "",
      color: "",
      size: "",
      quantity: 1,
      unitPrice: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const fees = saleData.paymentMethod === 'visa' ? subtotal * 0.05 : 0;
    return subtotal + fees;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast({
        title: "خطأ",
        description: "يجب إضافة عنصر واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    const subtotal = calculateSubtotal();
    
    const saleItems = items.map(item => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice,
    }));

    createSaleMutation.mutate({
      sale: {
        ...saleData,
        subtotal: subtotal.toFixed(2),
      },
      items: saleItems,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>تسجيل بيع جديد</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sale Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="channel">قناة البيع <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value) => setSaleData(prev => ({ ...prev, channel: value }))}>
                <SelectTrigger data-testid="select-sales-channel">
                  <SelectValue placeholder="اختر قناة البيع" />
                </SelectTrigger>
                <SelectContent>
                  {SALES_CHANNELS.map((channel) => (
                    <SelectItem key={channel.value} value={channel.value}>
                      {channel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="paymentMethod">طريقة الدفع <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value) => setSaleData(prev => ({ ...prev, paymentMethod: value }))}>
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sale Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium">عناصر البيع</h4>
              <Button 
                type="button" 
                onClick={addItem}
                data-testid="button-add-item"
              >
                <i className="fas fa-plus mr-2 ml-0"></i>
                إضافة عنصر
              </Button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                    <div>
                      <Label>المنتج</Label>
                      <Select onValueChange={(value) => {
                        updateItem(index, "productId", value);
                        const product = products?.find((p: any) => p.id === value);
                        if (product) {
                          updateItem(index, "unitPrice", parseFloat(saleData.channel === 'in-store' ? product.storePrice : product.onlinePrice));
                        }
                      }}>
                        <SelectTrigger data-testid={`select-product-${index}`}>
                          <SelectValue placeholder="اختر المنتج" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product: any) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.modelNumber} - {product.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>اللون</Label>
                      <Input
                        value={item.color}
                        onChange={(e) => updateItem(index, "color", e.target.value)}
                        placeholder="مثال: أسود، أبيض، أحمر"
                        data-testid={`input-color-${index}`}
                      />
                    </div>
                    
                    <div>
                      <Label>المقاس</Label>
                      <Input
                        value={item.size}
                        onChange={(e) => updateItem(index, "size", e.target.value)}
                        placeholder="مثال: 38، 40، L، XL"
                        data-testid={`input-size-${index}`}
                      />
                    </div>
                    
                    <div>
                      <Label>الكمية</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                        data-testid={`input-quantity-${index}`}
                      />
                    </div>
                    
                    <div>
                      <Label>سعر الوحدة</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        data-testid={`input-unit-price-${index}`}
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(index)}
                        data-testid={`button-remove-item-${index}`}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Available Inventory Display */}
                  {item.productId && (
                    <AvailableInventory
                      productId={item.productId}
                      onColorSelect={(color) => updateItem(index, "color", color)}
                      onSizeSelect={(size) => updateItem(index, "size", size)}
                      selectedColor={item.color}
                      selectedSize={item.size}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          {items.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span data-testid="text-subtotal">{calculateSubtotal().toFixed(2)} درهم</span>
                </div>
                {saleData.paymentMethod === 'visa' && (
                  <div className="flex justify-between">
                    <span>رسوم فيزا (5%):</span>
                    <span data-testid="text-fees">{(calculateSubtotal() * 0.05).toFixed(2)} درهم</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>المجموع الإجمالي:</span>
                  <span data-testid="text-total">{calculateTotal().toFixed(2)} درهم</span>
                </div>
              </div>
            </div>
          )}

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
              disabled={createSaleMutation.isPending}
              data-testid="button-save-sale"
            >
              {createSaleMutation.isPending ? "جاري الحفظ..." : "تسجيل البيع"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
