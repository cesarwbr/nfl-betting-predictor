import { LLMWithMCP } from "../ai/llm.ts";

async function testLLMWithMCP() {
    const llm = new LLMWithMCP();

    try {
        await llm.connect();
        // await llm.chat();
    } catch (error) {
        console.error("Error:", error);
    }
}

testLLMWithMCP();
