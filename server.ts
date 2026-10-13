import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { transcribeDeepgram } from './lib/deepgram.js';
import { SCENE_GUIDELINES, SUBTITLE_GUIDELINES, formatBackgroundContext } from './lib/annotation-guidelines.js';
import { getApiKeys, withApiKeyFallback, type KeyPurpose } from './lib/api-keys.js';
import { selectAudioModel, parseAudioInput, normalizeSubtitles } from './lib/subtitles.js';
import { accessApp, requireSession } from './lib/access.js';

dotenv.config();

const app = express();
const PORT = 3000;

/**
 * Retrieves the Gemini API key from process environment variables.
 * Checks GEMINI_API_KEY first, followed by common aliases (GOOGLE_API_KEY, GOOGLE_GENAI_API_KEY)
 * to support Vercel and standard cloud deployment environments.
 */
function getGeminiApiKey(): string {
  return getApiKeys('gemini')[0] || '';
}

function getOpenRouterApiKey(): string {
  return getApiKeys('openrouter')[0] || '';
}

// Allowed Direct Gemini Models per SDK specifications
const VALID_GEMINI_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview",
  "gemini-3.5-transcribe"
];

// OpenRouter Multimodal / Vision Models
const VALID_OPENROUTER_MODELS = [
  "google/gemini-2.5-flash:free",
  "meta-llama/llama-3.2-11b-vision-instruct:free",
  "qwen/qwen-2.5-vl-72b-instruct:free",
  "google/gemini-2.5-flash",
  "openai/gpt-4o-mini"
];

function isOpenRouterModel(modelInput?: string): boolean {
  if (!modelInput) return false;
  return modelInput.includes("/") || VALID_OPENROUTER_MODELS.includes(modelInput);
}

function sanitizeModel(modelInput?: string, defaultModel = "gemini-3.8-flash"): string {
  if (modelInput) {
    if (VALID_GEMINI_MODELS.includes(modelInput) || isOpenRouterModel(modelInput)) {
      return modelInput;
    }
  }
  return defaultModel;
}

function isQuotaError(err: any): boolean {
  const msg = (err?.message || "").toLowerCase();
  const status = err?.status || err?.statusCode || 0;
  return (
    status === 429 ||
    status === 402 ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("429") ||
    msg.includes("credits") ||
    msg.includes("too many requests")
  );
}

/**
 * Cleanly extract JSON even if fenced with markdown ```json ... ```
 */
function extractJson(text: string): any {
  if (!text) return {};
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    }
    throw err;
  }
}

/**
 * Executes a chat completion request to OpenRouter API (OpenAI compatible)
 */
async function callOpenRouterOnce({
  model,
  systemPrompt,
  userPrompt,
  images = [],
  apiKey
}: {
  model: string;
  systemPrompt?: string;
  userPrompt: string;
  images?: Array<{ mimeType?: string; base64: string }>;
  apiKey: string;
}) {
  const contentParts: any[] = [];

  for (const img of images) {
    if (!img.base64) continue;
    const dataUrl = img.base64.startsWith("data:")
      ? img.base64
      : `data:${img.mimeType || "image/jpeg"};base64,${img.base64}`;
    contentParts.push({
      type: "image_url",
      image_url: { url: dataUrl }
    });
  }

  contentParts.push({
    type: "text",
    text: userPrompt
  });

  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt
    });
  }
  messages.push({
    role: "user",
    content: contentParts
  });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.APP_URL || "https://ai.studio",
      "X-Title": "J2 Clips Video Annotation",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    let errJson: any;
    try {
      errJson = JSON.parse(errText);
    } catch {
      errJson = { message: errText };
    }
    const errMsg =
      errJson?.error?.message ||
      errJson?.message ||
      `OpenRouter error (status ${response.status}): ${response.statusText}`;
    const error: any = new Error(errMsg);
    error.status = response.status;
    throw error;
  }

  const json = await response.json();
  const rawText = json.choices?.[0]?.message?.content || "";
  return rawText;
}

