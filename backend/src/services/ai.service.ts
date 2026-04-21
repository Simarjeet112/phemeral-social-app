const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ─── SHARED FETCH HELPER ────────────────────────────────
const callAI = async (prompt: string, maxTokens = 300): Promise<string> => {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content as string;
};

// ─── MESSAGE SUGGESTIONS ────────────────────────────────
export const getMessageSuggestions = async (
  messages: { sender: string; content: string }[]
): Promise<string[]> => {
  const conversation = messages
    .map((m) => `${m.sender}: ${m.content}`)
    .join("\n");

  const prompt = `
You are helping someone reply in an anonymous ephemeral chat. 
The conversation so far:

${conversation}

Give exactly 3 short reply suggestions for the last message.
Each suggestion should be casual, natural, and under 15 words.
Return ONLY a JSON array of 3 strings, nothing else.
Example: ["Sure, tell me more", "That's interesting!", "I feel the same way"]
`;

  const raw = await callAI(prompt, 200);

  const cleaned = raw.trim().replace(/```json|```/g, "").trim();
  const suggestions = JSON.parse(cleaned) as string[];

  return suggestions;
};

// ─── MOOD DETECTION ─────────────────────────────────────
export const detectMood = async (
  messages: { sender: string; content: string }[]
): Promise<{ mood: string; confidence: string; emoji: string }> => {
  const conversation = messages
    .map((m) => `${m.sender}: ${m.content}`)
    .join("\n");

  const prompt = `
Analyze the emotional tone of this conversation:

${conversation}

Return ONLY a JSON object with exactly these fields:
- mood: one word (e.g. "excited", "anxious", "flirty", "sad", "curious", "playful", "tense")
- confidence: one word ("high", "medium", "low")
- emoji: one relevant emoji

Example: {"mood": "flirty", "confidence": "high", "emoji": "😏"}
Return ONLY the JSON, nothing else.
`;

  const raw = await callAI(prompt, 100);

  const cleaned = raw.trim().replace(/```json|```/g, "").trim();
  const result = JSON.parse(cleaned) as {
    mood: string;
    confidence: string;
    emoji: string;
  };

  return result;
};

// ─── CAPTION IMPROVEMENT ────────────────────────────────
export const improveCaption = async (
  caption: string,
  mood?: string
): Promise<{ original: string; improved: string; alternatives: string[] }> => {
  const moodHint = mood ? `The desired vibe is: ${mood}.` : "";

  const prompt = `
You are improving a caption for an ephemeral social drop — a temporary moment shared with nearby strangers.
${moodHint}

Original caption: "${caption}"

Return ONLY a JSON object with:
- improved: the best single improved version (under 20 words, punchy)
- alternatives: array of 2 other variations

Example:
{
  "improved": "Something about this street feels different tonight",
  "alternatives": ["The city has a secret and I found it", "Not all who wander are lost. Some are just vibing."]
}
Return ONLY the JSON, nothing else.
`;

  const raw = await callAI(prompt, 250);

  const cleaned = raw.trim().replace(/```json|```/g, "").trim();
  const result = JSON.parse(cleaned) as {
    improved: string;
    alternatives: string[];
  };

  return {
    original: caption,
    ...result,
  };
};