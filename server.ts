import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { z } from "zod";
import { DEMO_DICTIONARY_ENTRIES } from "./src/data/demoEntries";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// NVIDIA NIM Configuration
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";
const QUALITY_MODEL = DEFAULT_MODEL;

// Zod validation schemas for AI responses
const MeaningSchema = z.object({
  vietnamese: z.string(),
  englishDefinition: z.string(),
  register: z.string().nullable().optional(),
  context: z.string().nullable().optional(),
  examples: z.array(
    z.object({
      english: z.string(),
      vietnamese: z.string(),
    })
  ).default([]),
  collocations: z.array(z.string()).default([]),
});

const PartOfSpeechSchema = z.object({
  type: z.string(),
  forms: z.array(z.string()).default([]),
  meanings: z.array(MeaningSchema).default([]),
});

const WordFamilyItemSchema = z.object({
  word: z.string(),
  type: z.string(),
  vietnameseMeaning: z.string(),
});

const CommonMistakeSchema = z.object({
  incorrect: z.string(),
  correct: z.string(),
  explanationVietnamese: z.string(),
});

const DictionaryEntrySchema = z.object({
  query: z.string(),
  normalizedWord: z.string(),
  language: z.string().default("en"),
  ipaUS: z.string().nullable().optional(),
  ipaUK: z.string().nullable().optional(),
  syllables: z.string().nullable().optional(),
  cefr: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  partsOfSpeech: z.array(PartOfSpeechSchema).default([]),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  wordFamily: z.array(WordFamilyItemSchema).default([]),
  commonCollocations: z.array(z.string()).default([]),
  commonMistakes: z.array(CommonMistakeSchema).default([]),
  mnemonic: z.string().nullable().optional(),
});

const SentenceEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  grammarScore: z.number().min(0).max(100),
  meaningScore: z.number().min(0).max(100),
  naturalnessScore: z.number().min(0).max(100),
  collocationScore: z.number().min(0).max(100),
  isAccurate: z.boolean(),
  vietnameseFeedback: z.string(),
  correctedSentence: z.string().nullable().optional(),
  betterAlternatives: z.array(z.string()).default([]),
});

// Robust JSON extractor for LLM responses that may include conversational text,
// markdown code fences, trailing comments, or trailing commas.
function extractJsonString(raw: string): string {
  if (!raw || typeof raw !== "string") return "{}";
  let text = raw.trim();

  // 1. Look for ```json ... ``` or ``` ... ``` markdown fence anywhere in the response
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim();
  }

  // 2. If it's already bounded by { and }, return
  if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
    return text;
  }

  // 3. Find outermost { and }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1).trim();
  }

  // 4. Find outermost [ and ]
  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return text.substring(firstBracket, lastBracket + 1).trim();
  }

  return text;
}

function parseJsonSafely<T = any>(raw: string): T {
  const extracted = extractJsonString(raw);

  // Attempt 1: Direct JSON.parse
  try {
    return JSON.parse(extracted) as T;
  } catch (firstErr) {
    // Attempt 2: Strip comments and trailing commas before braces or brackets
    const sanitized = extracted
      .replace(/\/\*[\s\S]*?\*\//g, "") // remove block comments
      .replace(/\/\/[^\n\r]*/g, "")     // remove inline comments
      .replace(/,\s*([\]}])/g, "$1");   // remove trailing commas

    try {
      return JSON.parse(sanitized) as T;
    } catch {
      // Attempt 3: Fix unescaped control characters
      try {
        const sanitizedControl = sanitized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
        return JSON.parse(sanitizedControl) as T;
      } catch {
        // Attempt 4: Extract braces directly from original raw string
        const firstBrace = raw.indexOf("{");
        const lastBrace = raw.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const directBraces = raw.substring(firstBrace, lastBrace + 1)
            .replace(/,\s*([\]}])/g, "$1");
          return JSON.parse(directBraces) as T;
        }
        throw firstErr;
      }
    }
  }
}

