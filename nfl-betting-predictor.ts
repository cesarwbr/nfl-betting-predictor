import { LLMWithMCP } from "./ai/llm";
import { Prompts } from "./ai/prompts";

export interface Game {
    homeTeam: string;
    awayTeam: string;
    week: number;
}

export class NFLBettingPredictor {
    private llm: LLMWithMCP;

    constructor() {
        this.llm = new LLMWithMCP();
    }

    public async initialize() {
        this.llm.connect();
    }

    public async analyzeBettingOpportunity(game: Game) {
        const systemPrompt = Prompts.getSystemPrompt();
        const userPrompt = Prompts.getUserPrompt(game);

        const result = await this.llm.chat(systemPrompt, userPrompt);

        return result;
    }

    public async cleanUp() {
        this.llm.disconnect();
    }
}