async function callOpenRouter(args: Parameters<typeof callOpenRouterOnce>[0] & { autoFallback?: boolean }) {
  return withApiKeyFallback(getApiKeys('openrouter'), apiKey =>
    callOpenRouterOnce({ ...args, apiKey }), args.autoFallback !== false);
}

async function runGeminiWithFallback(
  ai: GoogleGenAI,
  params: any,
  requestedModel: string,
  autoFallback = true,
  purpose: KeyPurpose = 'gemini'
) {
  const keys = getApiKeys(purpose);
  const execute = (model: string) => withApiKeyFallback(keys, apiKey => {
    const client = apiKey === keys[0] ? ai : new GoogleGenAI({ apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    return client.models.generateContent({ ...params, model });
  }, autoFallback);
  try {
    const response = await execute(requestedModel);
    return { response, modelUsed: requestedModel, fellBack: false, originalModel: requestedModel };
  } catch (err: any) {
    if (!autoFallback || !isQuotaError(err)) throw err;
    const fallbackModel = requestedModel === 'gemini-3.1-flash-lite'
      ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite';
    const response = await execute(fallbackModel);
    return { response, modelUsed: fallbackModel, fellBack: true, originalModel: requestedModel };
  }
}

app.use('/api/access', accessApp);
app.use((req, res, next) => {
  if (req.method === 'POST' && /\/(annotate-video|revise-scene|transcribe-audio)\/?$/.test(req.path)) {
    void requireSession(req, res, next);
  } else next();
});

// Increase payload limit for base64 video/file payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Dedicated API Router to handle both prefixed and root requests seamlessly on Vercel & Express
const apiRouter = express.Router();

// Health Check
apiRouter.get(["/health", "/api/health"], (req, res) => {
  const geminiKey = getGeminiApiKey();
  const openRouterKey = getOpenRouterApiKey();
  res.json({
    status: "ok",
    hasApiKey: !!(geminiKey || openRouterKey),
    hasGeminiKey: !!geminiKey,
    hasOpenRouterKey: !!openRouterKey,
    hasAudioKey: getApiKeys('audio').length > 0,
    hasDeepgramKey: getApiKeys('deepgram').length > 0,
    keyConfigured: !!(geminiKey || openRouterKey),
    availableGeminiModels: VALID_GEMINI_MODELS,
    availableOpenRouterModels: VALID_OPENROUTER_MODELS,
    timestamp: new Date().toISOString()
  });
});

// Video / Scene Snapshot Annotation API
apiRouter.post(["/annotate-video", "/api/annotate-video"], async (req, res) => {
  let targetModel = sanitizeModel(req.body.model, "gemini-3.8-flash");
  const autoFallback = req.body.autoFallback !== false;

  try {
    const {
      videoData,
      mimeType,
      durationSeconds,
      metadata,
      customPrompt,
      simulateDiscard,
      eventTimestamps,
      initialBackground,
      actionNotes,
      scenesInput
    } = req.body;

    const geminiKey = getGeminiApiKey();
    const openRouterKey = getOpenRouterApiKey();

    if (!geminiKey && !openRouterKey) {
      return res.status(500).json({
        error: "No AI API key found. Please configure GEMINI_API_KEY (for Google Gemini) or OPENROUTER_API_KEY (for OpenRouter) in your environment variables.",
        keyMissing: true
      });
    }

    // If simulate discard is requested
    if (simulateDiscard) {
      return res.json({
        video_duration: "00:00:30.000",
        suitability: {
          status: "discarded",
          category: null,
          confidence: 0.98,
          reason: "Scene rejected: Primarily static interview footage without meaningful visual action progression across snapshots."
        },
        scenes: [],
        subtitles: []
      });
    }

    // Keep audio processing independent of the selected scene provider.
    const audioResult = req.body.audioData
      ? await transcribeAudio(req.body.audioData, req.body.audioMimeType, undefined, autoFallback, req.body.subtitleProvider)
      : null;
    const durationFormatted = formatSecondsToTimestamp(durationSeconds || 30);

    const systemInstruction = `
You are J2 Clips, a video annotation assistant. Generated annotations require human verification.
${SCENE_GUIDELINES}
${SUBTITLE_GUIDELINES}
Produce strictly structured JSON conforming to the following format:
{
  "video_duration": "${durationFormatted}",
  "suitability": {
    "status": "suitable",
    "category": "Documentary",
    "confidence": 0.95,
    "reason": "Clear visual progression."
  },
  "scenes": [
    {
      "scene_id": 1,
      "start_time": "00:00:00.000",
      "end_time": "00:00:05.000",
      "narrative_description": "Factual visual narrative..."
    }
  ],
  "subtitles": []
}
`;

    // Extract snapshot images and build user prompt
    const openRouterImages: Array<{ mimeType: string; base64: string }> = [];
    let scenesText = formatBackgroundContext(initialBackground);

    if (Array.isArray(scenesInput) && scenesInput.length > 0) {
      scenesText += `Sequence of scenes to analyze:\n`;
      scenesInput.forEach((sc: any, idx: number) => {
        const scId = sc.scene_id || idx + 1;
        scenesText += `\nScene #${scId}:\n`;
        if (sc.raw_description) {
          scenesText += `- User Action Guidance (Tagalog/English): "${sc.raw_description}"\n`;
        }
        scenesText += formatBackgroundContext(initialBackground, sc.initial_background);
        if (sc.start_time && sc.end_time) {
          scenesText += `- Boundaries: ${sc.start_time} - ${sc.end_time}\n`;
        }

        const imageToUse = sc.start_image || sc.snapshot_image || sc.image;
        if (imageToUse && typeof imageToUse === "string") {
          let base64Data = "";
          let mimeType = "image/jpeg";
          if (imageToUse.includes(",")) {
            const parts = imageToUse.split(",");
            base64Data = parts[1];
            const mimeMatch = parts[0].match(/data:(image\/[a-zA-Z0-9\+\-\.]+);/);
            if (mimeMatch) {
              mimeType = mimeMatch[1];
            }
          } else if (imageToUse.length > 100) {
            base64Data = imageToUse;
          }
          if (base64Data) {
            openRouterImages.push({ mimeType, base64: base64Data });
          }
        }
      });
      scenesText += `\nExamine the attached snapshot images carefully and output detailed factual visual narrative descriptions for each scene in the JSON 'scenes' array.`;
    } else {
      scenesText = customPrompt || `Analyze the footage/scenes (duration: ${durationFormatted}). Return structured JSON.`;
    }

    // Determine provider execution: OpenRouter vs Google Gemini
    const useOpenRouter =
      isOpenRouterModel(targetModel) ||
      (!geminiKey && Boolean(openRouterKey));

    if (useOpenRouter) {
      if (!openRouterKey) {
        if (geminiKey) {
          targetModel = "gemini-3.8-flash";
        } else {
          return res.status(500).json({
            error: `OPENROUTER_API_KEY is required to use model '${targetModel}'. Please configure OPENROUTER_API_KEY in your environment variables.`,
            keyMissing: true
          });
        }
      } else {
        // Effective model on OpenRouter
        let effectiveOpenRouterModel = isOpenRouterModel(targetModel)
          ? targetModel
          : "google/gemini-2.5-flash:free";

        try {
          const rawText = await callOpenRouter({
            model: effectiveOpenRouterModel,
            systemPrompt: systemInstruction,
            userPrompt: scenesText,
            images: openRouterImages,
            apiKey: openRouterKey,
            autoFallback
          });

          const parsedData = extractJson(rawText);

          if (parsedData.scenes && Array.isArray(parsedData.scenes)) {
            parsedData.scenes = parsedData.scenes.map((sc: any, i: number) => ({
              ...sc,
              start_time: scenesInput?.find((input: any) => input.scene_id === sc.scene_id)?.start_time || sc.start_time,
              end_time: scenesInput?.find((input: any) => input.scene_id === sc.scene_id)?.end_time || sc.end_time
            }));
          }

          if (!parsedData.subtitles) {
            parsedData.subtitles = [];
          }

          parsedData._modelUsed = effectiveOpenRouterModel;
          parsedData._provider = "openrouter";
          if (effectiveOpenRouterModel !== targetModel) {
            parsedData._fellBackFrom = targetModel;
          }

          if (req.body.audioData) {
            parsedData.subtitles = audioResult.subtitles;
            parsedData._audioModelUsed = audioResult._modelUsed;
            parsedData._audioProvider = audioResult._provider;
            parsedData._audioWarnings = audioResult._warnings || [];
          } else {
            parsedData.subtitles = normalizeSubtitles(parsedData.subtitles || []);
          }
          return res.json(parsedData);
        } catch (orErr: any) {
          console.warn("[OpenRouter Error]", orErr.message);
          if (autoFallback && geminiKey) {
            console.log("Failing over from OpenRouter to Google Gemini...");
            targetModel = "gemini-3.8-flash";
            // Fall through to Gemini execution below
          } else if (autoFallback && isQuotaError(orErr) && effectiveOpenRouterModel !== "meta-llama/llama-3.2-11b-vision-instruct:free") {
            // Fallback to secondary free OpenRouter model
            const fallbackOrModel = "meta-llama/llama-3.2-11b-vision-instruct:free";
            const rawText = await callOpenRouter({
              model: fallbackOrModel,
              systemPrompt: systemInstruction,
              userPrompt: scenesText,
              images: openRouterImages,
              apiKey: openRouterKey,
              autoFallback
            });
            const parsedData = extractJson(rawText);
            parsedData._modelUsed = fallbackOrModel;
            parsedData._fellBackFrom = effectiveOpenRouterModel;
            parsedData._provider = "openrouter";
            if (req.body.audioData) {
            parsedData.subtitles = audioResult.subtitles;
            parsedData._audioModelUsed = audioResult._modelUsed;
            parsedData._audioProvider = audioResult._provider;
            parsedData._audioWarnings = audioResult._warnings || [];
          } else {
            parsedData.subtitles = normalizeSubtitles(parsedData.subtitles || []);
          }
          return res.json(parsedData);
          } else {
            throw orErr;
          }
        }
      }
    }

    // Direct Google Gemini Execution
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const parts: any[] = [];

    if (Array.isArray(scenesInput) && scenesInput.length > 0) {
      parts.push({
        text: `You are analyzing a sequence of scene snapshot images and user action guidance notes. Apply the shared scene guidelines. Write natural English descriptions, using only supported observations and supplied action context.`
      });

      scenesInput.forEach((sc: any, idx: number) => {
        let sceneHeader = `\n=== SCENE #${sc.scene_id || idx + 1} ===\n`;
        if (sc.raw_description) {
          sceneHeader += `- User Action Guidance (Tagalog/English): "${sc.raw_description}"\n`;
        }
        sceneHeader += formatBackgroundContext(initialBackground, sc.initial_background);

        parts.push({ text: sceneHeader });

        const imageToUse = sc.start_image || sc.snapshot_image || sc.image;
        if (imageToUse && typeof imageToUse === 'string') {
          let base64Data = '';
          let mimeType = 'image/jpeg';

          if (imageToUse.includes(',')) {
            const spl = imageToUse.split(',');
            base64Data = spl[1];
            const mimeMatch = spl[0].match(/data:(image\/[a-zA-Z0-9\+\-\.]+);/);
            if (mimeMatch) {
              mimeType = mimeMatch[1];
            }
          } else if (imageToUse.length > 100) {
            base64Data = imageToUse;
          }

          if (base64Data) {
            parts.push({
              inlineData: {
                mimeType,
                data: base64Data
              }
            });
          }
        }
      });

      parts.push({
        text: `${SCENE_GUIDELINES}\nReturn the full annotation JSON including scenes and supplied boundaries.`
      });
    } else {
      if (videoData && mimeType) {
        parts.push({
          inlineData: {
            mimeType: mimeType || "video/mp4",
            data: videoData
          }
        });
      }
      const eventTimestampsInstruction = eventTimestamps
        ? `\n\nUSER-SPECIFIED EVENT BOUNDARY TIMESTAMPS: "${eventTimestamps}".`
        : '';
      const initialBackgroundInstruction = initialBackground
        ? `\n\nUSER-SPECIFIED INITIAL BACKGROUND CONTEXT: "${initialBackground}".`
        : '';
      const userPrompt = customPrompt || `
Analyze this scene footage/snapshots (duration: ${durationFormatted}).
Perform complete scene boundary detection, frame-to-frame entity tracking, background verification, Tagalog/English translation, and factual visual narrative description generation.${eventTimestampsInstruction}${initialBackgroundInstruction}

Video Metadata:
- Context: ${metadata?.fileName || 'Uploaded Scene Snapshots'}
- Stated duration: ${durationFormatted}
`;
      parts.push({ text: userPrompt });
    }

    const { response, modelUsed, fellBack, originalModel } = await runGeminiWithFallback(
      ai,
      {
        contents: { parts },
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              video_duration: { type: Type.STRING },
              suitability: {
                type: Type.OBJECT,
                properties: {
                  status: { type: Type.STRING, description: "'suitable' or 'discarded'" },
                  category: { type: Type.STRING, description: "'Live Performance', 'Documentary', 'Movie', 'Advertisement', or null" },
                  confidence: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ["status", "confidence", "reason"]
              },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    scene_id: { type: Type.INTEGER },
                    start_time: { type: Type.STRING },
                    end_time: { type: Type.STRING },
                    narrative_description: { type: Type.STRING }
                  },
                  required: ["scene_id", "narrative_description"]
                }
              },
              subtitles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    subtitle_id: { type: Type.INTEGER },
                    start_time: { type: Type.STRING },
                    end_time: { type: Type.STRING },
                    type: { type: Type.STRING },
                    text: { type: Type.STRING }
                  },
                  required: ["subtitle_id", "start_time", "end_time", "type", "text"]
                }
              }
            },
            required: ["video_duration", "suitability", "scenes"]
          }
        }
      },
      targetModel,
      autoFallback
    );

    const responseText = response.text || "";
    const parsedData = JSON.parse(responseText);

    if (parsedData.scenes && Array.isArray(parsedData.scenes)) {
      parsedData.scenes = parsedData.scenes.map((sc: any, i: number) => ({
        ...sc,
        start_time: scenesInput?.find((input: any) => input.scene_id === sc.scene_id)?.start_time || sc.start_time,
        end_time: scenesInput?.find((input: any) => input.scene_id === sc.scene_id)?.end_time || sc.end_time
      }));
    }

    if (!parsedData.subtitles) {
      parsedData.subtitles = [];
    }

    parsedData._modelUsed = modelUsed;
    parsedData._provider = "gemini";
    if (fellBack) {
      parsedData._fellBackFrom = originalModel;
    }

    if (req.body.audioData) {
            parsedData.subtitles = audioResult.subtitles;
            parsedData._audioModelUsed = audioResult._modelUsed;
            parsedData._audioProvider = audioResult._provider;
            parsedData._audioWarnings = audioResult._warnings || [];
          } else {
            parsedData.subtitles = normalizeSubtitles(parsedData.subtitles || []);
          }
          return res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/annotate-video:", error);
    const quotaExhausted = isQuotaError(error);
    return res.status(quotaExhausted ? 429 : 500).json({
      error: error.message || "Failed to process video annotation.",
      isQuotaExhausted: quotaExhausted,
      modelUsed: targetModel,
      suggestedFallback: targetModel === "gemini-3.1-flash-lite" ? "gemini-3.8-flash" : "gemini-3.1-flash-lite"
    });
  }
});