// Normalizes dictionary structure to be resilient against LLM schema deviations
function normalizeDictionaryEntry(data: any, queryWord: string): any {
  if (!data || typeof data !== "object") {
    data = {};
  }

  const query = typeof data.query === "string" && data.query.trim() ? data.query.trim() : queryWord;
  const normalizedWord = typeof data.normalizedWord === "string" && data.normalizedWord.trim()
    ? data.normalizedWord.trim()
    : queryWord.toLowerCase().trim();

  // Normalize partsOfSpeech
  let partsOfSpeech = Array.isArray(data.partsOfSpeech) ? data.partsOfSpeech : [];
  if (partsOfSpeech.length === 0 && (data.meanings || data.vietnameseMeaning || data.definition)) {
    // Adapt flat structures
    partsOfSpeech = [
      {
        type: typeof data.partOfSpeech === "string" ? data.partOfSpeech : "general",
        forms: Array.isArray(data.forms) ? data.forms : [],
        meanings: [
          {
            vietnamese: data.vietnameseMeaning || data.vietnamese || data.meaning || "Định nghĩa",
            englishDefinition: data.englishDefinition || data.definition || "",
            register: data.register || null,
            context: data.context || null,
            examples: Array.isArray(data.examples)
              ? data.examples.map((ex: any) =>
                  typeof ex === "string" ? { english: ex, vietnamese: "" } : ex
                )
              : [],
            collocations: Array.isArray(data.collocations) ? data.collocations : []
          }
        ]
      }
    ];
  } else {
    partsOfSpeech = partsOfSpeech.map((pos: any) => ({
      type: typeof pos.type === "string" ? pos.type : "general",
      forms: Array.isArray(pos.forms) ? pos.forms : [],
      meanings: (Array.isArray(pos.meanings) ? pos.meanings : []).map((m: any) => ({
        vietnamese: typeof m.vietnamese === "string" ? m.vietnamese : (m.meaning || ""),
        englishDefinition: typeof m.englishDefinition === "string" ? m.englishDefinition : (m.definition || ""),
        register: typeof m.register === "string" ? m.register : null,
        context: typeof m.context === "string" ? m.context : null,
        examples: (Array.isArray(m.examples) ? m.examples : []).map((ex: any) => {
          if (typeof ex === "string") {
            return { english: ex, vietnamese: "" };
          }
          return {
            english: typeof ex?.english === "string" ? ex.english : "",
            vietnamese: typeof ex?.vietnamese === "string" ? ex.vietnamese : "",
          };
        }),
        collocations: Array.isArray(m.collocations)
          ? m.collocations.map((c: any) => String(c))
          : []
      }))
    }));
  }

  // Normalize wordFamily: handle both string[] and object[]
  let wordFamily = [];
  if (Array.isArray(data.wordFamily)) {
    wordFamily = data.wordFamily.map((wf: any) => {
      if (typeof wf === "string") {
        return { word: wf, type: "related", vietnameseMeaning: "" };
      }
      return {
        word: typeof wf?.word === "string" ? wf.word : "",
        type: typeof wf?.type === "string" ? wf.type : "",
        vietnameseMeaning: typeof wf?.vietnameseMeaning === "string" ? wf.vietnameseMeaning : ""
      };
    });
  }

  // Normalize commonMistakes
  let commonMistakes = [];
  if (Array.isArray(data.commonMistakes)) {
    commonMistakes = data.commonMistakes.map((cm: any) => {
      if (typeof cm === "string") {
        return { incorrect: "", correct: "", explanationVietnamese: cm };
      }
      return {
        incorrect: typeof cm?.incorrect === "string" ? cm.incorrect : "",
        correct: typeof cm?.correct === "string" ? cm.correct : "",
        explanationVietnamese: typeof cm?.explanationVietnamese === "string" ? cm.explanationVietnamese : ""
      };
    });
  }

  return {
    query,
    normalizedWord,
    language: "en",
    ipaUS: typeof data.ipaUS === "string" ? data.ipaUS : null,
    ipaUK: typeof data.ipaUK === "string" ? data.ipaUK : null,
    syllables: typeof data.syllables === "string" ? data.syllables : null,
    cefr: typeof data.cefr === "string" ? data.cefr : null,
    frequency: typeof data.frequency === "string" ? data.frequency : null,
    partsOfSpeech,
    synonyms: Array.isArray(data.synonyms) ? data.synonyms.map(String) : [],
    antonyms: Array.isArray(data.antonyms) ? data.antonyms.map(String) : [],
    wordFamily,
    commonCollocations: Array.isArray(data.commonCollocations) ? data.commonCollocations.map(String) : [],
    commonMistakes,
    mnemonic: typeof data.mnemonic === "string" ? data.mnemonic : null
  };
}

