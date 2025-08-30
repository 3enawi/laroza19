import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { BarChart, DollarSign, TrendingUp, Package } from "lucide-react";

export default function Accounting() {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [expenseData, setExpenseData] = useState({
    description: "",
    category: "",
    amount: "",
  });
  const [purchaseData, setPurchaseData] = useState({
    supplierName: "",
    invoiceNumber: "",
    totalAmount: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/expenses"],
  });

  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ["/api/purchases"],
  });

  const { data: sales } = useQuery({
    queryKey: ["/api/sales"],
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: data.description,
          category: data.category,
          amount: data.amount,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create expense');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل المصروف بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setShowExpenseForm(false);
      setExpenseData({ description: "", category: "", amount: "" });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل المصروف",
        variant: "destructive",
      });
    },
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplier: data.supplierName,
          description: `فاتورة رقم ${data.invoiceNumber}`,
          amount: data.totalAmount,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create purchase');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل فاتورة الشراء بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      setShowPurchaseForm(false);
      setPurchaseData({ supplierName: "", invoiceNumber: "", totalAmount: "" });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل فاتورة الشراء",
        variant: "destructive",
      });
    },
  });

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpenseMutation.mutate(expenseData);
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPurchaseMutation.mutate(purchaseData);
  };

  // حساب الإحصائيات
  const totalSales = (sales as any[])?.reduce((sum, sale) => sum + parseFloat(sale.total), 0) || 0;
  const totalExpenses = (expenses as any[])?.reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0;
  const totalPurchases = (purchases as any[])?.reduce((sum, purchase) => sum + parseFloat(purchase.amount), 0) || 0;
  const netProfit = totalSales - totalExpenses - totalPurchases;

  const expenseCategories = [
    { value: "rent", label: "إيجار" },
    { value: "utilities", label: "فواتير" },
    { value: "marketing", label: "تسويق" },
    { value: "supplies", label: "مستلزمات" },
    { value: "transportation", label: "نقل" },
    { value: "other", label: "أخرى" }
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="المحاسبة" subtitle="إدارة المصروفات والتقارير المالية" />
        
        <div className="p-6 overflow-y-auto h-full space-y-6">
          {/* الإحصائيات المالية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalSales.toFixed(2)} درهم</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{totalExpenses.toFixed(2)} درهم</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المشتريات</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{totalPurchases.toFixed(2)} درهم</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {netProfit.toFixed(2)} درهم
                </div>
              </CardContent>
            </Card>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button onClick={() => setShowExpenseForm(true)}>
              إضافة مصروف جديد
            </Button>
            <Button onClick={() => setShowPurchaseForm(true)} variant="outline">
              إضافة فاتورة شراء
            </Button>
          </div>

          {/* قائمة المصروفات */}
          <Card>
            <CardHeader>
              <CardTitle>المصروفات الأخيرة</CardTitle>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <p>جاري التحميل...</p>
              ) : (expenses as any[])?.length > 0 ? (
                <div className="space-y-3">
                  {(expenses as any[]).map((expense: any) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">{expense.category}</p>
                      </div>
                      <Badge variant="destructive">{expense.amount} درهم</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">لا توجد مصروفات مسجلة</p>
              )}
            </CardContent>
          </Card>

          {/* قائمة فواتير الشراء */}
          <Card>
            <CardHeader>
              <CardTitle>فواتير الشراء الأخيرة</CardTitle>
            </CardHeader>
            <CardContent>
              {purchasesLoading ? (
                <p>جاري التحميل...</p>
              ) : (purchases as any[])?.length > 0 ? (
                <div className="space-y-3">
                  {(purchases as any[]).map((purchase: any) => (
                    <div key={purchase.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{purchase.supplier}</p>
                        <p className="text-sm text-muted-foreground">{purchase.description}</p>
                      </div>
                      <Badge variant="secondary">{purchase.amount} درهم</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">لا توجد فواتير شراء مسجلة</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* نافذة إضافة مصروف */}
        {showExpenseForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md m-4">
              <CardHeader>
                <CardTitle>إضافة مصروف جديد</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Input
                      id="description"
                      value={expenseData.description}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">الفئة</Label>
                    <Select 
                      value={expenseData.category} 
                      onValueChange={(value) => setExpenseData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">المبلغ (درهم)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={expenseData.amount}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={() => setShowExpenseForm(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={createExpenseMutation.isPending}>
                      حفظ
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* نافذة إضافة فاتورة شراء */}
        {showPurchaseForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md m-4">
              <CardHeader>
                <CardTitle>إضافة فاتورة شراء</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="supplierName">اسم المورد</Label>
                    <Input
                      id="supplierName"
                      value={purchaseData.supplierName}
                      onChange={(e) => setPurchaseData(prev => ({ ...prev, supplierName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceNumber">رقم الفاتورة</Label>
                    <Input
                      id="invoiceNumber"
                      value={purchaseData.invoiceNumber}
                      onChange={(e) => setPurchaseData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalAmount">المبلغ الإجمالي (درهم)</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      step="0.01"
                      value={purchaseData.totalAmount}
                      onChange={(e) => setPurchaseData(prev => ({ ...prev, totalAmount: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={() => setShowPurchaseForm(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={createPurchaseMutation.isPending}>
                      حفظ
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}