import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import ReturnForm from "@/components/returns/ReturnForm";
import type { ReturnWithItems } from "@shared/schema";

export default function Returns() {
  const [showReturnForm, setShowReturnForm] = useState(false);

  const { data: returns, isLoading } = useQuery({
    queryKey: ["/api/returns"],
    queryFn: api.getReturns,
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

  const getReturnTypeBadge = (type: string) => {
    return type === 'refund' ? (
      <Badge variant="destructive">استرداد</Badge>
    ) : (
      <Badge variant="default">استبدال</Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المرتجعات</h1>
          <p className="text-muted-foreground">إدارة وتتبع جميع عمليات الإرجاع</p>
        </div>
        <Button 
          onClick={() => setShowReturnForm(true)}
          data-testid="button-new-return"
        >
          <i className="fas fa-plus mr-2 ml-0"></i>
          مرتجع جديد
        </Button>
      </div>

      {/* Returns Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المرتجعات</CardTitle>
            <i className="fas fa-undo text-destructive"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isLoading ? "..." : returns?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستردات</CardTitle>
            <i className="fas fa-money-bill-wave text-orange-500"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {isLoading ? "..." : 
                `${returns?.filter((r: ReturnWithItems) => r.returnType === 'refund')
                  .reduce((sum: number, returnItem: ReturnWithItems) => sum + parseFloat(returnItem.refundAmount), 0).toFixed(2) || "0.00"} درهم`
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عمليات الاستبدال</CardTitle>
            <i className="fas fa-exchange-alt text-blue-500"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {isLoading ? "..." : 
                returns?.filter((r: ReturnWithItems) => r.returnType === 'exchange').length || 0
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجل المرتجعات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الفاتورة الأصلية</TableHead>
                    <TableHead className="text-right">نوع المرتجع</TableHead>
                    <TableHead className="text-right">مبلغ الاسترداد</TableHead>
                    <TableHead className="text-right">عدد العناصر</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns?.map((returnItem: ReturnWithItems) => (
                    <TableRow key={returnItem.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium" data-testid={`return-original-sale-${returnItem.id}`}>
                        {returnItem.originalSale.invoiceNumber}
                      </TableCell>
                      <TableCell data-testid={`return-type-${returnItem.id}`}>
                        {getReturnTypeBadge(returnItem.returnType)}
                      </TableCell>
                      <TableCell data-testid={`return-refund-${returnItem.id}`}>
                        {parseFloat(returnItem.refundAmount).toFixed(2)} درهم
                      </TableCell>
                      <TableCell data-testid={`return-items-count-${returnItem.id}`}>
                        {returnItem.items.length}
                      </TableCell>
                      <TableCell data-testid={`return-date-${returnItem.id}`}>
                        {formatDateTime(returnItem.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="عرض التفاصيل"
                            data-testid={`button-view-return-${returnItem.id}`}
                          >
                            <i className="fas fa-eye text-muted-foreground"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="طباعة"
                            data-testid={`button-print-return-${returnItem.id}`}
                          >
                            <i className="fas fa-print text-primary"></i>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {returns?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد مرتجعات مسجلة
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Form Modal */}
      <ReturnForm 
        open={showReturnForm} 
        onOpenChange={setShowReturnForm}
      />
    </div>
  );
}
