import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import OpenAI from "openai";

const OPENROUTER_API_KEY = defineSecret("OPENROUTER_API_KEY");

export const proxyOpenRouter = onRequest(
  { cors: true, region: "us-central1", secrets: [OPENROUTER_API_KEY], timeoutSeconds: 540 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const { model, messages, schema, seed, temperature } = req.body || {};

      if (!Array.isArray(messages) || !schema) {
        res.status(400).json({ error: "Invalid payload: messages (array) and schema (object) are required." });
        return;
      }

      const client = new OpenAI({
        apiKey: OPENROUTER_API_KEY.value(),
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "X-Title": "Kalamuth",
        },
      });

      const request: any = {
        model: model || "nvidia/nemotron-nano-9b-v2:free",
        messages,
        response_format: {
          type: "json_schema",
          json_schema: { name: "Gladiator", strict: true, schema },
        },
        seed,
        temperature: typeof temperature === "number" ? temperature : 0.8,
      };

      const completion = await client.chat.completions.create(request);

      const content = completion.choices?.[0]?.message?.content || "";
      res.status(200).json({ content });
      return;
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "Unknown error";
      res.status(500).json({ error: msg });
      return;
    }
  }
);