// Normalizes sentence evaluation output
function normalizeSentenceEvaluation(data: any): any {
  if (!data || typeof data !== "object") data = {};
  const num = (v: any, fallback = 75) => {
    const n = Number(v);
    return isNaN(n) ? fallback : Math.max(0, Math.min(100, Math.round(n)));
  };
  return {
    overallScore: num(data.overallScore, 75),
    grammarScore: num(data.grammarScore, 80),
    meaningScore: num(data.meaningScore, 75),
    naturalnessScore: num(data.naturalnessScore, 70),
    collocationScore: num(data.collocationScore, 70),
    isAccurate: typeof data.isAccurate === "boolean" ? data.isAccurate : true,
    vietnameseFeedback: typeof data.vietnameseFeedback === "string" && data.vietnameseFeedback.trim()
      ? data.vietnameseFeedback.trim()
      : "Câu của bạn diễn đạt khá tốt.",
    correctedSentence: typeof data.correctedSentence === "string" ? data.correctedSentence : null,
    betterAlternatives: Array.isArray(data.betterAlternatives) ? data.betterAlternatives.map(String) : [],
  };
}

// System prompt as specified in requirements
const SYSTEM_PROMPT = `You are an expert English-Vietnamese lexicographer and English teacher.
CRITICAL FORMAT RULES:
- Output strictly a SINGLE raw JSON object.
- NEVER include any introductory text, pleasantries, conversational filler (such as "Here's a translation...", "Here is...", "Sure!"), markdown explanations, or concluding remarks.
- Start your response immediately with '{' and end with '}'.

Analyze the supplied English word or phrase.
Return ONLY valid JSON matching the required schema.
Provide accurate modern English usage.
Identify the correct part or parts of speech.
Provide American and British IPA where confidently known.
Separate clearly different meanings.
Order meanings from most common to least common.
Translate meanings naturally into Vietnamese.
Provide a concise English definition.
Give natural example sentences and Vietnamese translations.
Include common collocations.
Include useful synonyms and antonyms.
Include word-family terms.
Identify common mistakes Vietnamese English learners may make.
Estimate CEFR level only when reasonable (A1, A2, B1, B2, C1, C2).
Avoid inventing obscure meanings simply to increase the number of definitions.
If uncertain about a field, return null or an empty array instead of hallucinating.

The JSON output MUST follow this exact schema:
{
  "query": string,
  "normalizedWord": string,
  "language": "en",
  "ipaUS": string or null,
  "ipaUK": string or null,
  "syllables": string or null,
  "cefr": "A1"|"A2"|"B1"|"B2"|"C1"|"C2" or null,
  "frequency": "very-common"|"common"|"medium"|"uncommon" or null,
  "partsOfSpeech": [
    {
      "type": string (e.g. "verb", "noun", "adjective"),
      "forms": [string],
      "meanings": [
        {
          "vietnamese": string,
          "englishDefinition": string,
          "register": "neutral"|"formal"|"informal"|"academic"|"slang"|null,
          "context": string or null,
          "examples": [{"english": string, "vietnamese": string}],
          "collocations": [string]
        }
      ]
    }
  ],
  "synonyms": [string],
  "antonyms": [string],
  "wordFamily": [{"word": string, "type": string, "vietnameseMeaning": string}],
  "commonCollocations": [string],
  "commonMistakes": [{"incorrect": string, "correct": string, "explanationVietnamese": string}],
  "mnemonic": string or null
}`;

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "LexiGlass" });
});

app.get("/api/ai/status", (_req, res) => {
  const apiKey = process.env.NVIDIA_API_KEY;
  const configured = Boolean(apiKey && apiKey.trim().length > 0 && !apiKey.includes("MY_NVIDIA_API_KEY"));
  res.json({
    configured,
    defaultModel: DEFAULT_MODEL,
    provider: "NVIDIA NIM",
    proxy: "Express Secure Proxy"
  });
});