// Stage 3 Scene Description Revision API Endpoint
apiRouter.post(["/revise-scene", "/api/revise-scene"], async (req, res) => {
  let targetModel = sanitizeModel(req.body.model, "gemini-3.8-flash");
  const autoFallback = req.body.autoFallback !== false;

  try {
    const { sceneId, currentDescription, feedback, rawDescription, startImage, snapshotImage, initialBackground, sceneBackground } = req.body;

    const geminiKey = getGeminiApiKey();
    const openRouterKey = getOpenRouterApiKey();

    if (!geminiKey && !openRouterKey) {
      return res.status(500).json({
        error: "No AI API key found. Please configure GEMINI_API_KEY (for Google Gemini) or OPENROUTER_API_KEY (for OpenRouter) in your environment variables.",
        keyMissing: true
      });
    }

    const imgToUse = startImage || snapshotImage;
    const images: Array<{ mimeType: string; base64: string }> = [];

    if (imgToUse && typeof imgToUse === 'string') {
      let base64Data = '';
      let mimeType = 'image/jpeg';
      if (imgToUse.includes(',')) {
        const match = imgToUse.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      } else if (imgToUse.length > 100) {
        base64Data = imgToUse;
      }
      if (base64Data) {
        images.push({ mimeType, base64: base64Data });
      }
    }

    let revisionPrompt = `You are revising Scene #${sceneId}'s factual visual description based on user feedback.\n\n`;
    revisionPrompt += formatBackgroundContext(initialBackground, sceneBackground);
    revisionPrompt += `CURRENT DESCRIPTION:\n"${currentDescription}"\n\n`;
    if (rawDescription) {
      revisionPrompt += `INITIAL USER GUIDANCE (Tagalog/English):\n"${rawDescription}"\n\n`;
    }
    revisionPrompt += `USER REVISION INSTRUCTIONS / FEEDBACK (Tagalog or English):\n"${feedback}"\n\n`;
    revisionPrompt += `${SCENE_GUIDELINES}\nINSTRUCTIONS:\n`;
    revisionPrompt += `1. Apply the user's feedback precisely to refine and rewrite the visual description.\n`;
    revisionPrompt += `2. Translate any Tagalog revision instructions into clear, professional English.\n`;
    revisionPrompt += `3. Adhere strictly to factual video annotation guidelines (objective visual description, no speculation, clear subject & background details).\n`;
    revisionPrompt += `4. Return ONLY a JSON object with key "revised_description": {"revised_description": "..."}\n`;

    const useOpenRouter =
      isOpenRouterModel(targetModel) ||
      (!geminiKey && Boolean(openRouterKey));

    if (useOpenRouter && openRouterKey) {
      const effectiveOrModel = isOpenRouterModel(targetModel)
        ? targetModel
        : "google/gemini-2.5-flash:free";

      const raw = await callOpenRouter({
        model: effectiveOrModel,
        systemPrompt: "You are an expert video annotation rewriting agent. Apply user feedback precisely and return valid JSON.",
        userPrompt: revisionPrompt,
        images,
        apiKey: openRouterKey,
        autoFallback
      });
      const parsed = extractJson(raw);
      return res.json({
        revised_description: parsed.revised_description || currentDescription,
        _modelUsed: effectiveOrModel,
        _provider: "openrouter"
      });
    }

    // Otherwise use Google Gemini
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const parts: any[] = [];
    if (images.length > 0) {
      parts.push({ text: `[SCENE #${sceneId} SNAPSHOT IMAGE]` });
      parts.push({
        inlineData: { mimeType: images[0].mimeType, data: images[0].base64 }
      });
    }
    parts.push({ text: revisionPrompt });

    const { response, modelUsed, fellBack, originalModel } = await runGeminiWithFallback(
      ai,
      {
        contents: { parts },
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              revised_description: { type: Type.STRING }
            },
            required: ["revised_description"]
          }
        }
      },
      targetModel,
      autoFallback
    );

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      revised_description: parsed.revised_description || currentDescription,
      _modelUsed: modelUsed,
      _provider: "gemini",
      _fellBackFrom: fellBack ? originalModel : undefined
    });
  } catch (err: any) {
    console.error("Error in /api/revise-scene:", err);
    const quotaExhausted = isQuotaError(err);
    return res.status(quotaExhausted ? 429 : 500).json({
      error: err.message || "Failed to revise scene description.",
      isQuotaExhausted: quotaExhausted,
      modelUsed: targetModel,
      suggestedFallback: targetModel === "gemini-3.1-flash-lite" ? "gemini-3.8-flash" : "gemini-3.1-flash-lite"
    });
  }
});

