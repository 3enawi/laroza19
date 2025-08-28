import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelNumber: varchar("model_number").notNull().unique(),
  companyName: text("company_name").notNull(),
  productType: varchar("product_type").notNull(),
  storePrice: decimal("store_price", { precision: 10, scale: 2 }).notNull(),
  onlinePrice: decimal("online_price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  specifications: text("specifications"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product inventory (colors and sizes)
export const productInventory = pgTable("product_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  color: varchar("color").notNull(), // black, white, red, blue, green, brown
  size: varchar("size").notNull(), // 38, 40, 42, 44, 46, 48, 50, 52
  quantity: integer("quantity").notNull().default(0),
});

// Sales table
export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  channel: varchar("channel").notNull(), // "in-store" or "online"
  paymentMethod: varchar("payment_method").notNull(), // "cash", "visa", "bank-transfer", "cod"
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  fees: decimal("fees", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sale items
export const saleItems = pgTable("sale_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id").references(() => sales.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  color: varchar("color").notNull(),
  size: varchar("size").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

// Returns table
export const returns = pgTable("returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalSaleId: varchar("original_sale_id").references(() => sales.id).notNull(),
  returnType: varchar("return_type").notNull(), // "refund" or "exchange"
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Return items
export const returnItems = pgTable("return_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  returnId: varchar("return_id").references(() => returns.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  color: varchar("color").notNull(),
  size: varchar("size").notNull(),
  quantity: integer("quantity").notNull(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // "rent", "salaries", "utilities", "other"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

// Purchase invoices from suppliers
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierName: text("supplier_name").notNull(),
  invoiceNumber: varchar("invoice_number").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

// Schemas for validation
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertProductInventorySchema = createInsertSchema(productInventory).omit({
  id: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
});

export const insertReturnSchema = createInsertSchema(returns).omit({
  id: true,
  createdAt: true,
});

export const insertReturnItemSchema = createInsertSchema(returnItems).omit({
  id: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
});

// Types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductInventory = typeof productInventory.$inferSelect;
export type InsertProductInventory = z.infer<typeof insertProductInventorySchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type Return = typeof returns.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type ReturnItem = typeof returnItems.$inferSelect;
export type InsertReturnItem = z.infer<typeof insertReturnItemSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

// Extended types for API responses
export type ProductWithInventory = Product & {
  inventory: ProductInventory[];
  totalQuantity: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
};

export type SaleWithItems = Sale & {
  items: (SaleItem & { product: Product })[];
};

export type ReturnWithItems = Return & {
  items: (ReturnItem & { product: Product })[];
  originalSale: Sale;
};

// Constants
export const COLORS = ['black', 'white', 'red', 'blue', 'green', 'brown'] as const;
export const SIZES = ['38', '40', '42', '44', '46', '48', '50', '52'] as const;
export const PRODUCT_TYPES = ['dress', 'evening-wear', 'hijab', 'abaya', 'accessories'] as const;
export const PAYMENT_METHODS = ['cash', 'visa', 'bank-transfer', 'cod'] as const;
export const EXPENSE_CATEGORIES = ['rent', 'salaries', 'utilities', 'other'] as const;
