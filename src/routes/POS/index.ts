import { Router } from "express";
import expenseCategoryRoutes from "./expenseCategory";
import expenseRoutes from "./expense";
import cashierShiftRoutes from "./cashiershift";
import customerGroupRoutes from "./customerGroup";
import customerRoutes from "./customer";
import posHomeRoutes from "./posHome";
import posOrderRoutes from "./posOrder";

const route = Router();

route.use("/expense-categories", expenseCategoryRoutes);
route.use("/expenses", expenseRoutes);
route.use("/cashier-shifts", cashierShiftRoutes);
route.use("/customer-groups", customerGroupRoutes);
route.use("/customers", customerRoutes);
route.use("/pos-home", posHomeRoutes);
route.use("/pos-orders", posOrderRoutes);

export default route;