import { Router } from "express";
import { callHello } from "../controllers/hello.controller";

const router = Router();

/**
 * /api/hello
 */
router.get("/", callHello);

export default router;
