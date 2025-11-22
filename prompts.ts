import type { Game } from "./types";

export class Prompts {
  static getSystemPrompt() {
    return `You are an expert NFL betting analyst. You have access to:
1. Brave Search tools (brave_web_search, brave_news_search) - to find betting lines, injuries, weather, news
2. execute_python - to run statistical analysis and predictions in E2B sandbox

CRITICAL: First use brave_web_search to find current betting odds (spread, total, moneyline).

Always use function calls to gather data and analyze. Do not make up information.`;
  }

  static getUserPrompt(game: Game) {
    return `Analyze this NFL game for betting opportunities:

**Game:** ${game.homeTeam} vs ${game.awayTeam}
**Game Week:** ${game.week}

Process:
1. Use brave_web_search to find current betting lines
2. Use brave_web_search and brave_news_search for injuries, weather, predictions
3. Use execute_python to analyze the data
4. Provide betting recommendations in JSON format`;
  }
}
