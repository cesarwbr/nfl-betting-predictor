import { NFLBettingPredictor } from "./nfl-betting-predictor";

const predictor = new NFLBettingPredictor();

await predictor.initialize();

Bun.serve({
  port: 3000,
  fetch: async (req) => {
    const url = new URL(req.url);

    if (url.pathname === "/api/analysis") {
      try {
        const homeTeam = url.searchParams.get("homeTeam");
        const awayTeam = url.searchParams.get("awayTeam");
        const week = url.searchParams.get("week");

        if (!homeTeam || !awayTeam || !week) {
          return new Response(
            JSON.stringify({
              error:
                "Missing one of the required parameters: homeTeam, awayTeam, week",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        const analysis = await predictor.analyzeBettingOpportunity({
          homeTeam,
          awayTeam,
          week: parseInt(week),
        });

        return new Response(analysis, {
          headers: { "Content-Type": "text/plain" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
  routes: {},
  development: {
    hmr: true,
    console: true,
  },
});

console.log("Server running at http://localhost:3000");
