import { Request, Response } from "express";
import { db } from "../../models/connection";
import { customergroup } from "../../models/POS/customergroup";
import { eq } from "drizzle-orm";

export const createCustomerGroup = async (req: Request, res: Response) => {
    const restaurantid = (req as any).user?.restaurantId;
    const { name, status } = req.body;
    if (!restaurantid) {
        res.status(401).json({ message: "Unauthorized: No restaurant ID found in token" });
        return;
    }
    await db.insert(customergroup).values({ restaurantid, name, status });
    res.status(201).json({ message: "Customer group created successfully" });
};

export const getAllCustomerGroups = async (req: Request, res: Response) => {
    const groups = await db.select().from(customergroup);
    res.status(200).json(groups);
};

export const getCustomerGroupById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const group = await db.select().from(customergroup).where(eq(customergroup.id, id)).limit(1);
    if (!group.length) {
        res.status(404).json({ message: "Customer group not found" });
        return;
    }
    res.status(200).json(group[0]);
};

export const updateCustomerGroup = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, status } = req.body;
    await db.update(customergroup).set({ name, status }).where(eq(customergroup.id, id));
    res.status(200).json({ message: "Customer group updated successfully" });
};

export const deleteCustomerGroup = async (req: Request, res: Response) => {
    const { id } = req.params;
    await db.delete(customergroup).where(eq(customergroup.id, id));
    res.status(200).json({ message: "Customer group deleted successfully" });
};
