"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expensscategory = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../schema");
exports.expensscategory = (0, mysql_core_1.mysqlTable)("expensscategories", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    arName: (0, mysql_core_1.varchar)("ar_name", { length: 255 }).notNull(),
    restaurantid: (0, mysql_core_1.char)("restaurant_id", { length: 36 }).references(() => schema_1.restaurants.id).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
