import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import SaleForm from "@/components/sales/SaleForm";
import type { SaleWithItems } from "@shared/schema";

export default function Sales() {
  const [showSaleForm, setShowSaleForm] = useState(false);

  const { data: sales, isLoading } = useQuery({
    queryKey: ["/api/sales"],
    queryFn: api.getSales,
  });

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChannelBadge = (channel: string) => {
    return channel === 'in-store' ? (
      <Badge variant="default">متجر</Badge>
    ) : (
      <Badge variant="secondary">أونلاين</Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      'cash': 'نقداً',
      'visa': 'فيزا',
      'bank-transfer': 'تحويل بنكي',
      'cod': 'دفع عند الاستلام',
    };
    return methods[method as keyof typeof methods] || method;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المبيعات</h1>
          <p className="text-muted-foreground">إدارة وتتبع جميع عمليات البيع</p>
        </div>
        <Button 
          onClick={() => setShowSaleForm(true)}
          data-testid="button-new-sale"
        >
          <i className="fas fa-plus mr-2 ml-0"></i>
          بيع جديد
        </Button>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات اليوم</CardTitle>
            <i className="fas fa-chart-line text-accent"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {isLoading ? "..." : 
                `${sales?.filter((s: SaleWithItems) => {
                  const saleDate = new Date(s.createdAt);
                  const today = new Date();
                  return saleDate.toDateString() === today.toDateString();
                }).reduce((sum: number, sale: SaleWithItems) => sum + parseFloat(sale.total), 0).toFixed(2) || "0.00"} درهم`
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مبيعات المتجر</CardTitle>
            <i className="fas fa-store text-primary"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {isLoading ? "..." : 
                `${sales?.filter((s: SaleWithItems) => s.channel === 'in-store')
                  .reduce((sum: number, sale: SaleWithItems) => sum + parseFloat(sale.total), 0).toFixed(2) || "0.00"} درهم`
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مبيعات أونلاين</CardTitle>
            <i className="fas fa-globe text-blue-500"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {isLoading ? "..." : 
                `${sales?.filter((s: SaleWithItems) => s.channel === 'online')
                  .reduce((sum: number, sale: SaleWithItems) => sum + parseFloat(sale.total), 0).toFixed(2) || "0.00"} درهم`
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجل المبيعات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الفاتورة</TableHead>
                    <TableHead className="text-right">القناة</TableHead>
                    <TableHead className="text-right">طريقة الدفع</TableHead>
                    <TableHead className="text-right">المجموع الفرعي</TableHead>
                    <TableHead className="text-right">الرسوم</TableHead>
                    <TableHead className="text-right">المجموع الإجمالي</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales?.map((sale: SaleWithItems) => (
                    <TableRow key={sale.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium" data-testid={`sale-invoice-${sale.id}`}>
                        {sale.invoiceNumber}
                      </TableCell>
                      <TableCell data-testid={`sale-channel-${sale.id}`}>
                        {getChannelBadge(sale.channel)}
                      </TableCell>
                      <TableCell data-testid={`sale-payment-${sale.id}`}>
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </TableCell>
                      <TableCell data-testid={`sale-subtotal-${sale.id}`}>
                        {parseFloat(sale.subtotal).toFixed(2)} درهم
                      </TableCell>
                      <TableCell data-testid={`sale-fees-${sale.id}`}>
                        {parseFloat(sale.fees).toFixed(2)} درهم
                      </TableCell>
                      <TableCell className="font-semibold" data-testid={`sale-total-${sale.id}`}>
                        {parseFloat(sale.total).toFixed(2)} درهم
                      </TableCell>
                      <TableCell data-testid={`sale-date-${sale.id}`}>
                        {formatDateTime(sale.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="عرض التفاصيل"
                            data-testid={`button-view-sale-${sale.id}`}
                          >
                            <i className="fas fa-eye text-muted-foreground"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="طباعة"
                            data-testid={`button-print-sale-${sale.id}`}
                          >
                            <i className="fas fa-print text-primary"></i>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {sales?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد مبيعات مسجلة
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sale Form Modal */}
      <SaleForm 
        open={showSaleForm} 
        onOpenChange={setShowSaleForm}
      />
    </div>
  );
}
