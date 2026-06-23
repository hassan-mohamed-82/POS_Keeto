"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.posPayments = exports.posSaleItems = exports.posSales = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../schema");
const customer_1 = require("./customer");
const cashier_1 = require("./cashier");
const cashiershift_1 = require("./cashiershift");
const restrauntadmin_1 = require("../admin/restrauntadmin");
const FinancialAccount_1 = require("../admin/FinancialAccount");
const food_1 = require("../admin/food");
// ==========================================
// 1. pos_sales (الفاتورة الرئيسية)
// ==========================================
exports.posSales = (0, mysql_core_1.mysqlTable)("pos_sales", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    reference: (0, mysql_core_1.varchar)("reference", { length: 8 }).unique().notNull(),
    restaurantId: (0, mysql_core_1.char)("restaurant_id", { length: 36 }).references(() => schema_1.restaurants.id).notNull(),
    branchId: (0, mysql_core_1.char)("branch_id", { length: 36 }).references(() => schema_1.branches.id),
    customerId: (0, mysql_core_1.char)("customer_id", { length: 36 }).references(() => customer_1.customer.id),
    dueCustomerId: (0, mysql_core_1.char)("due_customer_id", { length: 36 }).references(() => customer_1.customer.id),
    isDue: (0, mysql_core_1.boolean)("is_due").default(false),
    remainingAmount: (0, mysql_core_1.decimal)("remaining_amount", { precision: 10, scale: 2 }).default("0.00"),
    cashierId: (0, mysql_core_1.char)("cashier_id", { length: 36 }).references(() => cashier_1.cashiers.id).notNull(),
    shiftId: (0, mysql_core_1.char)("shift_id", { length: 36 }).references(() => cashiershift_1.cashiershift.id).notNull(),
    cashiermanId: (0, mysql_core_1.char)("cashierman_id", { length: 36 }).references(() => restrauntadmin_1.restrauntadmin.id).notNull(),
    accountId: (0, mysql_core_1.char)("account_id", { length: 36 }).references(() => FinancialAccount_1.FinancialAccounts.id),
    discountId: (0, mysql_core_1.char)("discount_id", { length: 36 }).references(() => schema_1.discounts.id),
    orderStatus: (0, mysql_core_1.mysqlEnum)("order_status", ["pending", "completed", "cancelled"]).default("completed").notNull(),
    subtotal: (0, mysql_core_1.decimal)("subtotal", { precision: 10, scale: 2 }).default("0.00").notNull(),
    taxRate: (0, mysql_core_1.decimal)("tax_rate", { precision: 5, scale: 2 }).default("0.00"),
    taxAmount: (0, mysql_core_1.decimal)("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
    discountAmount: (0, mysql_core_1.decimal)("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
    grandTotal: (0, mysql_core_1.decimal)("grand_total", { precision: 10, scale: 2 }).default("0.00").notNull(),
    paidAmount: (0, mysql_core_1.decimal)("paid_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
    note: (0, mysql_core_1.text)("note"),
    saleDate: (0, mysql_core_1.timestamp)("sale_date").defaultNow(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
// ==========================================
// 2. pos_sale_items (منتجات الفاتورة)
// ==========================================
exports.posSaleItems = (0, mysql_core_1.mysqlTable)("pos_sale_items", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    saleId: (0, mysql_core_1.char)("sale_id", { length: 36 }).references(() => exports.posSales.id, { onDelete: "cascade" }).notNull(),
    foodId: (0, mysql_core_1.char)("food_id", { length: 36 }).references(() => food_1.food.id).notNull(),
    quantity: (0, mysql_core_1.int)("quantity").notNull().default(1),
    unitPrice: (0, mysql_core_1.decimal)("unit_price", { precision: 10, scale: 2 }).notNull(),
    subtotal: (0, mysql_core_1.decimal)("subtotal", { precision: 10, scale: 2 }).notNull(),
    discount: (0, mysql_core_1.decimal)("discount", { precision: 10, scale: 2 }).default("0.00"),
    discountType: (0, mysql_core_1.mysqlEnum)("discount_type", ["fixed", "percentage"]).default("fixed"),
    originalPrice: (0, mysql_core_1.decimal)("original_price", { precision: 10, scale: 2 }).default("0.00"),
    variationOptionIds: (0, mysql_core_1.json)("variation_option_ids").$type().default([]),
    addonIds: (0, mysql_core_1.json)("addon_ids").$type().default([]),
    isGift: (0, mysql_core_1.boolean)("is_gift").default(false),
    note: (0, mysql_core_1.text)("note"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
// ==========================================
// 3. pos_payments (سجل الدفعات)
// ==========================================
exports.posPayments = (0, mysql_core_1.mysqlTable)("pos_payments", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    saleId: (0, mysql_core_1.char)("sale_id", { length: 36 }).references(() => exports.posSales.id, { onDelete: "cascade" }).notNull(),
    accountId: (0, mysql_core_1.char)("account_id", { length: 36 }).references(() => FinancialAccount_1.FinancialAccounts.id).notNull(),
    amount: (0, mysql_core_1.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ["pending", "completed"]).default("completed"),
    paymentProof: (0, mysql_core_1.varchar)("payment_proof", { length: 500 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
