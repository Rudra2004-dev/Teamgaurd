import { Router } from "express";
import {forgotPassword, getSessions, login,logout,logoutAll,refresh, revokeSession, resetPassword} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authMiddleware, logout);
router.post("/logout-all",authMiddleware, logoutAll);
router.get("/sessions", authMiddleware, getSessions);
router.delete("/sessions/:id", authMiddleware, revokeSession);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


export default router;