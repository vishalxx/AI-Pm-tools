export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, productType, focusArea } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ error: "Please enter a product problem statement." });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing OpenRouter API key on server." });
    }

    const fullPrompt = `
You are an AI Product Management Copilot.

Product Type: ${productType || "Not specified"}
Focus Area: ${focusArea || "Full PRD + user stories + prioritization"}

Product Problem:
${prompt}

Generate a portfolio-quality PM output with:
1. Problem Summary
2. User / Customer Impact
3. Product Goal
4. Success Metrics
5. PRD Requirements
6. User Stories
7. Acceptance Criteria
8. RICE Prioritization
9. Risks and Assumptions
10. Recommended Next Steps
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-pm-tools.vercel.app",
        "X-Title": "AI PM Copilot"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: "You are an expert product management assistant."
          },
          {
            role: "user",
            content: fullPrompt
          }
        ],
        temperature: 0.7
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
