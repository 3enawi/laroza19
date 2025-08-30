import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Edit, Trash2, Package, Image as ImageIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import EditProductModal from "./edit-product-modal";
import type { ProductWithInventory } from "@shared/schema";

interface ProductTableProps {
  products?: ProductWithInventory[];
  isLoading: boolean;
}

export default function ProductTable({ products, isLoading }: ProductTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithInventory | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المنتج",
        variant: "destructive"
      });
    }
  });

  const handleView = (product: ProductWithInventory) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleEdit = (product: ProductWithInventory) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      deleteProductMutation.mutate(id);
    }
  };

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.modelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <Badge className="bg-accent text-accent-foreground">متوفر</Badge>;
      case 'low-stock':
        return <Badge variant="secondary">مخزون قليل</Badge>;
      case 'out-of-stock':
        return <Badge variant="destructive">نفذ</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const getProductTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      'dress': 'فستان',
      'evening-wear': 'فستان سهرة',
      'hijab': 'حجاب',
      'abaya': 'عباية',
      'accessories': 'إكسسوارات'
    };
    return typeMap[type] || type;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">جاري تحميل المنتجات...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* الجدول الرئيسي مع عرض محسن يظهر صورة وتفاصيل المنتج */}
      <div className="space-y-6">
        {/* البحث والفلترة */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">جدول المخزون</h3>
              <div className="flex items-center space-x-4 space-x-reverse">
                <Input 
                  type="text" 
                  placeholder="البحث في المنتجات..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                  data-testid="input-search-products"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المنتجات</SelectItem>
                    <SelectItem value="in-stock">متوفر</SelectItem>
                    <SelectItem value="low-stock">مخزون قليل</SelectItem>
                    <SelectItem value="out-of-stock">نفذ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* عرض المنتجات في شكل بطاقات مع صور */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {products?.length === 0 ? "لا توجد منتجات مضافة بعد" : "لم يتم العثور على منتجات مطابقة"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* صورة المنتج */}
                <div className="aspect-[3/4] bg-muted flex items-center justify-center relative overflow-hidden">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={`صورة ${product.modelNumber}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`text-center ${product.imageUrl ? 'hidden' : ''}`}>
                    <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">صورة المنتج</p>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  {/* معلومات المنتج */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-right">{product.modelNumber}</h3>
                      <p className="text-muted-foreground text-right">{product.companyName}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">النوع</p>
                        <p className="font-medium">{getProductTypeName(product.productType)}</p>
                      </div>
                      <div>{getStatusBadge(product.status)}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-right">
                      <div>
                        <p className="text-sm text-muted-foreground">سعر المتجر</p>
                        <p className="font-bold text-primary">{product.storePrice} درهم</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">سعر الأونلاين</p>
                        <p className="font-bold text-accent">{product.onlinePrice} درهم</p>
                      </div>
                    </div>
                    
                    <div className="text-center p-2 bg-muted/30 rounded">
                      <p className="text-sm text-muted-foreground">المخزون المتاح</p>
                      <p className="font-bold text-lg">{product.totalQuantity} قطعة</p>
                    </div>
                    
                    {/* أزرار الإجراءات */}
                    <div className="flex items-center justify-center space-x-2 space-x-reverse pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="تعديل"
                        onClick={() => handleEdit(product)}
                        data-testid={`button-edit-${product.id}`}
                      >
                        <Edit className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="عرض التفاصيل"
                        onClick={() => handleView(product)}
                        data-testid={`button-view-${product.id}`}
                      >
                        <Eye className="h-4 w-4 ml-1" />
                        التفاصيل
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="حذف"
                        onClick={() => handleDelete(product.id)}
                        disabled={deleteProductMutation.isPending}
                        data-testid={`button-delete-${product.id}`}
                      >
                        <Trash2 className="h-4 w-4 ml-1 text-destructive" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* نافذة عرض التفاصيل */}
      {selectedProduct && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تفاصيل المنتج - {selectedProduct.modelNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* صورة المنتج */}
              <div className="flex justify-center">
                <div className="w-48 h-64 bg-muted rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                  {selectedProduct.imageUrl ? (
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={`صورة ${selectedProduct.modelNumber}`}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`text-center ${selectedProduct.imageUrl ? 'hidden' : ''}`}>
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="text-muted-foreground text-sm">لا توجد صورة</span>
                  </div>
                </div>
              </div>
              
              {/* معلومات المنتج */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">رقم الموديل</label>
                  <p className="text-lg font-semibold">{selectedProduct.modelNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">اسم الشركة</label>
                  <p className="text-lg">{selectedProduct.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">نوع المنتج</label>
                  <p className="text-lg">{getProductTypeName(selectedProduct.productType)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                  <div className="mt-1">{getStatusBadge(selectedProduct.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">سعر المتجر</label>
                  <p className="text-lg font-bold text-primary">{selectedProduct.storePrice} درهم</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">سعر الأونلاين</label>
                  <p className="text-lg font-bold text-accent">{selectedProduct.onlinePrice} درهم</p>
                </div>
              </div>
              
              {/* تفاصيل المخزون بعرض موسع */}
              <div className="w-full">
                <label className="text-lg font-bold text-center block mb-4">تفاصيل المخزون</label>
                
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-primary">{selectedProduct.totalQuantity}</p>
                    <p className="text-lg text-muted-foreground">إجمالي القطع المتاحة</p>
                  </div>
                  
                  {/* عرض تفاصيل الألوان والمقاسات مرتبة حسب اللون */}
                  {selectedProduct.inventory && selectedProduct.inventory.length > 0 ? (
                    <div>
                      <h4 className="text-lg font-semibold mb-4 text-center">توزيع المخزون</h4>
                      
                      {/* Group inventory by color and display each color with all its sizes */}
                      {(() => {
                        const groupedByColor: Record<string, any[]> = {};
                        selectedProduct.inventory.forEach((item: any) => {
                          if (!groupedByColor[item.color]) {
                            groupedByColor[item.color] = [];
                          }
                          groupedByColor[item.color].push(item);
                        });
                        
                        return Object.entries(groupedByColor)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([color, items]) => (
                          <div key={color} className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-primary/10 p-4 border-b border-gray-200">
                              <h5 className="text-xl font-bold text-primary text-center">{color}</h5>
                              <p className="text-sm text-muted-foreground text-center mt-1">
                                إجمالي الكمية: {items.reduce((sum, item) => sum + item.quantity, 0)} قطعة
                              </p>
                            </div>
                            <div className="p-4">
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {items
                                  .sort((a, b) => a.size.localeCompare(b.size))
                                  .map((item: any, index: number) => (
                                  <div key={index} className="bg-accent/10 p-3 rounded-lg text-center border border-accent/20">
                                    <div className="text-lg font-bold text-gray-800 mb-1">
                                      {item.size}
                                    </div>
                                    <div className="text-2xl font-bold text-accent">
                                      {item.quantity}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      قطعة
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                      
                      {/* ملخص الألوان */}
                      <div className="mt-6 p-4 bg-white/50 rounded-lg">
                        <h5 className="font-semibold mb-2 text-center">ملخص الألوان المتاحة:</h5>
                        <div className="flex flex-wrap justify-center gap-2">
                          {Array.from(new Set(selectedProduct.inventory.map((item: any) => item.color))).map((color: string) => {
                            const colorTotal = selectedProduct.inventory
                              .filter((item: any) => item.color === color)
                              .reduce((sum: number, item: any) => sum + item.quantity, 0);
                            return (
                              <div key={color} className="bg-primary/20 px-3 py-1 rounded-full text-sm">
                                <span className="font-medium">{color}</span>: {colorTotal} قطعة
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* ملخص المقاسات */}
                      <div className="mt-4 p-4 bg-white/50 rounded-lg">
                        <h5 className="font-semibold mb-2 text-center">ملخص المقاسات المتاحة:</h5>
                        <div className="flex flex-wrap justify-center gap-2">
                          {Array.from(new Set(selectedProduct.inventory.map((item: any) => item.size))).map((size: string) => {
                            const sizeTotal = selectedProduct.inventory
                              .filter((item: any) => item.size === size)
                              .reduce((sum: number, item: any) => sum + item.quantity, 0);
                            return (
                              <div key={size} className="bg-accent/20 px-3 py-1 rounded-full text-sm">
                                <span className="font-medium">{size}</span>: {sizeTotal} قطعة
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground">لا توجد تفاصيل مخزون متاحة</p>
                      <p className="text-sm text-muted-foreground mt-2">يرجى إضافة مخزون لهذا المنتج</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* نافذة التعديل */}
      {selectedProduct && (
        <EditProductModal 
          product={selectedProduct} 
          open={isEditModalOpen} 
          onOpenChange={setIsEditModalOpen}
        />
      )}
    </>
  );
}