import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Edit, Trash2, Package } from "lucide-react";
import type { ProductWithInventory } from "@shared/schema";

interface ProductTableProps {
  products?: ProductWithInventory[];
  isLoading: boolean;
}

export default function ProductTable({ products, isLoading }: ProductTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
      
      <CardContent>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {products?.length === 0 ? "لا توجد منتجات مضافة بعد" : "لم يتم العثور على منتجات مطابقة"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الموديل</TableHead>
                  <TableHead className="text-right">الشركة</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">سعر المتجر</TableHead>
                  <TableHead className="text-right">سعر الأونلاين</TableHead>
                  <TableHead className="text-right">المخزون</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow key={product.id} className="hover:bg-muted/30">
                    <TableCell data-testid={`cell-model-${index + 1}`}>
                      {product.modelNumber}
                    </TableCell>
                    <TableCell data-testid={`cell-company-${index + 1}`}>
                      {product.companyName}
                    </TableCell>
                    <TableCell data-testid={`cell-type-${index + 1}`}>
                      {getProductTypeName(product.productType)}
                    </TableCell>
                    <TableCell data-testid={`cell-store-price-${index + 1}`}>
                      {product.storePrice} درهم
                    </TableCell>
                    <TableCell data-testid={`cell-online-price-${index + 1}`}>
                      {product.onlinePrice} درهم
                    </TableCell>
                    <TableCell>
                      {product.totalQuantity} قطعة
                    </TableCell>
                    <TableCell data-testid={`cell-status-${index + 1}`}>
                      {getStatusBadge(product.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button variant="ghost" size="sm" title="تعديل">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="عرض التفاصيل">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="حذف">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
