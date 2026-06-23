"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cashiershift = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const restrauntadmin_1 = require("../admin/restrauntadmin");
const cashier_1 = require("./cashier");
const schema_1 = require("../schema");
exports.cashiershift = (0, mysql_core_1.mysqlTable)("cashiershifts", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    startTime: (0, mysql_core_1.timestamp)("start_time").defaultNow(),
    endTime: (0, mysql_core_1.timestamp)("end_time"),
    restaurantid: (0, mysql_core_1.char)("restaurant_id", { length: 36 }).references(() => schema_1.restaurants.id).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ["open", "closed"]).default("open"),
    totalSaleAmount: (0, mysql_core_1.decimal)("total_sale_amount", { precision: 10, scale: 2 }).default("0"),
    totalExpenses: (0, mysql_core_1.decimal)("total_expenses", { precision: 10, scale: 2 }).default("0"),
    netCashInDrawer: (0, mysql_core_1.decimal)("net_cash_in_drawer", { precision: 10, scale: 2 }).default("0"),
    cashiermanId: (0, mysql_core_1.char)("cashierman_id", { length: 36 }).references(() => restrauntadmin_1.restrauntadmin.id).notNull(),
    cashierId: (0, mysql_core_1.char)("cashier_id", { length: 36 }).references(() => cashier_1.cashiers.id).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
