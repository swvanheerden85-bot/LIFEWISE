

const ALLOWED_ORIGIN = "https://swvanheerden85-bot.github.io";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    const reply = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers });

    if (origin && origin !== ALLOWED_ORIGIN) {
      return reply({ error: "Origin not allowed" }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method === "GET") {
      return reply({
        app: "LIFEWISE AI",
        status: "Worker is ready"
      });
    }

    if (request.method !== "POST") {
      return reply({ error: "Method not allowed" }, 405);
    }

    if (!env.OPENAI_API_KEY) {
      return reply({ error: "AI key is not configured" }, 500);
    }

    try {
      const body = await request.json();
      const message = String(body.message || "").trim();

      if (!message || message.length > 4000) {
        return reply({ error: "Please enter a message under 4000 characters." }, 400);
      }

      const response = await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-6-luna",
            instructions: "You are LIFEWISE, a friendly and intelligent everyday life assistant. Help people organise tasks, understand information, plan, write messages and solve everyday problems. Reply in the language the user uses. Be practical, clear and helpful.",
            input: message,
            max_output_tokens: 1000
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return reply({
          error: result.error?.message || "AI service error"
        }, 502);
      }

      const answer = (result.output || [])
        .flatMap(item => item.content || [])
        .filter(item => item.type === "output_text")
        .map(item => item.text)
        .join("\n");

      return reply({ answer });

    } catch (error) {
      return reply({ error: "Something went wrong. Please try again." }, 500);
    }
  }
};
