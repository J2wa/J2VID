import type { Request, Response } from "express";

// Keep this check independent of AI SDK imports and server startup.
// Report presence only: never return secret values.
export default function health(_req: Request, res: Response) {
  const hasGeminiKey = [process.env.GEMINI_API_KEY, process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_GENAI_API_KEY].some(value => Boolean(value?.trim()));
  const hasOpenRouterKey = Boolean(process.env.OPENROUTER_API_KEY?.trim());
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    status: "ok",
    hasApiKey: hasGeminiKey || hasOpenRouterKey,
    hasGeminiKey,
    hasOpenRouterKey,
    keyConfigured: hasGeminiKey || hasOpenRouterKey,
    timestamp: new Date().toISOString(),
  });
}
