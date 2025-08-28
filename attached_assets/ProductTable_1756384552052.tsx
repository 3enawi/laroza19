import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { STATUS_LABELS } from "@/lib/constants";
import type { ProductWithInventory } from "@shared/schema";

export default function ProductTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: api.getProducts,
  });

  const deleteProductMutation = useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم حذف المنتج بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المنتج",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products?.filter((product: ProductWithInventory) => {
    const matchesSearch = product.modelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      deleteProductMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'in-stock': { label: STATUS_LABELS['in-stock'], variant: 'default' as const },
      'low-stock': { label: STATUS_LABELS['low-stock'], variant: 'secondary' as const },
      'out-of-stock': { label: STATUS_LABELS['out-of-stock'], variant: 'destructive' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap['in-stock'];
    return (
      <Badge variant={statusInfo.variant} className="status-badge">
        {statusInfo.label}
      </Badge>
    );
  };

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">جدول المخزون</h3>
          <div className="flex items-center space-x-4 space-x-reverse">
            <Input
              placeholder="البحث في المنتجات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              data-testid="input-search-products"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="تصفية حسب الحالة" />
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
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الموديل</TableHead>
              <TableHead className="text-right">الشركة</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">سعر المتجر</TableHead>
              <TableHead className="text-right">سعر الأونلاين</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product: ProductWithInventory) => (
              <TableRow key={product.id} className="hover:bg-muted/30">
                <TableCell data-testid={`cell-model-${product.id}`}>
                  {product.modelNumber}
                </TableCell>
                <TableCell data-testid={`cell-company-${product.id}`}>
                  {product.companyName}
                </TableCell>
                <TableCell data-testid={`cell-type-${product.id}`}>
                  {product.productType}
                </TableCell>
                <TableCell data-testid={`cell-store-price-${product.id}`}>
                  {product.storePrice} درهم
                </TableCell>
                <TableCell data-testid={`cell-online-price-${product.id}`}>
                  {product.onlinePrice} درهم
                </TableCell>
                <TableCell data-testid={`cell-status-${product.id}`}>
                  {getStatusBadge(product.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="تعديل"
                      data-testid={`button-edit-${product.id}`}
                    >
                      <i className="fas fa-edit text-primary"></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="عرض التفاصيل"
                      data-testid={`button-view-${product.id}`}
                    >
                      <i className="fas fa-eye text-muted-foreground"></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="حذف"
                      onClick={() => handleDelete(product.id)}
                      disabled={deleteProductMutation.isPending}
                      data-testid={`button-delete-${product.id}`}
                    >
                      <i className="fas fa-trash text-destructive"></i>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          لا توجد منتجات تطابق معايير البحث
        </div>
      )}
    </div>
  );
}
