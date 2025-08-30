import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProductSchema, 
  insertSaleSchema, 
  insertSaleItemSchema,
  insertReturnSchema,
  insertReturnItemSchema,
  insertExpenseSchema,
  insertPurchaseSchema,
  insertProductInventorySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body.product);
      const inventoryData = req.body.inventory?.map((item: any) => 
        insertProductInventorySchema.parse(item)
      ) || [];

      // Check if model number already exists
      const existingProduct = await storage.getProductByModelNumber(productData.modelNumber);
      if (existingProduct) {
        return res.status(400).json({ message: "Product with this model number already exists" });
      }

      const product = await storage.createProduct(productData);
      
      // Create inventory entries
      if (inventoryData.length > 0) {
        const inventoryWithProductId = inventoryData.map((item: any) => ({
          ...item,
          productId: product.id
        }));
        await storage.bulkUpdateInventory(inventoryWithProductId);
      }

      const productWithInventory = await storage.getProductById(product.id);
      res.status(201).json(productWithInventory);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid product data", errors: error });
      } else {
        res.status(500).json({ message: "Failed to create product" });
      }
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      // Handle both product data and inventory data
      if (req.body.product && req.body.inventory) {
        // Full update with inventory
        const productData = insertProductSchema.parse(req.body.product);
        const inventoryData = req.body.inventory?.map((item: any) => 
          insertProductInventorySchema.parse(item)
        ) || [];

        const product = await storage.updateProduct(req.params.id, productData);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        // Update inventory - delete all existing and add new ones
        await storage.deleteProductInventory(req.params.id);
        if (inventoryData.length > 0) {
          const inventoryWithProductId = inventoryData.map((item: any) => ({
            ...item,
            productId: req.params.id
          }));
          await storage.bulkUpdateInventory(inventoryWithProductId);
        }

        const productWithInventory = await storage.getProductById(req.params.id);
        res.json(productWithInventory);
      } else {
        // Simple product data update only
        const requestBody = { ...req.body };
        if (typeof requestBody.storePrice === 'number') {
          requestBody.storePrice = requestBody.storePrice.toString();
        }
        if (typeof requestBody.onlinePrice === 'number') {
          requestBody.onlinePrice = requestBody.onlinePrice.toString();
        }
        
        const productData = insertProductSchema.partial().parse(requestBody);
        const product = await storage.updateProduct(req.params.id, productData);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Inventory routes
  app.get("/api/products/:id/inventory", async (req, res) => {
    try {
      const inventory = await storage.getProductInventory(req.params.id);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.put("/api/inventory", async (req, res) => {
    try {
      const inventoryData = req.body.map((item: any) => 
        insertProductInventorySchema.parse(item)
      );
      const inventory = await storage.bulkUpdateInventory(inventoryData);
      res.json(inventory);
    } catch (error) {
      console.error("Error updating inventory:", error);
      res.status(500).json({ message: "Failed to update inventory" });
    }
  });

  // Sales routes
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/:id", async (req, res) => {
    try {
      const sale = await storage.getSaleById(req.params.id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      console.error("Error fetching sale:", error);
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const saleData = insertSaleSchema.parse(req.body.sale);
      const itemsData = req.body.items.map((item: any) => 
        insertSaleItemSchema.parse(item)
      );

      // Validate inventory availability
      for (const item of itemsData) {
        const inventory = await storage.getProductInventory(item.productId);
        const availableItem = inventory.find(
          inv => inv.color === item.color && inv.size === item.size
        );
        
        if (!availableItem || availableItem.quantity < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient inventory for ${item.color} ${item.size}. Available: ${availableItem?.quantity || 0}, Requested: ${item.quantity}` 
          });
        }
      }

      const sale = await storage.createSale(saleData, itemsData);
      res.status(201).json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid sale data", errors: error });
      } else {
        res.status(500).json({ message: "Failed to create sale" });
      }
    }
  });

  // Returns routes
  app.get("/api/returns", async (req, res) => {
    try {
      const returns = await storage.getReturns();
      res.json(returns);
    } catch (error) {
      console.error("Error fetching returns:", error);
      res.status(500).json({ message: "Failed to fetch returns" });
    }
  });

  app.post("/api/returns", async (req, res) => {
    try {
      const returnData = insertReturnSchema.parse(req.body.return);
      const itemsData = req.body.items.map((item: any) => 
        insertReturnItemSchema.parse(item)
      );

      const returnRecord = await storage.createReturn(returnData, itemsData);
      res.status(201).json(returnRecord);
    } catch (error) {
      console.error("Error creating return:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid return data", errors: error });
      } else {
        res.status(500).json({ message: "Failed to create return" });
      }
    }
  });

  // Expenses routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      // تحويل المبلغ إلى string إذا كان number
      const requestBody = { ...req.body };
      if (typeof requestBody.amount === 'number') {
        requestBody.amount = requestBody.amount.toString();
      }
      
      const expenseData = insertExpenseSchema.parse(requestBody);
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  // Purchases routes
  app.get("/api/purchases", async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.post("/api/purchases", async (req, res) => {
    try {
      // تحويل المبلغ إلى string إذا كان number
      const requestBody = { ...req.body };
      if (typeof requestBody.amount === 'number') {
        requestBody.amount = requestBody.amount.toString();
      }
      
      const purchaseData = insertPurchaseSchema.parse(requestBody);
      const purchase = await storage.createPurchase(purchaseData);
      res.status(201).json(purchase);
    } catch (error) {
      console.error("Error creating purchase:", error);
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  // Dashboard analytics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
