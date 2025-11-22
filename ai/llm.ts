import { Groq } from "groq-sdk";
import { BraveSearchMCP } from "./brave-search-mcp.js";
import { E2BSandbox } from "./e2b-sandbox.js";
import fs from "fs";
import { extractPythonCode, savePNGCharts } from "./llm-utils.js";

export class LLMWithMCP {
    private groq: Groq;
    private mcp: BraveSearchMCP;
    private sandbox: E2BSandbox;
    private pythonCodeExecutionCount: number = 0;
    private maxPythonExecutions: number = 1;
    private maxRetries: number;

    constructor() {
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        this.mcp = new BraveSearchMCP();
        this.sandbox = new E2BSandbox();
        this.maxRetries = parseInt(process.env.MAX_RETRIES || "3", 10);
        this.ensureResultsDirectory();
    }

    private ensureResultsDirectory() {
        const dir = "analysis_results";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    public async connect() {
        await this.mcp.connect();
    }

    public async disconnect() {
        await this.mcp.close();
        await this.sandbox.close();
    }

    private async executeChatRound(
        messages: any[],
        groqTools: any[],
    ): Promise<{ chartsGenerated: boolean; finalResponse: string }> {
        let response = await this.groq.chat.completions.create({
            model: "moonshotai/kimi-k2-instruct-0905",
            messages,
            tools: groqTools,
            tool_choice: "auto",
        });

        let chartsGenerated = false;

        while (response.choices[0]?.message?.tool_calls) {
            const toolCalls = response.choices[0].message.tool_calls;

            messages.push({
                role: "assistant",
                content: response.choices[0].message.content || "",
                tool_calls: toolCalls,
            });

            for (const toolCall of toolCalls) {
                let result: any;

                if (toolCall.function.name === "run_python_code") {
                    if (
                        this.pythonCodeExecutionCount >=
                        this.maxPythonExecutions
                    ) {
                        result = {
                            success: false,
                            error: "Python code execution limit reached. You can only call run_python_code once.",
                        };
                    } else {
                        let code: string | null;
                        try {
                            code = extractPythonCode(
                                toolCall.function.arguments,
                            );
                        } catch (e) {
                            result = {
                                success: false,
                                error: `Failed to parse Python code arguments: ${e}`,
                            };
                            messages.push({
                                role: "tool",
                                tool_call_id: toolCall.id,
                                content: JSON.stringify(result),
                            });
                            continue;
                        }

                        if (!code) {
                            result = {
                                success: false,
                                error: "No Python code found in arguments",
                            };
                            messages.push({
                                role: "tool",
                                tool_call_id: toolCall.id,
                                content: JSON.stringify(result),
                            });
                            continue;
                        }

                        this.pythonCodeExecutionCount++;

                        console.log("Executing:");
                        console.log(code);

                        const executionResult =
                            await this.sandbox.executeCode(code);

                        if (executionResult.success) {
                            if (
                                executionResult &&
                                executionResult.charts &&
                                executionResult.charts.length > 0
                            ) {
                                chartsGenerated = true;
                                const savedFiles = savePNGCharts(
                                    executionResult.charts,
                                    "nfl-analysis",
                                );
                                result = {
                                    success: true,
                                    stdout: executionResult.stdout,
                                    charts_saved: savedFiles,
                                    chart_count: executionResult.charts.length,
                                    message: `Code executed successfully! Generated ${executionResult.charts.length} chart(s): ${savedFiles.join(", ")}`,
                                };
                            } else {
                                result = {
                                    success: true,
                                    stdout: executionResult.stdout,
                                    message:
                                        "Code executed but no charts were generated. Did you use plt.savefig()?",
                                };
                            }
                        } else {
                            result = {
                                success: false,
                                error: executionResult.error,
                                traceback: executionResult.traceback,
                            };
                        }
                    }
                } else {
                    try {
                        result = await this.mcp.callTool(
                            toolCall.function.name,
                            JSON.parse(toolCall.function.arguments),
                        );
                    } catch (e) {
                        result = {
                            success: false,
                            error: `Failed to parse MCP tool arguments: ${e}`,
                        };
                    }
                }

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

        return {
            chartsGenerated,
            finalResponse: response.choices[0]?.message?.content || "",
        };
    }

    public async chat(systemPrompt: string, userMessage: string) {
        const mcpTools = await this.mcp.getTools();

        const groqTools = [
            ...mcpTools.map((tool) => ({
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
            })),
            {
                type: "function" as const,
                function: {
                    name: "run_python_code",
                    description:
                        "Execute Python code in a sandboxed environment. Use this to create visualizations and analyze data.",
                    parameters: {
                        type: "object" as const,
                        properties: {
                            code: {
                                type: "string",
                                description:
                                    "Python code to execute. MUST include matplotlib.pyplot.savefig() to save charts as PNG files.",
                            },
                        },
                        required: ["code"],
                    },
                },
            },
        ];

        let lastResponse = "";
        let chartsGenerated = false;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            this.pythonCodeExecutionCount = 0;

            const messages: any[] = [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content:
                        attempt > 0
                            ? `${userMessage}\n\n[Attempt ${attempt + 1}] Previous attempt failed to generate charts. Please try again with a different approach to ensure plt.savefig() is called.`
                            : userMessage,
                },
            ];

            const result = await this.executeChatRound(messages, groqTools);
            chartsGenerated = result.chartsGenerated;
            lastResponse = result.finalResponse;

            if (chartsGenerated) {
                break;
            }
        }

        await this.disconnect();

        return lastResponse;
    }
}
