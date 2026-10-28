/**
 * verify-task — Supabase Edge Function (Deno)
 *
 * Sends a base64-encoded photo to Google Gemini (gemini-1.5-flash) and asks it
 * to judge whether the image satisfies a game's task criteria. Returns a strict
 * JSON verdict. The image is never persisted — it lives only for the duration
 * of the request.
 *
 * POST /functions/v1/verify-task
 * Body:   { "imageBase64": string, "taskCriteria": string }
 * 200:    { "verified": boolean, "confidence": number, "reason": string }
 *
 * Required secret: GEMINI_API_KEY  (`supabase secrets set GEMINI_API_KEY=...`)
 *
 * Deploy:  supabase functions deploy verify-task
 */

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface VerifyTaskRequest {
  imageBase64: string;
  taskCriteria: string;
}

interface VerifyTaskResponse {
  verified: boolean;
  confidence: number;
  reason: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Extracts the first valid JSON object from a possibly fenced LLM response. */
function extractJson(text: string): VerifyTaskResponse | null {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as Partial<VerifyTaskResponse>;
    if (typeof parsed.verified !== "boolean") return null;
    return {
      verified: parsed.verified,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.min(1, Math.max(0, parsed.confidence))
          : 0,
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
  } catch {
    return null;
  }
}

async function verifyWithGemini(
  imageBase64: string,
  taskCriteria: string,
  apiKey: string,
): Promise<VerifyTaskResponse> {
  const prompt =
    "You are an automated game verifier. Analyze the provided image to see " +
    `if it satisfies criteria: '${taskCriteria}'. ` +
    'Respond strictly with valid JSON: ' +
    '{"verified": boolean, "confidence": number, "reason": "explanation"}. ' +
    "Do not include markdown fences or any text outside the JSON object.";

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const payload = await res.json();
  const text: string | undefined =
    payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const blocked = payload?.promptFeedback?.blockReason;
    throw new Error(
      blocked ? `Gemini blocked the request: ${blocked}` : "Empty Gemini response",
    );
  }

  const verdict = extractJson(text);
  if (!verdict) throw new Error("Gemini returned unparseable JSON");
  return verdict;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "GEMINI_API_KEY is not configured" }, 500);
  }

  let body: VerifyTaskRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (
    typeof body?.imageBase64 !== "string" ||
    body.imageBase64.length === 0 ||
    typeof body?.taskCriteria !== "string" ||
    body.taskCriteria.length === 0
  ) {
    return jsonResponse(
      { error: "Expected { imageBase64: string, taskCriteria: string }" },
      400,
    );
  }

  // Guard against oversized payloads (~15 MB base64 ≈ 11 MB image).
  if (body.imageBase64.length > 15_000_000) {
    return jsonResponse({ error: "Image too large" }, 413);
  }

  try {
    const verdict = await verifyWithGemini(
      body.imageBase64,
      body.taskCriteria,
      apiKey,
    );
    return jsonResponse(verdict);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return jsonResponse({ error: message }, 502);
  }
});
