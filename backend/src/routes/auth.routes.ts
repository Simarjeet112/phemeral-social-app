import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/login", authLimiter, login);
export default router;