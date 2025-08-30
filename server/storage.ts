import { 
  type Product, 
  type InsertProduct, 
  type ProductInventory, 
  type InsertProductInventory,
  type Sale,
  type InsertSale,
  type SaleItem,
  type InsertSaleItem,
  type Return,
  type InsertReturn,
  type ReturnItem,
  type InsertReturnItem,
  type Expense,
  type InsertExpense,
  type Purchase,
  type InsertPurchase,
  type ProductWithInventory,
  type SaleWithItems,
  type ReturnWithItems,
  COLORS,
  SIZES
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Products
  getProducts(): Promise<ProductWithInventory[]>;
  getProductById(id: string): Promise<ProductWithInventory | undefined>;
  getProductByModelNumber(modelNumber: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Product Inventory
  getProductInventory(productId: string): Promise<ProductInventory[]>;
  updateInventory(productId: string, color: string, size: string, quantity: number): Promise<ProductInventory>;
  bulkUpdateInventory(inventoryItems: (InsertProductInventory & { productId: string })[]): Promise<ProductInventory[]>;
  deleteProductInventory(productId: string): Promise<boolean>;
  
  // Sales
  getSales(): Promise<SaleWithItems[]>;
  getSaleById(id: string): Promise<SaleWithItems | undefined>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<SaleWithItems>;
  getSalesByDateRange(startDate: Date, endDate: Date): Promise<SaleWithItems[]>;
  
  // Returns
  getReturns(): Promise<ReturnWithItems[]>;
  getReturnById(id: string): Promise<ReturnWithItems | undefined>;
  createReturn(returnData: InsertReturn, items: InsertReturnItem[]): Promise<ReturnWithItems>;
  
  // Expenses
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]>;
  
  // Purchases
  getPurchases(): Promise<Purchase[]>;
  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getPurchasesByDateRange(startDate: Date, endDate: Date): Promise<Purchase[]>;
  
  // Analytics
  getDashboardStats(): Promise<{
    totalProducts: number;
    todaySales: number;
    outOfStockCount: number;
    onlineOrdersCount: number;
  }>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product> = new Map();
  private inventory: Map<string, ProductInventory> = new Map();
  private sales: Map<string, Sale> = new Map();
  private saleItems: Map<string, SaleItem> = new Map();
  private returns: Map<string, Return> = new Map();
  private returnItems: Map<string, ReturnItem> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private purchases: Map<string, Purchase> = new Map();

  constructor() {
    // Initialize with some sample data for testing
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample products
    const product1: Product = {
      id: randomUUID(),
      modelNumber: "EVE-001",
      companyName: "شركة الأزياء الراقية",
      productType: "evening-wear",
      storePrice: "890.00",
      onlinePrice: "850.00",
      imageUrl: null,
      specifications: "فستان سهرة أنيق مصنوع من أجود الأقمشة",
      createdAt: new Date(),
    };

    const product2: Product = {
      id: randomUUID(),
      modelNumber: "HIJ-025",
      companyName: "شركة الحجاب الفاخر",
      productType: "hijab",
      storePrice: "150.00",
      onlinePrice: "140.00",
      imageUrl: null,
      specifications: "حجاب حرير فاخر بجودة عالية",
      createdAt: new Date(),
    };

    this.products.set(product1.id, product1);
    this.products.set(product2.id, product2);

    // Sample inventory
    COLORS.forEach((color) => {
      SIZES.forEach((size) => {
        const inventory1: ProductInventory = {
          id: randomUUID(),
          productId: product1.id,
          color,
          size,
          quantity: Math.floor(Math.random() * 20) + 1,
        };
        const inventory2: ProductInventory = {
          id: randomUUID(),
          productId: product2.id,
          color,
          size,
          quantity: Math.floor(Math.random() * 10) + 1,
        };
        this.inventory.set(inventory1.id, inventory1);
        this.inventory.set(inventory2.id, inventory2);
      });
    });
  }

  // Products
  async getProducts(): Promise<ProductWithInventory[]> {
    const productsArray = Array.from(this.products.values());
    const productsWithInventory = await Promise.all(
      productsArray.map(async (product) => {
        const inventory = await this.getProductInventory(product.id);
        const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
        let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
        
        if (totalQuantity === 0) {
          status = 'out-of-stock';
        } else if (totalQuantity < 10) {
          status = 'low-stock';
        }

        return {
          ...product,
          inventory,
          totalQuantity,
          status,
        } as ProductWithInventory;
      })
    );
    
    return productsWithInventory;
  }

  async getProductById(id: string): Promise<ProductWithInventory | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const inventory = await this.getProductInventory(id);
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
    
    if (totalQuantity === 0) {
      status = 'out-of-stock';
    } else if (totalQuantity < 10) {
      status = 'low-stock';
    }

    return {
      ...product,
      inventory,
      totalQuantity,
      status,
    } as ProductWithInventory;
  }

  async getProductByModelNumber(modelNumber: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(p => p.modelNumber === modelNumber);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      ...insertProduct,
      id,
      imageUrl: insertProduct.imageUrl || null,
      specifications: insertProduct.specifications || null,
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;

    const updatedProduct = { ...existingProduct, ...updateData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Product Inventory
  async getProductInventory(productId: string): Promise<ProductInventory[]> {
    return Array.from(this.inventory.values()).filter(item => item.productId === productId);
  }

  async updateInventory(productId: string, color: string, size: string, quantity: number): Promise<ProductInventory> {
    const existingItem = Array.from(this.inventory.values()).find(
      item => item.productId === productId && item.color === color && item.size === size
    );

    if (existingItem) {
      existingItem.quantity = quantity;
      this.inventory.set(existingItem.id, existingItem);
      return existingItem;
    } else {
      const id = randomUUID();
      const newItem: ProductInventory = {
        id,
        productId,
        color,
        size,
        quantity,
      };
      this.inventory.set(id, newItem);
      return newItem;
    }
  }

  async bulkUpdateInventory(inventoryItems: (InsertProductInventory & { productId: string })[]): Promise<ProductInventory[]> {
    const results: ProductInventory[] = [];
    
    for (const item of inventoryItems) {
      const result = await this.updateInventory(item.productId, item.color, item.size, item.quantity || 0);
      results.push(result);
    }
    
    return results;
  }

  async deleteProductInventory(productId: string): Promise<boolean> {
    const inventoryItems = Array.from(this.inventory.entries()).filter(
      ([, item]) => item.productId === productId
    );
    
    for (const [id] of inventoryItems) {
      this.inventory.delete(id);
    }
    
    return true;
  }

  // Sales
  async getSales(): Promise<SaleWithItems[]> {
    const salesArray = Array.from(this.sales.values());
    return Promise.all(
      salesArray.map(async (sale) => {
        const items = Array.from(this.saleItems.values())
          .filter(item => item.saleId === sale.id)
          .map(item => ({
            ...item,
            product: this.products.get(item.productId)!,
          }));
        
        return {
          ...sale,
          items,
        } as SaleWithItems;
      })
    );
  }

  async getSaleById(id: string): Promise<SaleWithItems | undefined> {
    const sale = this.sales.get(id);
    if (!sale) return undefined;

    const items = Array.from(this.saleItems.values())
      .filter(item => item.saleId === id)
      .map(item => ({
        ...item,
        product: this.products.get(item.productId)!,
      }));

    return {
      ...sale,
      items,
    } as SaleWithItems;
  }

  async createSale(insertSale: InsertSale, items: InsertSaleItem[]): Promise<SaleWithItems> {
    const saleId = randomUUID();
    const invoiceNumber = `INV-${Date.now()}`;
    
    const sale: Sale = {
      ...insertSale,
      id: saleId,
      invoiceNumber,
      trackingNumber: insertSale.trackingNumber || null,
      fees: insertSale.fees || "0",
      createdAt: new Date(),
    };

    this.sales.set(saleId, sale);

    // Create sale items and update inventory
    const saleItemsWithProducts = [];
    for (const item of items) {
      const saleItemId = randomUUID();
      const saleItem: SaleItem = {
        ...item,
        id: saleItemId,
        saleId,
      };
      
      this.saleItems.set(saleItemId, saleItem);
      
      // Update inventory (decrease quantity)
      const inventoryItem = Array.from(this.inventory.values()).find(
        inv => inv.productId === item.productId && inv.color === item.color && inv.size === item.size
      );
      
      if (inventoryItem && inventoryItem.quantity >= item.quantity) {
        inventoryItem.quantity -= item.quantity;
        this.inventory.set(inventoryItem.id, inventoryItem);
      }

      saleItemsWithProducts.push({
        ...saleItem,
        product: this.products.get(item.productId)!,
      });
    }

    return {
      ...sale,
      items: saleItemsWithProducts,
    } as SaleWithItems;
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<SaleWithItems[]> {
    const allSales = await this.getSales();
    return allSales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }

  // Returns
  async getReturns(): Promise<ReturnWithItems[]> {
    const returnsArray = Array.from(this.returns.values());
    return Promise.all(
      returnsArray.map(async (returnData) => {
        const items = Array.from(this.returnItems.values())
          .filter(item => item.returnId === returnData.id)
          .map(item => ({
            ...item,
            product: this.products.get(item.productId)!,
          }));
        
        const originalSale = this.sales.get(returnData.originalSaleId)!;
        
        return {
          ...returnData,
          items,
          originalSale,
        } as ReturnWithItems;
      })
    );
  }

  async getReturnById(id: string): Promise<ReturnWithItems | undefined> {
    const returnData = this.returns.get(id);
    if (!returnData) return undefined;

    const items = Array.from(this.returnItems.values())
      .filter(item => item.returnId === id)
      .map(item => ({
        ...item,
        product: this.products.get(item.productId)!,
      }));

    const originalSale = this.sales.get(returnData.originalSaleId)!;

    return {
      ...returnData,
      items,
      originalSale,
    } as ReturnWithItems;
  }

  async createReturn(insertReturn: InsertReturn, items: InsertReturnItem[]): Promise<ReturnWithItems> {
    const returnId = randomUUID();
    
    const returnData: Return = {
      ...insertReturn,
      id: returnId,
      exchangeType: insertReturn.exchangeType || null,
      newProductId: insertReturn.newProductId || null,
      newColor: insertReturn.newColor || null,
      newSize: insertReturn.newSize || null,
      refundAmount: insertReturn.refundAmount || "0",
      createdAt: new Date(),
    };

    this.returns.set(returnId, returnData);

    // Create return items and handle inventory based on return type
    const returnItemsWithProducts = [];
    for (const item of items) {
      const returnItemId = randomUUID();
      const returnItem: ReturnItem = {
        ...item,
        id: returnItemId,
        returnId,
      };
      
      this.returnItems.set(returnItemId, returnItem);
      
      if (returnData.returnType === 'refund') {
        // For refunds: simply return items to original inventory
        const inventoryItem = Array.from(this.inventory.values()).find(
          inv => inv.productId === item.productId && inv.color === item.color && inv.size === item.size
        );
        
        if (inventoryItem) {
          inventoryItem.quantity += item.quantity;
          this.inventory.set(inventoryItem.id, inventoryItem);
        }
      } else if (returnData.returnType === 'exchange') {
        // Handle different types of exchanges
        if (returnData.exchangeType === 'product-to-product') {
          // Exchange with different product: return original item and deduct from new product
          const originalInventory = Array.from(this.inventory.values()).find(
            inv => inv.productId === item.productId && inv.color === item.color && inv.size === item.size
          );
          if (originalInventory) {
            originalInventory.quantity += item.quantity;
            this.inventory.set(originalInventory.id, originalInventory);
          }
          
          // Deduct from new product (same color/size as requested in exchange)
          if (returnData.newProductId) {
            const newInventory = Array.from(this.inventory.values()).find(
              inv => inv.productId === returnData.newProductId && inv.color === item.color && inv.size === item.size
            );
            if (newInventory && newInventory.quantity >= item.quantity) {
              newInventory.quantity -= item.quantity;
              this.inventory.set(newInventory.id, newInventory);
            }
          }
        } else if (returnData.exchangeType === 'color-change') {
          // Color change: return old color and deduct from new color
          const originalInventory = Array.from(this.inventory.values()).find(
            inv => inv.productId === item.productId && inv.color === item.color && inv.size === item.size
          );
          if (originalInventory) {
            originalInventory.quantity += item.quantity;
            this.inventory.set(originalInventory.id, originalInventory);
          }
          
          // Deduct from new color
          if (returnData.newColor) {
            const newColorInventory = Array.from(this.inventory.values()).find(
              inv => inv.productId === item.productId && inv.color === returnData.newColor && inv.size === item.size
            );
            if (newColorInventory && newColorInventory.quantity >= item.quantity) {
              newColorInventory.quantity -= item.quantity;
              this.inventory.set(newColorInventory.id, newColorInventory);
            }
          }
        } else if (returnData.exchangeType === 'size-change') {
          // Size change: return old size and deduct from new size
          const originalInventory = Array.from(this.inventory.values()).find(
            inv => inv.productId === item.productId && inv.color === item.color && inv.size === item.size
          );
          if (originalInventory) {
            originalInventory.quantity += item.quantity;
            this.inventory.set(originalInventory.id, originalInventory);
          }
          
          // Deduct from new size
          if (returnData.newSize) {
            const newSizeInventory = Array.from(this.inventory.values()).find(
              inv => inv.productId === item.productId && inv.color === item.color && inv.size === returnData.newSize
            );
            if (newSizeInventory && newSizeInventory.quantity >= item.quantity) {
              newSizeInventory.quantity -= item.quantity;
              this.inventory.set(newSizeInventory.id, newSizeInventory);
            }
          }
        }
      }

      returnItemsWithProducts.push({
        ...returnItem,
        product: this.products.get(item.productId)!,
      });
    }

    const originalSale = this.sales.get(insertReturn.originalSaleId)!;

    return {
      ...returnData,
      items: returnItemsWithProducts,
      originalSale,
    } as ReturnWithItems;
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = {
      ...insertExpense,
      id,
      date: insertExpense.date || new Date(),
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    const allExpenses = await this.getExpenses();
    return allExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }

  // Purchases
  async getPurchases(): Promise<Purchase[]> {
    return Array.from(this.purchases.values());
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const id = randomUUID();
    const purchase: Purchase = {
      ...insertPurchase,
      id,
      date: insertPurchase.date || new Date(),
    };
    this.purchases.set(id, purchase);
    return purchase;
  }

  async getPurchasesByDateRange(startDate: Date, endDate: Date): Promise<Purchase[]> {
    const allPurchases = await this.getPurchases();
    return allPurchases.filter(purchase => {
      const purchaseDate = new Date(purchase.date);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });
  }

  // Analytics
  async getDashboardStats(): Promise<{
    totalProducts: number;
    todaySales: number;
    outOfStockCount: number;
    onlineOrdersCount: number;
  }> {
    const products = await this.getProducts();
    const totalProducts = products.length;
    const outOfStockCount = products.filter(p => p.status === 'out-of-stock').length;

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const todaySalesData = await this.getSalesByDateRange(todayStart, todayEnd);
    const todaySales = todaySalesData.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
    
    const onlineOrdersCount = todaySalesData.filter(sale => sale.channel === 'online').length;

    return {
      totalProducts,
      todaySales,
      outOfStockCount,
      onlineOrdersCount,
    };
  }
}

export const storage = new MemStorage();
