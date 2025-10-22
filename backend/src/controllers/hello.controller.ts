import { Request, Response } from "express";
import { stellarService } from "../services/stellar.service";

/**
 * @swagger
 * /api/hello:
 *   get:
 *     summary: Call the contract `hello` function
 *     description: Calls the Minah smart contract `hello` method and returns its output
 *     tags: [Investors]
 *     parameters:
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         required: true
 *         description: String argument to pass to the contract
 *     responses:
 *       200:
 *         description: Contract returned data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export const callHello = async (req: Request, res: Response) => {
  try {
    const { to } = req.query as { to?: string };

    if (!to) {
      res.status(400).json({ success: false, message: "Missing 'to' query parameter" });
      return;
    }

    const result = await stellarService.hello(to);

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error in callHello controller:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
