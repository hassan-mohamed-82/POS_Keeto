import {
    mysqlTable,
    varchar,
    char,
    timestamp,
    decimal,
    mysqlEnum,
    int,
    boolean,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const images = mysqlTable("images", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    img: varchar("img", { length: 500 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