app.post("/api/ai/lookup", async (req, res) => {
  try {
    const { word, model = DEFAULT_MODEL } = req.body;

    if (!word || typeof word !== "string" || !word.trim()) {
      res.status(400).json({ error: "Missing or invalid 'word' parameter." });
      return;
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey || !apiKey.trim() || apiKey.includes("MY_NVIDIA_API_KEY")) {
      res.status(401).json({
        error: "NVIDIA_API_KEY is not configured on the server.",
        code: "NO_API_KEY",
        message: "Please configure NVIDIA_API_KEY in the environment or use offline demo entries."
      });
      return;
    }

    const trimmedWord = word.trim();

    // Call NVIDIA NIM OpenAI-compatible endpoint
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyze the English word or phrase: "${trimmedWord}". Output ONLY a valid JSON object matching the schema. No introductory text, no conversational filler (like "Here is..."). Start immediately with '{' and end with '}'.`
          }
        ],
        temperature: 0.2,
        max_tokens: 2500,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("NVIDIA API error:", response.status, errText);
      res.status(response.status).json({
        error: `NVIDIA API responded with status ${response.status}`,
        details: errText
      });
      return;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    let parsedJson: any;
    try {
      parsedJson = parseJsonSafely(rawContent);
    } catch (parseErr) {
      console.warn("Direct JSON parse failed, attempting 1 repair retry...", parseErr);
      try {
        // Retry once with strict JSON repair prompt
        const repairResponse = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
          method: "POST",
          signal: AbortSignal.timeout(10000),
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content: "You are a JSON repair tool. You MUST output ONLY the raw JSON object. Do not include ANY conversational text, greetings, pleasantries, markdown tags, or preamble. Start directly with { and end with }."
              },
              {
                role: "user",
                content: `Format this broken or wrapped response into strictly valid JSON for the word "${trimmedWord}". Output raw JSON only:\n${rawContent}`
              }
            ],
            temperature: 0.1,
            max_tokens: 2500,
            response_format: { type: "json_object" }
          })
        });

        if (repairResponse.ok) {
          const repairData = await repairResponse.json();
          const repairedContent = repairData.choices?.[0]?.message?.content || "";
          parsedJson = parseJsonSafely(repairedContent);
        } else {
          throw new Error("Repair request failed");
        }
      } catch (repairErr) {
        console.error("Repair parse also failed:", repairErr);
        // Fallback: check if we have offline demo entry for this word
        const lower = trimmedWord.toLowerCase();
        if (DEMO_DICTIONARY_ENTRIES[lower]) {
          res.json(DEMO_DICTIONARY_ENTRIES[lower]);
          return;
        }
        throw parseErr;
      }
    }

    // Normalize and validate
    const normalized = normalizeDictionaryEntry(parsedJson, trimmedWord);
    const validated = DictionaryEntrySchema.parse(normalized);
    res.json(validated);
  } catch (error: any) {
    console.error("Lookup error:", error);
    const trimmedWord = typeof req.body?.word === "string" ? req.body.word.trim() : "";
    const lower = trimmedWord.toLowerCase();
    if (lower && DEMO_DICTIONARY_ENTRIES[lower]) {
      res.json(DEMO_DICTIONARY_ENTRIES[lower]);
      return;
    }
    if (error instanceof z.ZodError) {
      res.status(422).json({ error: "Validation failed on AI response structure", issues: error.issues });
      return;
    }
    res.status(500).json({ error: error.message || "Internal server error during dictionary lookup." });
  }
});

app.post("/api/ai/evaluate-sentence", async (req, res) => {
  try {
    const { word, userSentence, targetMeaning, model = DEFAULT_MODEL } = req.body;

    if (!word || !userSentence) {
      res.status(400).json({ error: "word and userSentence are required." });
      return;
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey || !apiKey.trim() || apiKey.includes("MY_NVIDIA_API_KEY")) {
      res.status(401).json({
        error: "NVIDIA_API_KEY is not configured.",
        code: "NO_API_KEY"
      });
      return;
    }

    const evalSystemPrompt = `You are an expert English teacher evaluating a Vietnamese learner's sentence production.
The student was asked to write one natural English sentence using the target word: "${word}".
${targetMeaning ? `Intended meaning context: "${targetMeaning}"` : ""}

Evaluate the sentence and return ONLY valid JSON matching this schema:
{
  "overallScore": number (0-100),
  "grammarScore": number (0-100),
  "meaningScore": number (0-100),
  "naturalnessScore": number (0-100),
  "collocationScore": number (0-100),
  "isAccurate": boolean,
  "vietnameseFeedback": string (concise, encouraging, pointing out specific nuances in Vietnamese),
  "correctedSentence": string or null (improved version if flawed),
  "betterAlternatives": [string] (1-2 more natural native alternatives)
}`;

    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: evalSystemPrompt },
          { role: "user", content: `Student sentence: "${userSentence}". Evaluate and return ONLY raw JSON matching schema. Do not write any conversational preamble or "Here is". Start directly with { and end with }.` }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      res.status(response.status).json({ error: "NVIDIA API evaluation failed" });
      return;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    const parsed = parseJsonSafely(rawContent);
    const normalized = normalizeSentenceEvaluation(parsed);
    const validated = SentenceEvaluationSchema.parse(normalized);

    res.json(validated);
  } catch (error: any) {
    console.error("Evaluation error:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate sentence." });
  }
});

// Vite / static file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LexiGlass] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
