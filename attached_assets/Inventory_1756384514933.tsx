import { useState } from "react";
import ProductTable from "@/components/inventory/ProductTable";
import AddProductModal from "@/components/inventory/AddProductModal";
import { Button } from "@/components/ui/button";

export default function Inventory() {
  const [showAddProduct, setShowAddProduct] = useState(false);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المخزون</h1>
          <p className="text-muted-foreground">إدارة وتتبع جميع منتجات المتجر</p>
        </div>
        <Button 
          onClick={() => setShowAddProduct(true)}
          data-testid="button-add-product-inventory"
        >
          <i className="fas fa-plus mr-2 ml-0"></i>
          إضافة منتج جديد
        </Button>
      </div>

      {/* Product Table */}
      <ProductTable />

      {/* Add Product Modal */}
      <AddProductModal 
        open={showAddProduct} 
        onOpenChange={setShowAddProduct}
      />
    </div>
  );
}
