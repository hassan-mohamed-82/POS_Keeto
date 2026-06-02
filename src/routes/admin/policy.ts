import { Router } from "express";
import { createKetoPolicy, updateKetoPolicy, deleteKetoPolicy, getKetoPolicies, getKetoPoliciesById } from "../../controllers/admin/policy";
import { catchAsync } from "../../utils/catchAsync";
import { hasPermission } from "../../middlewares";
const router = Router();

router.post("/", hasPermission("policy", "Add"), catchAsync(createKetoPolicy));
router.put("/:id", hasPermission("policy", "Edit"), catchAsync(updateKetoPolicy));
router.delete("/:id", hasPermission("policy", "Delete"), catchAsync(deleteKetoPolicy));
router.get("/", hasPermission("policy", "View"), catchAsync(getKetoPolicies));
router.get("/:id", hasPermission("policy", "View"), catchAsync(getKetoPoliciesById));

export default router;