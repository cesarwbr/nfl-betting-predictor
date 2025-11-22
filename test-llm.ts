import { LLMWithMCP } from "./llm.ts";

async function testLLMWithMCP() {
    const llm = new LLMWithMCP();

    try {
        await llm.connect();
        await llm.chat(
            `Search for recent NFL betting trends and statistics. Based on the data you find, generate a Python visualization (multiple charts) that shows:
            1. Key betting trends (e.g., moneyline odds trends, over/under betting patterns)
            2. Team performance vs betting consensus
            3. Any interesting correlation patterns
            Use matplotlib to create a clear, informative chart showing these trends. Save the visualization as a PNG file.
            `,
        );
    } catch (error) {
        console.error("Error:", error);
    }
}

testLLMWithMCP();
