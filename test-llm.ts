import Anthropic from "@anthropic-ai/sdk";

console.log("key", process.env.ANTHROPIC_API_KEY);

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await client.messages.create({
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello, Claude" }],
  model: "claude-sonnet-4-5-20250929",
});

console.log(message.content);
