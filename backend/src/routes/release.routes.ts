import { Router } from "express";
import {
  calculateAmountToRelease,
  releaseDistribution,
} from "../controllers/release.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Release
 *   description: ROI distribution release management endpoints
 */

router.post("/calculate", calculateAmountToRelease);
router.post("/distribute", releaseDistribution);

export default router;
