import { mysqlTable, varchar, char, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { restaurants } from "../schema";

export const expensscategory = mysqlTable("expensscategories", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    name: varchar("name", { length: 255 }).notNull(),
    arName: varchar("ar_name", { length: 255 }).notNull(),
        restaurantid: char("restaurant_id", { length: 36 }).references(() => restaurants.id).notNull(),
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
