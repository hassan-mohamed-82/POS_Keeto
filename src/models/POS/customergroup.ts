import { mysqlTable, varchar, char, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { restaurants } from "../schema";

export const customergroup = mysqlTable("customergroups", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
        restaurantid: char("restaurant_id", { length: 36 }).references(() => restaurants.id).notNull(),
    
    name: varchar("name", { length: 255 }).notNull(),
    status: mysqlEnum("status", ["active", "inactive"]).default("active"),
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
