"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customer = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const customergroup_1 = require("./customergroup");
const schema_1 = require("../schema");
exports.customer = (0, mysql_core_1.mysqlTable)("customers", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    restaurantid: (0, mysql_core_1.char)("restaurant_id", { length: 36 }).references(() => schema_1.restaurants.id).notNull(),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    email: (0, mysql_core_1.varchar)("email", { length: 255 }),
    phone: (0, mysql_core_1.varchar)("phone", { length: 255 }),
    address: (0, mysql_core_1.text)("address"),
    country: (0, mysql_core_1.varchar)("country", { length: 100 }),
    city: (0, mysql_core_1.varchar)("city", { length: 100 }),
    customergroupId: (0, mysql_core_1.char)("customer_group_id", { length: 36 }).references(() => customergroup_1.customergroup.id),
    totalPointsEarned: (0, mysql_core_1.decimal)("total_points_earned", { precision: 10, scale: 2 }).default("0"),
    isDue: (0, mysql_core_1.boolean)("is_due").default(false),
    dueAmount: (0, mysql_core_1.decimal)("due_amount", { precision: 10, scale: 2 }).default("0"),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