export async function transcribeAudio(audioData: unknown, audioMimeType?: string, requestedModel?: string, autoFallback = true, requestedProvider: unknown = 'deepgram') {
    if (requestedProvider === 'deepgram') return transcribeDeepgram(audioData, audioMimeType, autoFallback);
    if (requestedProvider !== undefined && requestedProvider !== 'gemini') {
      throw Object.assign(new Error('Choose Gemini or Deepgram as the subtitle provider.'), { status: 400 });
    }
    const apiKey = getApiKeys('audio')[0] || '';
    if (!apiKey) throw new Error('Audio subtitles require GEMINI_AUDIO_API_KEY or GEMINI_API_KEY. The OpenRouter key handles scene descriptions only.');
    const targetModel = selectAudioModel(process.env.GEMINI_AUDIO_MODEL || requestedModel);
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const { data: base64Audio, mimeType } = parseAudioInput(audioData, audioMimeType);

    const parts: any[] = [];
    if (base64Audio) {
      parts.push({
        inlineData: {
          mimeType,
          data: base64Audio
        }
      });
    }

    parts.push({
      text: `${SUBTITLE_GUIDELINES}
Return JSON with a subtitles array. Each item requires subtitle_id, start_time, end_time,
type (Spoken words, Music, Sound effect, Ambient sound, Vocal sound or Other), and text.`
    });

    const { response, modelUsed, fellBack, originalModel } = await runGeminiWithFallback(
      ai,
      {
        contents: { parts },
        config: {
          systemInstruction: SUBTITLE_GUIDELINES,
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subtitles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    subtitle_id: { type: Type.INTEGER },
                    start_time: { type: Type.STRING },
                    end_time: { type: Type.STRING },
                    type: { type: Type.STRING },
                    text: { type: Type.STRING }
                  },
                  required: ["subtitle_id", "start_time", "end_time", "type", "text"]
                }
              }
            },
            required: ["subtitles"]
          }
        }
      },
      targetModel,
      autoFallback,
      'audio'
    );

    const parsedData = extractJson(response.text || "{}");
    parsedData.subtitles = normalizeSubtitles(parsedData.subtitles);
    parsedData._provider = "gemini";
    parsedData._modelUsed = modelUsed;
    if (fellBack) {
      parsedData._fellBackFrom = originalModel;
    }
    return parsedData;
}

