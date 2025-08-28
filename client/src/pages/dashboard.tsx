import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ProductTable from "@/components/products/product-table";
import AddProductModal from "@/components/products/add-product-modal";
import SaleForm from "@/components/sales/sale-form";
import ReturnForm from "@/components/returns/return-form";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Package, TrendingUp, AlertTriangle, RotateCcw } from "lucide-react";

export default function Dashboard() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const statsData = (stats as any) || {};
  const productsArray = (products as any) || [];

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="لوحة التحكم الرئيسية" subtitle="مرحباً بك في نظام إدارة متجر لاروزا" />
        
        <div className="p-6 overflow-y-auto h-full">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
                    <p className="text-3xl font-bold text-primary" data-testid="text-total-products">
                      {statsLoading ? "..." : statsData.totalProducts || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="text-primary text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">مبيعات اليوم</p>
                    <p className="text-3xl font-bold text-accent" data-testid="text-today-sales">
                      {statsLoading ? "..." : statsData.todaySales || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">درهم إماراتي</p>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-accent text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">مخزون منخفض</p>
                    <p className="text-3xl font-bold text-destructive" data-testid="text-low-stock">
                      {statsLoading ? "..." : statsData.outOfStockCount || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">منتج يحتاج تجديد</p>
                  </div>
                  <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-destructive text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">طلبات أونلاين</p>
                    <p className="text-3xl font-bold text-muted-foreground" data-testid="text-online-orders">
                      {statsLoading ? "..." : statsData.onlineOrdersCount || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">اليوم</p>
                  </div>
                  <div className="w-12 h-12 bg-muted/20 rounded-lg flex items-center justify-center">
                    <RotateCcw className="text-muted-foreground text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">الإجراءات السريعة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => setShowAddProduct(true)}
                className="bg-primary text-primary-foreground p-4 rounded-lg hover:bg-primary/90 transition-colors"
                data-testid="button-add-product"
              >
                <div className="flex items-center gap-3">
                  <Package className="text-xl" />
                  <span className="font-medium">إضافة منتج جديد</span>
                </div>
              </button>
              <button 
                onClick={() => setShowSaleForm(true)}
                className="bg-accent text-accent-foreground p-4 rounded-lg hover:bg-accent/90 transition-colors"
                data-testid="button-new-sale"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-xl" />
                  <span className="font-medium">تسجيل بيع جديد</span>
                </div>
              </button>
              <button 
                onClick={() => setShowReturnForm(true)}
                className="bg-secondary text-secondary-foreground p-4 rounded-lg hover:bg-secondary/80 transition-colors"
                data-testid="button-new-return"
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="text-xl" />
                  <span className="font-medium">تسجيل مرتجع</span>
                </div>
              </button>
            </div>
          </div>

          {/* Product Inventory Table */}
          <ProductTable products={productsArray} isLoading={productsLoading} />
        </div>
      </main>

      {/* Modals */}
      {showAddProduct && (
        <AddProductModal onClose={() => setShowAddProduct(false)} />
      )}
      {showSaleForm && (
        <SaleForm onClose={() => setShowSaleForm(false)} />
      )}
      {showReturnForm && (
        <ReturnForm onClose={() => setShowReturnForm(false)} />
      )}
    </div>
  );
}
