import {
    mysqlTable,
    char,
    timestamp,
    decimal,
    mysqlEnum
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { restrauntadmin } from "../admin/restrauntadmin";
import { cashiers } from "./cashier";
import { restaurants } from "../schema";

export const cashiershift = mysqlTable("cashiershifts", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    
    startTime: timestamp("start_time").defaultNow(),
    endTime: timestamp("end_time"),
        restaurantid: char("restaurant_id", { length: 36 }).references(() => restaurants.id).notNull(),
    
    status: mysqlEnum("status", ["open", "closed"]).default("open"),
    
    totalSaleAmount: decimal("total_sale_amount", { precision: 10, scale: 2 }).default("0"),
    totalExpenses: decimal("total_expenses", { precision: 10, scale: 2 }).default("0"),
    netCashInDrawer: decimal("net_cash_in_drawer", { precision: 10, scale: 2 }).default("0"),
    
    cashiermanId: char("cashierman_id", { length: 36 }).references(() => restrauntadmin.id).notNull(),
    cashierId: char("cashier_id", { length: 36 }).references(() => cashiers.id).notNull(),
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
