import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import ProductTable from "@/components/products/product-table";
import AddProductModal from "@/components/products/add-product-modal";
import { useState } from "react";

export default function Inventory() {
  const [showAddProduct, setShowAddProduct] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const productsArray = (products as any) || [];

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Header title="إدارة المخزون" subtitle="إدارة المنتجات والمخزون" />
        
        <div className="p-6 overflow-y-auto h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">جدول المنتجات</h2>
            <button 
              onClick={() => setShowAddProduct(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              data-testid="button-add-product"
            >
              إضافة منتج جديد
            </button>
          </div>

          <ProductTable products={productsArray} isLoading={isLoading} />
        </div>
      </main>

      {showAddProduct && (
        <AddProductModal onClose={() => setShowAddProduct(false)} />
      )}
    </div>
  );
}
