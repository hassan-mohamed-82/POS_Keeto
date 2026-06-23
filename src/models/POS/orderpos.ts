import {
    mysqlTable,
    varchar,
    char,
    timestamp,
    decimal,
    mysqlEnum,
    int,
    boolean,
    text,
    json
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { restaurants, branches, discounts } from "../schema";
import { customer } from "./customer";
import { cashiers } from "./cashier";
import { cashiershift } from "./cashiershift";
import { restrauntadmin } from "../admin/restrauntadmin";
import { FinancialAccounts } from "../admin/FinancialAccount";
import { food } from "../admin/food";

// ==========================================
// 1. pos_sales (الفاتورة الرئيسية)
// ==========================================
export const posSales = mysqlTable("pos_sales", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    
    reference: varchar("reference", { length: 8 }).unique().notNull(),
    
    restaurantId: char("restaurant_id", { length: 36 }).references(() => restaurants.id).notNull(),
    branchId: char("branch_id", { length: 36 }).references(() => branches.id),
    
    customerId: char("customer_id", { length: 36 }).references(() => customer.id),
    dueCustomerId: char("due_customer_id", { length: 36 }).references(() => customer.id),
    isDue: boolean("is_due").default(false),
    remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).default("0.00"),
    
    cashierId: char("cashier_id", { length: 36 }).references(() => cashiers.id).notNull(),
    shiftId: char("shift_id", { length: 36 }).references(() => cashiershift.id).notNull(),
    cashiermanId: char("cashierman_id", { length: 36 }).references(() => restrauntadmin.id).notNull(),
    
    accountId: char("account_id", { length: 36 }).references(() => FinancialAccounts.id),
    discountId: char("discount_id", { length: 36 }).references(() => discounts.id),
    
    orderStatus: mysqlEnum("order_status", ["pending", "completed", "cancelled"]).default("completed").notNull(),
    
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0.00").notNull(),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
    grandTotal: decimal("grand_total", { precision: 10, scale: 2 }).default("0.00").notNull(),
    paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
    
    note: text("note"),
    
    saleDate: timestamp("sale_date").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ==========================================
// 2. pos_sale_items (منتجات الفاتورة)
// ==========================================
export const posSaleItems = mysqlTable("pos_sale_items", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    
    saleId: char("sale_id", { length: 36 }).references(() => posSales.id, { onDelete: "cascade" }).notNull(),
    foodId: char("food_id", { length: 36 }).references(() => food.id).notNull(),
    
    quantity: int("quantity").notNull().default(1),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    
    discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
    discountType: mysqlEnum("discount_type", ["fixed", "percentage"]).default("fixed"),
    originalPrice: decimal("original_price", { precision: 10, scale: 2 }).default("0.00"),
    
    variationOptionIds: json("variation_option_ids").$type<string[]>().default([]),
    addonIds: json("addon_ids").$type<string[]>().default([]),
    
    isGift: boolean("is_gift").default(false),
    note: text("note"),
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// ==========================================
// 3. pos_payments (سجل الدفعات)
// ==========================================
export const posPayments = mysqlTable("pos_payments", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    
    saleId: char("sale_id", { length: 36 }).references(() => posSales.id, { onDelete: "cascade" }).notNull(),
    accountId: char("account_id", { length: 36 }).references(() => FinancialAccounts.id).notNull(),
    
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    status: mysqlEnum("status", ["pending", "completed"]).default("completed"),
    paymentProof: varchar("payment_proof", { length: 500 }),
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
