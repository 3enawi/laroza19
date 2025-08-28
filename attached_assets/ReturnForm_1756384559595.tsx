import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RETURN_TYPES } from "@/lib/constants";

interface ReturnFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReturnItem {
  productId: string;
  color: string;
  size: string;
  quantity: number;
}

export default function ReturnForm({ open, onOpenChange }: ReturnFormProps) {
  const [returnData, setReturnData] = useState({
    originalSaleId: "",
    returnType: "",
    refundAmount: "",
  });
  
  const [items, setItems] = useState<ReturnItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sales } = useQuery({
    queryKey: ["/api/sales"],
    queryFn: api.getSales,
  });

  const createReturnMutation = useMutation({
    mutationFn: api.createReturn,
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل المرتجع بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تسجيل المرتجع",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setReturnData({ originalSaleId: "", returnType: "", refundAmount: "" });
    setItems([]);
  };

  const loadSaleItems = (saleId: string) => {
    const sale = sales?.find((s: any) => s.id === saleId);
    if (sale) {
      const saleItems = sale.items.map((item: any) => ({
        productId: item.productId,
        color: item.color,
        size: item.size,
        quantity: 1, // Default to 1, user can adjust
      }));
      setItems(saleItems);
      setReturnData(prev => ({ ...prev, refundAmount: sale.total }));
    }
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      productId: "",
      color: "",
      size: "",
      quantity: 1,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ReturnItem, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast({
        title: "خطأ",
        description: "يجب إضافة عنصر واحد على الأقل للإرجاع",
        variant: "destructive",
      });
      return;
    }

    createReturnMutation.mutate({
      return: {
        originalSaleId: returnData.originalSaleId,
        returnType: returnData.returnType,
        refundAmount: returnData.returnType === 'refund' ? returnData.refundAmount : "0",
      },
      items,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>تسجيل مرتجع</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Return Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="originalSaleId">الفاتورة الأصلية <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value) => {
                setReturnData(prev => ({ ...prev, originalSaleId: value }));
                loadSaleItems(value);
              }}>
                <SelectTrigger data-testid="select-original-sale">
                  <SelectValue placeholder="اختر الفاتورة الأصلية" />
                </SelectTrigger>
                <SelectContent>
                  {sales?.map((sale: any) => (
                    <SelectItem key={sale.id} value={sale.id}>
                      {sale.invoiceNumber} - {sale.total} درهم
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="returnType">نوع المرتجع <span className="text-destructive">*</span></Label>
              <Select onValueChange={(value) => setReturnData(prev => ({ ...prev, returnType: value }))}>
                <SelectTrigger data-testid="select-return-type">
                  <SelectValue placeholder="اختر نوع المرتجع" />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {returnData.returnType === 'refund' && (
              <div className="md:col-span-2">
                <Label htmlFor="refundAmount">مبلغ الاسترداد (درهم) <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  value={returnData.refundAmount}
                  onChange={(e) => setReturnData(prev => ({ ...prev, refundAmount: e.target.value }))}
                  placeholder="0.00"
                  data-testid="input-refund-amount"
                />
              </div>
            )}
          </div>

          {/* Return Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium">عناصر المرتجع</h4>
              <Button 
                type="button" 
                onClick={addItem}
                data-testid="button-add-return-item"
              >
                <i className="fas fa-plus mr-2 ml-0"></i>
                إضافة عنصر
              </Button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <Label>المنتج ID</Label>
                      <Input
                        value={item.productId}
                        onChange={(e) => updateItem(index, "productId", e.target.value)}
                        placeholder="معرف المنتج"
                        data-testid={`input-product-id-${index}`}
                      />
                    </div>
                    
                    <div>
                      <Label>اللون</Label>
                      <Input
                        value={item.color}
                        onChange={(e) => updateItem(index, "color", e.target.value)}
                        placeholder="مثال: أسود، أبيض، أحمر"
                        data-testid={`input-return-color-${index}`}
                      />
                    </div>
                    
                    <div>
                      <Label>المقاس</Label>
                      <Input
                        value={item.size}
                        onChange={(e) => updateItem(index, "size", e.target.value)}
                        placeholder="مثال: 38، 40، L، XL"
                        data-testid={`input-return-size-${index}`}
                      />
                    </div>
                    
                    <div>
                      <Label>الكمية</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                        data-testid={`input-return-quantity-${index}`}
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(index)}
                        data-testid={`button-remove-return-item-${index}`}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 space-x-reverse pt-6 border-t border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
}
