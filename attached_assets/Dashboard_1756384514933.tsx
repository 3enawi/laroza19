import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { STATUS_LABELS } from "@/lib/constants";
import { Link } from "wouter";
import type { ProductWithInventory, SaleWithItems } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: api.getDashboardStats,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: api.getProducts,
  });

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["/api/sales"],
    queryFn: api.getSales,
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'in-stock': { label: STATUS_LABELS['in-stock'], className: 'status-badge status-in-stock' },
      'low-stock': { label: STATUS_LABELS['low-stock'], className: 'status-badge status-low-stock' },
      'out-of-stock': { label: STATUS_LABELS['out-of-stock'], className: 'status-badge status-out-of-stock' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap['in-stock'];
    return (
      <span className={statusInfo.className}>
        {statusInfo.label}
      </span>
    );
  };

  const getPaymentMethodIcon = (paymentMethod: string, channel: string) => {
    if (channel === 'online') {
      return paymentMethod === 'bank-transfer' ? 
        <i className="fas fa-university text-primary"></i> : 
        <i className="fas fa-globe text-primary"></i>;
    }
    return paymentMethod === 'visa' ? 
      <i className="fas fa-credit-card text-accent"></i> : 
      <i className="fas fa-money-bill-wave text-accent"></i>;
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const saleDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} دقيقة`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `منذ ${hours} ساعة`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `منذ ${days} يوم`;
    }
  };

  // Get recent products (last 3)
  const recentProducts = products?.slice(0, 3) || [];
  
  // Get recent sales (last 3)
  const recentSales = sales?.slice(0, 3) || [];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي المنتجات</p>
                <p className="text-3xl font-bold text-primary" data-testid="stat-total-products">
                  {statsLoading ? "..." : stats?.totalProducts || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-boxes text-primary"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-accent">↗ 12%</span>
              <span className="text-muted-foreground mr-2">عن الشهر الماضي</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مبيعات اليوم</p>
                <p className="text-3xl font-bold text-accent" data-testid="stat-today-sales">
                  {statsLoading ? "..." : `${stats?.todaySales?.toFixed(2) || "0.00"}`}
                  <span className="text-lg mr-1">درهم</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-accent"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-accent">↗ 8%</span>
              <span className="text-muted-foreground mr-2">عن أمس</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">منتجات نفدت</p>
                <p className="text-3xl font-bold text-destructive" data-testid="stat-out-of-stock">
                  {statsLoading ? "..." : stats?.outOfStockCount || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-destructive"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-destructive">تحتاج إعادة تخزين</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">طلبات أونلاين</p>
                <p className="text-3xl font-bold text-primary" data-testid="stat-online-orders">
                  {statsLoading ? "..." : stats?.onlineOrdersCount || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-globe text-primary"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-muted-foreground">في انتظار المعالجة</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Products */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle>أحدث المنتجات</CardTitle>
              <Link href="/inventory">
                <Button variant="ghost" size="sm" data-testid="link-view-all-products">
                  عرض الكل
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {productsLoading ? (
              <div>جاري التحميل...</div>
            ) : (
              <div className="space-y-4">
                {recentProducts.map((product: ProductWithInventory) => (
                  <div key={product.id} className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <i className="fas fa-tshirt text-muted-foreground"></i>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`product-name-${product.id}`}>
                        {product.companyName}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`product-model-${product.id}`}>
                        موديل: {product.modelNumber}
                      </p>
                    </div>
                    <div className="text-left">
                      {getStatusBadge(product.status)}
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`product-price-${product.id}`}>
                        {product.storePrice} درهم
                      </p>
                    </div>
                  </div>
                ))}
                {recentProducts.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    لا توجد منتجات متاحة
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle>المبيعات الأخيرة</CardTitle>
              <Link href="/sales">
                <Button variant="ghost" size="sm" data-testid="link-view-all-sales">
                  عرض الكل
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {salesLoading ? (
              <div>جاري التحميل...</div>
            ) : (
              <div className="space-y-4">
                {recentSales.map((sale: SaleWithItems) => (
                  <div key={sale.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        sale.channel === 'online' ? 'bg-primary' : 'bg-accent'
                      }`}>
                        {getPaymentMethodIcon(sale.paymentMethod, sale.channel)}
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`sale-invoice-${sale.id}`}>
                          فاتورة #{sale.invoiceNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sale.channel === 'in-store' ? 'متجر' : 'أونلاين'} - {
                            sale.paymentMethod === 'cash' ? 'نقداً' :
                            sale.paymentMethod === 'visa' ? 'فيزا' :
                            sale.paymentMethod === 'bank-transfer' ? 'تحويل بنكي' :
                            'دفع عند الاستلام'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold ${sale.channel === 'online' ? 'text-primary' : 'text-accent'}`} 
                         data-testid={`sale-total-${sale.id}`}>
                        {parseFloat(sale.total).toFixed(2)} درهم
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(sale.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {recentSales.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    لا توجد مبيعات متاحة
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/inventory">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2"
                data-testid="quick-action-add-product"
              >
                <i className="fas fa-plus text-2xl text-primary"></i>
                <div className="text-center">
                  <p className="font-medium">إضافة منتج</p>
                  <p className="text-sm text-muted-foreground">أضف منتج جديد للمخزون</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/sales">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2"
                data-testid="quick-action-new-sale"
              >
                <i className="fas fa-shopping-cart text-2xl text-accent"></i>
                <div className="text-center">
                  <p className="font-medium">بيع جديد</p>
                  <p className="text-sm text-muted-foreground">تسجيل عملية بيع</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/returns">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2"
                data-testid="quick-action-return"
              >
                <i className="fas fa-undo text-2xl text-destructive"></i>
                <div className="text-center">
                  <p className="font-medium">مرتجع</p>
                  <p className="text-sm text-muted-foreground">تسجيل مرتجع</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/accounting">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center space-y-2"
                data-testid="quick-action-reports"
              >
                <i className="fas fa-chart-bar text-2xl text-primary"></i>
                <div className="text-center">
                  <p className="font-medium">التقارير</p>
                  <p className="text-sm text-muted-foreground">عرض التقارير المالية</p>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
