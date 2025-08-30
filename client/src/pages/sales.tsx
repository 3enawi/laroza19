import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import SaleForm from "@/components/sales/sale-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { TrendingUp } from "lucide-react";

export default function Sales() {
  const [showSaleForm, setShowSaleForm] = useState(false);

  const { data: sales, isLoading } = useQuery({
    queryKey: ["/api/sales"],
  });

  const salesArray = (sales as any) || [];

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="المبيعات" subtitle="إدارة المبيعات وتسجيل العمليات الجديدة" />
        
        <div className="p-6 overflow-y-auto h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">سجل المبيعات</h2>
            <button 
              onClick={() => setShowSaleForm(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              data-testid="button-new-sale"
            >
              تسجيل بيع جديد
            </button>
          </div>

          {isLoading ? (
            <div className="text-center">جاري التحميل...</div>
          ) : (
            <div className="space-y-4">
              {salesArray.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">لا توجد مبيعات مسجلة بعد</p>
                  </CardContent>
                </Card>
              ) : (
                salesArray.map((sale: any) => (
                  <Card key={sale.id} data-testid={`card-sale-${sale.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          فاتورة رقم: {sale.invoiceNumber}
                        </CardTitle>
                        <Badge variant={sale.channel === 'online' ? 'secondary' : 'default'}>
                          {sale.channel === 'online' ? 'أونلاين' : 'في المتجر'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">طريقة الدفع:</span>
                          <p className="font-medium">{sale.paymentMethod}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">المجموع الفرعي:</span>
                          <p className="font-medium">{sale.subtotal} درهم</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الرسوم:</span>
                          <p className="font-medium">{sale.fees} درهم</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">المجموع الإجمالي:</span>
                          <p className="font-bold text-primary">{sale.total} درهم</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">التاريخ:</span>
                          <p className="text-sm">{new Date(sale.createdAt).toLocaleDateString('ar-AE')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">اسم العميل:</span>
                          <p className="font-medium">{sale.customerName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">رقم الهاتف:</span>
                          <p className="font-medium">{sale.customerPhone}</p>
                        </div>
                        {sale.channel === 'online' && sale.trackingNumber && (
                          <div className="md:col-span-3">
                            <span className="text-muted-foreground">رقم التتبع:</span>
                            <p className="font-medium text-accent">{sale.trackingNumber}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {showSaleForm && (
        <SaleForm onClose={() => setShowSaleForm(false)} />
      )}
    </div>
  );
}
