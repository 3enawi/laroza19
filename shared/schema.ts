import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelNumber: text("model_number").notNull().unique(),
  companyName: text("company_name").notNull(),
  productType: text("product_type").notNull(),
  storePrice: decimal("store_price", { precision: 10, scale: 2 }).notNull(),
  onlinePrice: decimal("online_price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  specifications: text("specifications"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product inventory table
export const productInventory = pgTable("product_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  color: text("color").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull().default(0),
});

// Sales table
export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  channel: text("channel").notNull(), // 'in-store' or 'online'
  paymentMethod: text("payment_method").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  trackingNumber: text("tracking_number"), // For online sales only
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  fees: decimal("fees", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sale items table
export const saleItems = pgTable("sale_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id").notNull().references(() => sales.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  color: text("color").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
});

// Returns table
export const returns = pgTable("returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalSaleId: varchar("original_sale_id").notNull().references(() => sales.id),
  returnType: text("return_type").notNull(), // 'refund' or 'exchange'
  exchangeType: text("exchange_type"), // 'item-to-item' or 'size-to-size' for exchanges
  newProductId: varchar("new_product_id").references(() => products.id), // For item-to-item exchanges
  newColor: text("new_color"), // For exchanges
  newSize: text("new_size"), // For exchanges
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Return items table
export const returnItems = pgTable("return_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  returnId: varchar("return_id").notNull().references(() => returns.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  color: text("color").notNull(),
  size: text("size").notNull(),
  quantity: integer("quantity").notNull(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

// Purchases table
export const purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  supplier: text("supplier").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

// Insert schemas
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertProductInventorySchema = createInsertSchema(productInventory).omit({
  id: true,
  productId: true, // This will be added on the server side
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
  saleId: true,
});

export const insertReturnSchema = createInsertSchema(returns).omit({
  id: true,
  createdAt: true,
});

export const insertReturnItemSchema = createInsertSchema(returnItems).omit({
  id: true,
  returnId: true,
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

// Extended types
export interface ProductWithInventory extends Product {
  inventory: ProductInventory[];
  totalQuantity: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export interface SaleWithItems extends Sale {
  items: (SaleItem & { product: Product })[];
}

export interface ReturnWithItems extends Return {
  items: (ReturnItem & { product: Product })[];
  originalSale: Sale;
}

// Constants
export const COLORS = [
  "أسود", "أبيض", "أحمر", "أزرق", "أخضر", "وردي"
] as const;

export const SIZES = [
  "36", "38", "40", "42", "44", "46", "48", "50"
] as const;

export const PRODUCT_TYPES = [
  "dress", "evening-wear", "hijab", "abaya", "accessories"
] as const;

export const SALES_CHANNELS = [
  "in-store", "online"
] as const;

export const PAYMENT_METHODS = [
  "cash", "visa", "bank-transfer", "cash-on-delivery"
] as const;

export const RETURN_TYPES = [
  "refund", "exchange"
] as const;
