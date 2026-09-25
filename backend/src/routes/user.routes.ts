import {Router} from "express";
import { createUser, getUserById, getUsers } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = Router();

router.post("/",authMiddleware, requirePermission("CREATE_USER"), createUser);
router.get("/", authMiddleware, requireRole("ADMIN", "SUPER_ADMIN"), getUsers);
router.get("/:id", authMiddleware, getUserById);

export default router;
