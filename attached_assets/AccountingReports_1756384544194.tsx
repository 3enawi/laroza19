import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AccountingReports() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
  });
  
  const [reportType, setReportType] = useState("monthly");

  const { data: salesReport, refetch: refetchSales } = useQuery({
    queryKey: ["/api/reports/sales", dateRange.startDate, dateRange.endDate],
    queryFn: () => api.getSalesReport(dateRange.startDate, dateRange.endDate),
  });

  const { data: expensesReport, refetch: refetchExpenses } = useQuery({
    queryKey: ["/api/reports/expenses", dateRange.startDate, dateRange.endDate],
    queryFn: () => api.getExpensesReport(dateRange.startDate, dateRange.endDate),
  });

  const { data: expenses } = useQuery({
    queryKey: ["/api/expenses"],
    queryFn: api.getExpenses,
  });

  const handleDateRangeChange = () => {
    refetchSales();
    refetchExpenses();
  };

  const calculateProfitLoss = () => {
    const totalRevenue = salesReport?.summary.totalSales || 0;
    const totalExpenses = expensesReport?.totalExpenses || 0;
    return totalRevenue - totalExpenses;
  };

  const getQuickDateRange = (type: string) => {
    const today = new Date();
    let startDate: Date;
    
    switch (type) {
      case "today":
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case "week":
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return;
    }
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Range Controls */}
      <Card>
        <CardHeader>
          <CardTitle>فترة التقرير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="startDate">من تاريخ</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                data-testid="input-start-date"
              />
            </div>
            <div>
              <Label htmlFor="endDate">إلى تاريخ</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                data-testid="input-end-date"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleDateRangeChange}
                data-testid="button-apply-date-range"
              >
                تطبيق
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => getQuickDateRange("today")}
              data-testid="button-today"
            >
              اليوم
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => getQuickDateRange("week")}
              data-testid="button-week"
            >
              هذا الأسبوع
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => getQuickDateRange("month")}
              data-testid="button-month"
            >
              هذا الشهر
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => getQuickDateRange("year")}
              data-testid="button-year"
            >
              هذا العام
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <i className="fas fa-chart-line text-accent"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent" data-testid="text-total-sales">
              {salesReport?.summary.totalSales?.toFixed(2) || "0.00"} درهم
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مبيعات المتجر</CardTitle>
            <i className="fas fa-store text-primary"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary" data-testid="text-instore-sales">
              {salesReport?.summary.inStoreTotal?.toFixed(2) || "0.00"} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              {salesReport?.summary.inStoreCount || 0} معاملة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مبيعات أونلاين</CardTitle>
            <i className="fas fa-globe text-blue-500"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500" data-testid="text-online-sales">
              {salesReport?.summary.onlineTotal?.toFixed(2) || "0.00"} درهم
            </div>
            <p className="text-xs text-muted-foreground">
              {salesReport?.summary.onlineCount || 0} معاملة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
            <i className="fas fa-receipt text-destructive"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-total-expenses">
              {expensesReport?.totalExpenses?.toFixed(2) || "0.00"} درهم
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit/Loss Card */}
      <Card>
        <CardHeader>
          <CardTitle>الربح والخسارة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold" data-testid="text-profit-loss">
            <span className={calculateProfitLoss() >= 0 ? "text-accent" : "text-destructive"}>
              {calculateProfitLoss().toFixed(2)} درهم
            </span>
            <span className="text-sm font-normal text-muted-foreground mr-2">
              {calculateProfitLoss() >= 0 ? "(ربح)" : "(خسارة)"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Report */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الفاتورة</TableHead>
                    <TableHead className="text-right">القناة</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReport?.sales.slice(0, 10).map((sale: any) => (
                    <TableRow key={sale.id}>
                      <TableCell data-testid={`sale-invoice-${sale.id}`}>
                        {sale.invoiceNumber}
                      </TableCell>
                      <TableCell data-testid={`sale-channel-${sale.id}`}>
                        {sale.channel === 'in-store' ? 'متجر' : 'أونلاين'}
                      </TableCell>
                      <TableCell data-testid={`sale-total-${sale.id}`}>
                        {parseFloat(sale.total).toFixed(2)} درهم
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Report */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesReport?.expenses.slice(0, 10).map((expense: any) => (
                    <TableRow key={expense.id}>
                      <TableCell data-testid={`expense-desc-${expense.id}`}>
                        {expense.description}
                      </TableCell>
                      <TableCell data-testid={`expense-category-${expense.id}`}>
                        {expense.category}
                      </TableCell>
                      <TableCell data-testid={`expense-amount-${expense.id}`}>
                        {parseFloat(expense.amount).toFixed(2)} درهم
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