// Audio MP3 Subtitle Transcription API Endpoint
apiRouter.post(["/transcribe-audio", "/api/transcribe-audio"], async (req, res) => {
  const deepgram = (req.body.subtitleProvider ?? 'deepgram') === 'deepgram';
  let targetModel = deepgram ? process.env.DEEPGRAM_MODEL || 'nova-3' : selectAudioModel(process.env.GEMINI_AUDIO_MODEL || req.body.model);
  const autoFallback = req.body.autoFallback !== false;

  try {
    const { audioData, audioMimeType, fileName } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: "Missing audioData in request body." });
    }

    const parsedData = await transcribeAudio(audioData, audioMimeType, targetModel, autoFallback, req.body.subtitleProvider);
    return res.json(parsedData);
  } catch (err: any) {
    console.error("Error in /api/transcribe-audio:", err);
    const quotaExhausted = isQuotaError(err);
    return res.status(err.status === 400 ? 400 : err.status === 503 ? 503 : quotaExhausted ? 429 : 500).json({
      error: err.message || "Failed to transcribe audio file.",
      isQuotaExhausted: quotaExhausted,
      modelUsed: targetModel,
      suggestedFallback: deepgram ? undefined : targetModel === "gemini-3.1-flash-lite" ? "gemini-3.8-flash" : "gemini-3.1-flash-lite"
    });
  }
});

function formatSecondsToTimestamp(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  const ms = Math.round((totalSeconds % 1) * 1000);

  const hh = String(hrs).padStart(2, "0");
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  const mmm = String(ms).padStart(3, "0");

  return `${hh}:${mm}:${ss}.${mmm}`;
}

// Mount apiRouter on both /api and root /
app.use("/api", apiRouter);
app.use("/", apiRouter);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start standalone HTTP listener when running directly in local dev or container
if (!process.env.VERCEL) {
  startServer();
}

export default app;
export { app };

