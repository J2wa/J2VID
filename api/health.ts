import type { Request, Response } from "express";
import { apiHealth } from "../lib/api-health.js";

// Keep this check independent of AI SDK imports and server startup.
// Report presence only: never return secret values.
export default function health(_req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(apiHealth());
}
