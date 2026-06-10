export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { transcript } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: "Please enter a meeting transcript." });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing OpenRouter API key on server." });
    }

    const prompt = `
You are an Ambient Meeting Intelligence assistant.

Analyze this meeting transcript:

${transcript}

Return the answer in these exact sections:

DECISIONS:
List the key decisions made.

ACTION ITEMS:
List action items with owner if available, task, and urgency.

OPEN QUESTIONS:
List unresolved questions or follow-ups.

SENTIMENT:
Summarize meeting tone, alignment, risks, and stakeholder sentiment.

EXECUTIVE SUMMARY:
Give a concise summary suitable for a product manager.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-pm-tools.vercel.app",
        "X-Title": "Ambient Meeting Intelligence"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: "You are an expert meeting intelligence assistant that extracts decisions, action items, open questions, sentiment, and executive summaries."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenRouter request failed."
      });
    }

    return res.status(200).json({
      result: data?.choices?.[0]?.message?.content || "No output generated."
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error."
    });
  }
}
