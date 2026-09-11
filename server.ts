import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

/**
 * Retrieves the Gemini API key from process environment variables.
 * Checks GEMINI_API_KEY first, followed by common aliases (GOOGLE_API_KEY, GOOGLE_GENAI_API_KEY)
 * to support Vercel and standard cloud deployment environments.
 */
function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    ""
  ).trim();
}

// Increase payload limit for base64 video/file payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Dedicated API Router to handle both prefixed and root requests seamlessly on Vercel & Express
const apiRouter = express.Router();

// Health Check
apiRouter.get(["/health", "/api/health"], (req, res) => {
  const apiKey = getGeminiApiKey();
  res.json({
    status: "ok",
    hasApiKey: !!apiKey,
    keyConfigured: !!apiKey,
    timestamp: new Date().toISOString()
  });
});

// Video / Scene Snapshot Annotation API
apiRouter.post(["/annotate-video", "/api/annotate-video"], async (req, res) => {
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

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is missing. Please configure GEMINI_API_KEY in your Vercel Project Settings > Environment Variables, or in your local .env file."
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

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

    const durationFormatted = formatSecondsToTimestamp(durationSeconds || 30);

    const systemInstruction = `
You are J2 Clips, an autonomous multimodal video and scene snapshot annotation agent.
Your primary directive is ZERO-HALLUCINATION DETAILED FACTUAL ANNOTATION, BILINGUAL TAGALOG-TO-ENGLISH TRANSLATION, REWRITING, and SCENE SNAPSHOT VISUAL ENTITY AND ACTION TRACKING.

BILINGUAL INPUT & REWRITING PROTOCOL:
1. Each scene requires a single snapshot image and optional action guidance/draft provided in Tagalog or English.
2. TRANSLATION: Translate any user guidance written in Tagalog (or Taglish) into clear, fluent, professional, objective English.
3. DETAILED FACTUAL VISUAL DESCRIPTION GUIDELINES:
   - Carefully inspect the scene snapshot image for all visible entities, subjects, clothing, hair, posture, expressions, body orientation, gestures, and background setting.
   - Write a rich, highly detailed, multi-sentence visual narrative (aim for 3 to 5 comprehensive sentences per scene).
   - Subject Details: Describe subject gender/age group, exact clothing garments, colors, patterns, footwear, hairstyle, facial posture, hand positions, and focal physical actions.
   - Spatial & Object Composition: Detail held items, props, furniture, machinery, or tools, specifying relative positioning (foreground, center, background, left/right).
   - Environmental Setting: Describe the physical environment (indoor/outdoor, architectural details, flooring, foliage, weather, lighting, color tone, and background context).
   - Combine the visual evidence from the snapshot image with the translated guidance into a dense, highly detailed, factual English visual narrative.
4. DO NOT HALLUCINATE: Never invent unverified actions, emotions, internal motives, or subjective interpretations. Do NOT name real people, brand logos, or unverified locations.
5. Produce strictly structured JSON conforming to the schema with exact scene IDs and rich, detailed factual English visual narrative descriptions adhering to video annotation guidelines.
`;

    // Build model payload parts
    const parts: any[] = [];

    // Attach MP3 / Audio Data if present
    if (req.body.audioData) {
      let base64Audio = req.body.audioData;
      let audioMime = req.body.audioMimeType || "audio/mp3";
      if (typeof base64Audio === 'string' && base64Audio.includes(',')) {
        const audioParts = base64Audio.split(',');
        base64Audio = audioParts[1];
        const mimeMatch = audioParts[0].match(/data:(audio\/[a-zA-Z0-9\+\-\.]+);/);
        if (mimeMatch) {
          audioMime = mimeMatch[1];
        }
      }
      parts.push({
        inlineData: {
          mimeType: audioMime,
          data: base64Audio
        }
      });
      parts.push({
        text: `[AUDIO TRACK ATTACHED]: Listen to the attached audio file. Transcribe spoken dialogue, vocal sounds, and audio cues into the 'subtitles' array with accurate start_time (HH:MM:SS.mmm), end_time (HH:MM:SS.mmm), type ('Spoken words', 'Music', 'Sound effect', etc.), and text.`
      });
    }

    // If scenesInput with snapshot images is provided
    if (Array.isArray(scenesInput) && scenesInput.length > 0) {
      parts.push({
        text: `You are analyzing a sequence of scene snapshot images and user action guidance notes. Generate an exceptionally detailed, comprehensive, multi-sentence factual visual narrative (3-5 rich sentences minimum per scene) in fluent English, translating any Tagalog guidance into English and thoroughly describing all observable visual details from the snapshot image.`
      });

      scenesInput.forEach((sc: any, idx: number) => {
        let sceneHeader = `\n=== SCENE #${sc.scene_id || idx + 1} ===\n`;
        if (sc.raw_description) {
          sceneHeader += `- User Action Guidance (Tagalog/English): "${sc.raw_description}"\n`;
        }
        if (sc.initial_background) {
          sceneHeader += `- Background Setting Context: "${sc.initial_background}"\n`;
        }

        parts.push({ text: sceneHeader });

        // Add Scene Snapshot Image if present
        const imageToUse = sc.start_image || sc.snapshot_image || sc.image;
        if (imageToUse && typeof imageToUse === 'string') {
          let base64Data = '';
          let mimeType = 'image/jpeg';

          if (imageToUse.includes(',')) {
            const parts = imageToUse.split(',');
            base64Data = parts[1];
            const mimeMatch = parts[0].match(/data:(image\/[a-zA-Z0-9\+\-\.]+);/);
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
        text: `\nCRITICAL INSTRUCTIONS FOR GEMINI:\n1. For each scene, translate any Tagalog text into clear, fluent, professional English.\n2. Examine the scene snapshot image in high detail: describe subject gender/age, attire, hair, facial expression, posture, hand gestures, active movements, held props, background architectural/environmental context, and lighting.\n3. Combine image visual facts with translated guidance into an exceptionally detailed, 3-to-5 sentence objective, non-speculative English visual narrative.\n4. Output JSON containing a 'scenes' array with 'scene_id' and 'narrative_description'.`
      });
    } else {
      // Fallback for single video / prompt input
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

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
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
    });

    const responseText = response.text || "";
    const parsedData = JSON.parse(responseText);

    if (parsedData.scenes && Array.isArray(parsedData.scenes)) {
      parsedData.scenes = parsedData.scenes.map((sc: any, i: number) => ({
        ...sc,
        start_time: sc.start_time || `00:00:${(i * 5).toString().padStart(2, '0')}.000`,
        end_time: sc.end_time || `00:00:${((i + 1) * 5).toString().padStart(2, '0')}.000`
      }));
    }

    if (!parsedData.subtitles) {
      parsedData.subtitles = [];
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/annotate-video:", error);
    return res.status(500).json({
      error: error.message || "Failed to process video annotation."
    });
  }
});

// Stage 3 Scene Description Revision API Endpoint
apiRouter.post(["/revise-scene", "/api/revise-scene"], async (req, res) => {
  try {
    const { sceneId, currentDescription, feedback, rawDescription, startImage, snapshotImage } = req.body;

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is missing. Please configure GEMINI_API_KEY in your Vercel Project Settings > Environment Variables, or in your local .env file."
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const parts: any[] = [];
    let prompt = `You are revising Scene #${sceneId}'s factual visual description based on user feedback.\n\n`;
    prompt += `CURRENT DESCRIPTION:\n"${currentDescription}"\n\n`;
    if (rawDescription) {
      prompt += `INITIAL USER GUIDANCE (Tagalog/English):\n"${rawDescription}"\n\n`;
    }
    prompt += `USER REVISION INSTRUCTIONS / FEEDBACK (Tagalog or English):\n"${feedback}"\n\n`;

    const imgToUse = startImage || snapshotImage;
    if (imgToUse && typeof imgToUse === 'string' && imgToUse.includes(',')) {
      const match = imgToUse.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (match) {
        parts.push({ text: `[SCENE #${sceneId} SNAPSHOT IMAGE]` });
        parts.push({
          inlineData: { mimeType: match[1], data: match[2] }
        });
      }
    }

    prompt += `INSTRUCTIONS:\n`;
    prompt += `1. Apply the user's feedback precisely to refine and rewrite the visual description.\n`;
    prompt += `2. Translate any Tagalog revision instructions into clear, professional English.\n`;
    prompt += `3. Adhere strictly to factual video annotation guidelines (objective visual description, no speculation, clear subject & background details).\n`;
    prompt += `4. Return ONLY a JSON object with key "revised_description".\n`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
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
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ revised_description: parsed.revised_description || currentDescription });
  } catch (err: any) {
    console.error("Error in /api/revise-scene:", err);
    return res.status(500).json({ error: err.message || "Failed to revise scene description." });
  }
});

