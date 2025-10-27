import { Router } from "express";
import { createVault } from "../controllers/vault.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Vaults
 *   description: Vault management endpoints
 */

router.post("/", createVault);

export default router;