import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "docker",
  args: [
    "run",
    "-i",
    "--rm",
    "-e",
    `BRAVE_API_KEY=${process.env.BRAVE_API_KEY}`,
    "mcp/brave-search",
  ],
});

const client = new Client(
  {
    name: "brave-search-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  },
);

await client.connect(transport);

const tools = await client.listTools();

const result = await client.callTool({
  name: "brave_web_search",
  arguments: {
    query: "Who is Cesar William Alvarenga",
    count: 1,
  },
});

console.log("Search result:", result);
