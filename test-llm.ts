import { LLMWithMCP } from "./llm.ts";

async function testLLMWithMCP() {
    const llm = new LLMWithMCP();

    try {
        await llm.connect();
        const response = await llm.chat(
            "Search for information about NFL betting trends and give me a summary",
        );
        console.log("LLM Response:", response);
    } catch (error) {
        console.error("Error:", error);
    }
}

testLLMWithMCP();
