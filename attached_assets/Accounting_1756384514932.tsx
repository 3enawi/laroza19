import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import AccountingReports from "@/components/accounting/AccountingReports";

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

  const createExpenseMutation = useMutation({
    mutationFn: api.createExpense,
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل المصروف بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/expenses"] });
      setShowExpenseForm(false);
      setExpenseData({ description: "", category: "", amount: "" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تسجيل المصروف",
        variant: "destructive",
      });
    },
  });

  const createPurchaseMutation = useMutation({
    mutationFn: api.createPurchase,
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل فاتورة الشراء بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      setShowPurchaseForm(false);
      setPurchaseData({ supplierName: "", invoiceNumber: "", totalAmount: "" });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تسجيل فاتورة الشراء",
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">المحاسبة</h1>
          <p className="text-muted-foreground">إدارة الشؤون المالية والتقارير المحاسبية</p>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-expense">
                <i className="fas fa-receipt mr-2 ml-0"></i>
                إضافة مصروف
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة مصروف جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="description">وصف المصروف <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="description"
                    value={expenseData.description}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف تفصيلي للمصروف"
                    required
                    data-testid="textarea-expense-description"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">فئة المصروف <span className="text-destructive">*</span></Label>
                  <Select onValueChange={(value) => setExpenseData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger data-testid="select-expense-category">
                      <SelectValue placeholder="اختر فئة المصروف" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="amount">المبلغ (درهم) <span className="text-destructive">*</span></Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                    data-testid="input-expense-amount"
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-4 space-x-reverse pt-4 border-t border-border">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowExpenseForm(false)}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createExpenseMutation.isPending}
                    data-testid="button-save-expense"
                  >
                    {createExpenseMutation.isPending ? "جاري الحفظ..." : "حفظ المصروف"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showPurchaseForm} onOpenChange={setShowPurchaseForm}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-purchase">
                <i className="fas fa-file-invoice mr-2 ml-0"></i>
                فاتورة شراء
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة فاتورة شراء</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="supplierName">اسم المورد <span className="text-destructive">*</span></Label>
                  <Input
                    id="supplierName"
                    value={purchaseData.supplierName}
                    onChange={(e) => setPurchaseData(prev => ({ ...prev, supplierName: e.target.value }))}
                    placeholder="اسم المورد أو الشركة"
                    required
                    data-testid="input-supplier-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="invoiceNumber">رقم الفاتورة <span className="text-destructive">*</span></Label>
                  <Input
                    id="invoiceNumber"
                    value={purchaseData.invoiceNumber}
                    onChange={(e) => setPurchaseData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    placeholder="رقم فاتورة المورد"
                    required
                    data-testid="input-purchase-invoice-number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="totalAmount">إجمالي المبلغ (درهم) <span className="text-destructive">*</span></Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    value={purchaseData.totalAmount}
                    onChange={(e) => setPurchaseData(prev => ({ ...prev, totalAmount: e.target.value }))}
                    placeholder="0.00"
                    required
                    data-testid="input-purchase-total-amount"
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-4 space-x-reverse pt-4 border-t border-border">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowPurchaseForm(false)}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPurchaseMutation.isPending}
                    data-testid="button-save-purchase"
                  >
                    {createPurchaseMutation.isPending ? "جاري الحفظ..." : "حفظ الفاتورة"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Accounting Reports */}
      <AccountingReports />
    </div>
  );
}
