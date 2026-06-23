"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomerGroup = exports.updateCustomerGroup = exports.getCustomerGroupById = exports.getAllCustomerGroups = exports.createCustomerGroup = void 0;
const connection_1 = require("../../models/connection");
const customergroup_1 = require("../../models/POS/customergroup");
const drizzle_orm_1 = require("drizzle-orm");
const createCustomerGroup = async (req, res) => {
    const restaurantid = req.user?.restaurantId;
    const { name, status } = req.body;
    if (!restaurantid) {
        res.status(401).json({ message: "Unauthorized: No restaurant ID found in token" });
        return;
    }
    await connection_1.db.insert(customergroup_1.customergroup).values({ restaurantid, name, status });
    res.status(201).json({ message: "Customer group created successfully" });
};
exports.createCustomerGroup = createCustomerGroup;
const getAllCustomerGroups = async (req, res) => {
    const groups = await connection_1.db.select().from(customergroup_1.customergroup);
    res.status(200).json(groups);
};
exports.getAllCustomerGroups = getAllCustomerGroups;
const getCustomerGroupById = async (req, res) => {
    const { id } = req.params;
    const group = await connection_1.db.select().from(customergroup_1.customergroup).where((0, drizzle_orm_1.eq)(customergroup_1.customergroup.id, id)).limit(1);
    if (!group.length) {
        res.status(404).json({ message: "Customer group not found" });
        return;
    }
    res.status(200).json(group[0]);
};
exports.getCustomerGroupById = getCustomerGroupById;
const updateCustomerGroup = async (req, res) => {
    const { id } = req.params;
    const { name, status } = req.body;
    await connection_1.db.update(customergroup_1.customergroup).set({ name, status }).where((0, drizzle_orm_1.eq)(customergroup_1.customergroup.id, id));
    res.status(200).json({ message: "Customer group updated successfully" });
};
exports.updateCustomerGroup = updateCustomerGroup;
const deleteCustomerGroup = async (req, res) => {
    const { id } = req.params;
    await connection_1.db.delete(customergroup_1.customergroup).where((0, drizzle_orm_1.eq)(customergroup_1.customergroup.id, id));
    res.status(200).json({ message: "Customer group deleted successfully" });
};
exports.deleteCustomerGroup = deleteCustomerGroup;