// Audio MP3 Subtitle Transcription API Endpoint
apiRouter.post(["/transcribe-audio", "/api/transcribe-audio"], async (req, res) => {
  try {
    const { audioData, audioMimeType, fileName } = req.body;

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is missing. Please configure GEMINI_API_KEY in your Vercel Project Settings > Environment Variables, or in your local .env file."
      });
    }

    if (!audioData) {
      return res.status(400).json({ error: "Missing audioData in request body." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    let base64Audio = audioData;
    let mimeType = audioMimeType || "audio/mp3";

    if (typeof audioData === "string" && audioData.includes(",")) {
      const audioParts = audioData.split(",");
      base64Audio = audioParts[1];
      const mimeMatch = audioParts[0].match(/data:(audio\/[a-zA-Z0-9\+\-\.]+);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

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
      text: `Listen carefully to this uploaded audio file (${fileName || "uploaded audio track"}).
Transcribe all spoken dialogue, vocal sounds, music cues, and sound effects with accurate timestamps.
Output a JSON object containing a 'subtitles' array, where each item has:
- subtitle_id: number (1, 2, 3...)
- start_time: timestamp string in format "HH:MM:SS.mmm" (e.g., "00:00:01.500")
- end_time: timestamp string in format "HH:MM:SS.mmm" (e.g., "00:00:04.200")
- type: string ('Spoken words', 'Music', 'Sound effect', 'Ambient sound', 'Vocal sound', or 'Other')
- text: transcribed words or audio description in clear English/original language.`
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: { parts },
      config: {
        systemInstruction: "You are an expert audio transcription and subtitling AI. Convert spoken audio tracks into precise timed subtitles with timestamps and category tags.",
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
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);
  } catch (err: any) {
    console.error("Error in /api/transcribe-audio:", err);
    return res.status(500).json({ error: err.message || "Failed to transcribe audio file." });
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
