import { Groq } from "groq-sdk";
import { BraveSearchMCP } from "./brave-search-mcp.js";

export class LLMWithMCP {
  private groq: Groq;
  private mcp: BraveSearchMCP;

  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.mcp = new BraveSearchMCP();
  }

  public async connect() {
    await this.mcp.connect();
  }

  public async chat(userMessage: string) {
    // Get available tools from MCP server
    const tools = await this.mcp.getTools();

    // Convert MCP tools to Groq format
    const groqTools = tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object" as const,
          properties: tool.inputSchema.properties,
          required: tool.inputSchema.required,
        },
      },
    }));

    // Initial message to LLM with tools
    const messages: any[] = [
      {
        role: "system",
        content: "You are Alessandro, a student from italy",
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    let response = await this.groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages,
      tools: groqTools,
      tool_choice: "auto",
    });

    // Handle tool calls in a loop until no more tool calls
    while (response.choices[0]?.message?.tool_calls) {
      const toolCalls = response.choices[0].message.tool_calls;

      // Add assistant message to conversation
      messages.push({
        role: "assistant",
        content: response.choices[0].message.content || "",
        tool_calls: toolCalls,
      });

      // Process each tool call and add results as separate messages
      for (const toolCall of toolCalls) {
        const result = await this.mcp.callTool(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments)
        );

        // Add tool result as a separate message with role "tool"
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      response = await this.groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages,
        tools: groqTools,
        tool_choice: "auto",
      });
    }

    await this.mcp.close();

    return response.choices[0]?.message?.content || "";
  }

  public async disconnect() {
    await this.mcp.close();
  }
}
