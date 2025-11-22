import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export class BraveSearchMCP {
  private transport: StdioClientTransport;
  private client: Client;

  constructor() {
    this.transport = new StdioClientTransport({
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

    this.client = new Client(
      {
        name: "brave-search-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      },
    );
  }

  public connect() {
    return this.client.connect(this.transport);
  }

  public async getTools() {
    const toolsResponse = await this.client.listTools();

    return toolsResponse.tools;
  }

  public async close() {
    await this.client.close();
  }
}
