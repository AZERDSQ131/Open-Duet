/**
 * Hermes Agent adapter.
 *
 * Open Duet treats the Hermes Agent as its brain: the UI stays local, while
 * chat turns are sent to an OpenAI-compatible chat endpoint on the agent.
 *
 * Configure it in mobile/.env:
 *   EXPO_PUBLIC_HERMES_AGENT_URL=http://192.168.1.20:8000
 *   EXPO_PUBLIC_HERMES_CHAT_PATH=/v1/chat/completions
 *   EXPO_PUBLIC_HERMES_AGENT_TOKEN=            # optional
 *
 * If no URL is configured, the app falls back to its built-in simulated replies.
 * If your Hermes Agent uses a different route or payload, change this file.
 */

const BASE_URL = (process.env.EXPO_PUBLIC_HERMES_AGENT_URL || "").replace(/\/+$/, "");
const CHAT_PATH = process.env.EXPO_PUBLIC_HERMES_CHAT_PATH || "/v1/chat/completions";
const TOKEN = process.env.EXPO_PUBLIC_HERMES_AGENT_TOKEN || "";

export const HERMES_ENABLED = Boolean(BASE_URL);

export async function askHermes(messages) {
  if (!HERMES_ENABLED) {
    throw new Error("Hermes Agent is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`${BASE_URL}${CHAT_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
      body: JSON.stringify({ messages, stream: false }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Hermes Agent returned ${response.status}`);
    }

    const data = await response.json();
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.message?.content ??
      data?.reply ??
      data?.output_text ??
      data?.output ??
      data?.text;

    if (typeof content === "string" && content.trim()) {
      return content.trim();
    }

    if (Array.isArray(content)) {
      const joined = content
        .map((part) => (typeof part === "string" ? part : part?.text || ""))
        .join("");
      if (joined.trim()) return joined.trim();
    }

    throw new Error("Hermes Agent returned an empty response");
  } finally {
    clearTimeout(timeout);
  }
}
