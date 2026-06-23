import { mysqlTable, varchar, char, timestamp, boolean, decimal, text } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { customergroup } from "./customergroup";
import { restaurants } from "../schema";

export const customer = mysqlTable("customers", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
        restaurantid: char("restaurant_id", { length: 36 }).references(() => restaurants.id).notNull(),
    
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 255 }),
    address: text("address"),
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 100 }),
    
    customergroupId: char("customer_group_id", { length: 36 }).references(() => customergroup.id),
    
    totalPointsEarned: decimal("total_points_earned", { precision: 10, scale: 2 }).default("0"),
    isDue: boolean("is_due").default(false),
    dueAmount: decimal("due_amount", { precision: 10, scale: 2 }).default("0"),
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
