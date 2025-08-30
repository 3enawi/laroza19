import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ReturnForm from "@/components/returns/return-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { RotateCcw } from "lucide-react";

export default function Returns() {
  const [showReturnForm, setShowReturnForm] = useState(false);

  const { data: returns, isLoading } = useQuery({
    queryKey: ["/api/returns"],
  });

  const returnsArray = (returns as any) || [];

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="المرتجعات" subtitle="إدارة المرتجعات والاستبدالات" />
        
        <div className="p-6 overflow-y-auto h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">سجل المرتجعات</h2>
            <button 
              onClick={() => setShowReturnForm(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              data-testid="button-new-return"
            >
              تسجيل مرتجع جديد
            </button>
          </div>

          {isLoading ? (
            <div className="text-center">جاري التحميل...</div>
          ) : (
            <div className="space-y-4">
              {returnsArray.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <RotateCcw className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">لا توجد مرتجعات مسجلة بعد</p>
                  </CardContent>
                </Card>
              ) : (
                returnsArray.map((returnItem: any) => (
                  <Card key={returnItem.id} data-testid={`card-return-${returnItem.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          مرتجع #{returnItem.id.slice(-8)}
                        </CardTitle>
                        <Badge variant={returnItem.returnType === 'refund' ? 'destructive' : 'secondary'}>
                          {returnItem.returnType === 'refund' ? 'استرداد' : 'استبدال'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">الفاتورة الأصلية:</span>
                          <p className="font-medium">{returnItem.originalSale?.invoiceNumber || 'غير محدد'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">مبلغ الاسترداد:</span>
                          <p className="font-bold text-primary">{returnItem.refundAmount} درهم</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">التاريخ:</span>
                          <p className="text-sm">{new Date(returnItem.createdAt).toLocaleDateString('ar-AE')}</p>
                        </div>
                      </div>
                      
                      {/* Exchange Details */}
                      {returnItem.returnType === 'exchange' && returnItem.exchangeType && (
                        <div className="mt-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
                          <span className="text-sm font-medium text-accent-foreground mb-2 block">تفاصيل الاستبدال:</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">نوع الاستبدال:</span>
                              <p className="font-medium">
                                {returnItem.exchangeType === 'product-to-product' && 'استبدال منتج بمنتج آخر'}
                                {returnItem.exchangeType === 'color-change' && 'تغيير اللون'}
                                {returnItem.exchangeType === 'size-change' && 'تغيير المقاس'}
                              </p>
                            </div>
                            
                            {returnItem.exchangeType === 'product-to-product' && returnItem.newProductId && (
                              <div>
                                <span className="text-muted-foreground">المنتج الجديد:</span>
                                <p className="font-medium">معرف المنتج: {returnItem.newProductId}</p>
                              </div>
                            )}
                            
                            {returnItem.exchangeType === 'color-change' && returnItem.newColor && (
                              <div>
                                <span className="text-muted-foreground">اللون الجديد:</span>
                                <p className="font-medium">{returnItem.newColor}</p>
                              </div>
                            )}
                            
                            {returnItem.exchangeType === 'size-change' && returnItem.newSize && (
                              <div>
                                <span className="text-muted-foreground">المقاس الجديد:</span>
                                <p className="font-medium">{returnItem.newSize}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {returnItem.items && returnItem.items.length > 0 && (
                        <div className="mt-4">
                          <span className="text-muted-foreground text-sm">العناصر المرتجعة:</span>
                          <div className="mt-2 space-y-1">
                            {returnItem.items.map((item: any, index: number) => (
                              <div key={index} className="text-sm bg-muted/30 p-2 rounded">
                                {item.product?.modelNumber} - {item.color} - {item.size} (الكمية: {item.quantity})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {showReturnForm && (
        <ReturnForm onClose={() => setShowReturnForm(false)} />
      )}
    </div>
  );
}
