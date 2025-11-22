import { LLMWithMCP } from "./ai/llm";
import { Prompts } from "./ai/prompts";
import fs from "fs";
import path from "path";

export interface Game {
    homeTeam: string;
    awayTeam: string;
    week: number;
}

export type AnalysisStatus = "pending" | "in_progress" | "completed" | "failed";

export interface AnalysisStatusInfo {
    status: AnalysisStatus;
    startedAt?: string;
    completedAt?: string;
    error?: string;
}

export class NFLBettingPredictor {
    private llm: LLMWithMCP;

    constructor() {
        this.llm = new LLMWithMCP();
    }

    public async initialize() {
        await this.llm.connect();
    }

    private getMatchFolder(game: Game): string {
        const folderName = `${game.homeTeam}-vs-${game.awayTeam}-week-${game.week}`;
        return path.join("analysis_results", folderName);
    }

    private getStatusPath(game: Game): string {
        return path.join(this.getMatchFolder(game), "status.json");
    }

    private updateStatus(game: Game, statusInfo: AnalysisStatusInfo): void {
        const matchFolder = this.getMatchFolder(game);
        fs.mkdirSync(matchFolder, { recursive: true });

        const statusPath = this.getStatusPath(game);
        fs.writeFileSync(statusPath, JSON.stringify(statusInfo, null, 2), "utf-8");
    }

    public getStatus(game: Game): AnalysisStatusInfo | null {
        const statusPath = this.getStatusPath(game);

        if (!fs.existsSync(statusPath)) {
            return null;
        }

        return JSON.parse(fs.readFileSync(statusPath, "utf-8"));
    }

    public startAnalysisInBackground(game: Game): void {
        // Update status to pending
        this.updateStatus(game, {
            status: "pending",
            startedAt: new Date().toISOString(),
        });

        // Run analysis in background
        this.runAnalysis(game).catch((error) => {
            console.error("Analysis failed:", error);
            this.updateStatus(game, {
                status: "failed",
                startedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                error: String(error),
            });
        });
    }

    private async runAnalysis(game: Game): Promise<void> {
        try {
            // Update status to in_progress
            this.updateStatus(game, {
                status: "in_progress",
                startedAt: new Date().toISOString(),
            });

            const systemPrompt = Prompts.getSystemPrompt();
            const userPrompt = Prompts.getUserPrompt(game);

            const matchFolder = this.getMatchFolder(game);
            const result = await this.llm.chat(systemPrompt, userPrompt, matchFolder);

            // Save result
            const resultPath = path.join(matchFolder, "result.md");
            fs.writeFileSync(resultPath, result, "utf-8");

            // Update status to completed
            this.updateStatus(game, {
                status: "completed",
                completedAt: new Date().toISOString(),
            });
        } catch (error) {
            // Update status to failed
            this.updateStatus(game, {
                status: "failed",
                completedAt: new Date().toISOString(),
                error: String(error),
            });
            throw error;
        }
    }

    public getAnalysisResult(game: Game): string | null {
        const resultPath = path.join(this.getMatchFolder(game), "result.md");

        if (!fs.existsSync(resultPath)) {
            return null;
        }

        return fs.readFileSync(resultPath, "utf-8");
    }

    public async cleanUp() {
        this.llm.disconnect();
    }
}
