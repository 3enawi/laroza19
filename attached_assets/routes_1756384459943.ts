import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProductSchema, 
  insertProductInventorySchema,
  insertSaleSchema,
  insertSaleItemSchema,
  insertReturnSchema,
  insertReturnItemSchema,
  insertExpenseSchema,
  insertPurchaseSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body.product);
      const inventoryData = z.array(insertProductInventorySchema).parse(req.body.inventory);

      // Check if model number already exists
      const existingProduct = await storage.getProductByModelNumber(productData.modelNumber);
      if (existingProduct) {
        return res.status(400).json({ message: "Model number already exists" });
      }

      const product = await storage.createProduct(productData);
      
      // Add inventory items
      const inventoryItems = inventoryData.map(item => ({ ...item, productId: product.id }));
      await storage.bulkUpdateInventory(inventoryItems);

      const productWithInventory = await storage.getProductById(product.id);
      res.status(201).json(productWithInventory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const updatedProduct = await storage.updateProduct(req.params.id, productData);
      
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const productWithInventory = await storage.getProductById(req.params.id);
      res.json(productWithInventory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Inventory routes
  app.get("/api/products/:id/inventory", async (req, res) => {
    try {
      const inventory = await storage.getProductInventory(req.params.id);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.put("/api/products/:id/inventory", async (req, res) => {
    try {
      const { color, size, quantity } = req.body;
      const updatedInventory = await storage.updateInventory(req.params.id, color, size, quantity);
      res.json(updatedInventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inventory" });
    }
  });

  // Sales routes
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const saleData = insertSaleSchema.parse(req.body.sale);
      const items = z.array(insertSaleItemSchema).parse(req.body.items);

      // Calculate fees for Visa payments
      let fees = 0;
      if (saleData.paymentMethod === 'visa') {
        fees = parseFloat(saleData.subtotal) * 0.05; // 5% fee
      }

      const total = parseFloat(saleData.subtotal) + fees;
      
      const saleWithCalculations = {
        ...saleData,
        fees: fees.toFixed(2),
        total: total.toFixed(2),
      };

      const sale = await storage.createSale(saleWithCalculations, items);
      res.status(201).json(sale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // Returns routes
  app.get("/api/returns", async (req, res) => {
    try {
      const returns = await storage.getReturns();
      res.json(returns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch returns" });
    }
  });

  app.post("/api/returns", async (req, res) => {
    try {
      const returnData = insertReturnSchema.parse(req.body.return);
      const items = z.array(insertReturnItemSchema).parse(req.body.items);

      const returnRecord = await storage.createReturn(returnData, items);
      res.status(201).json(returnRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create return" });
    }
  });

  // Expenses routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  // Purchases routes
  app.get("/api/purchases", async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.post("/api/purchases", async (req, res) => {
    try {
      const purchaseData = insertPurchaseSchema.parse(req.body);
      const purchase = await storage.createPurchase(purchaseData);
      res.status(201).json(purchase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Reports routes
  app.get("/api/reports/sales", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const sales = await storage.getSalesByDateRange(start, end);
      
      // Calculate totals by channel
      const inStoreSales = sales.filter(sale => sale.channel === 'in-store');
      const onlineSales = sales.filter(sale => sale.channel === 'online');
      
      const inStoreTotal = inStoreSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
      const onlineTotal = onlineSales.reduce((sum, sale) => sum + parseFloat(sale.total), 0);
      
      res.json({
        sales,
        summary: {
          totalSales: inStoreTotal + onlineTotal,
          inStoreTotal,
          onlineTotal,
          inStoreCount: inStoreSales.length,
          onlineCount: onlineSales.length,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate sales report" });
    }
  });

  app.get("/api/reports/expenses", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      const expenses = await storage.getExpensesByDateRange(start, end);
      const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      
      res.json({
        expenses,
        totalExpenses,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate expenses report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
