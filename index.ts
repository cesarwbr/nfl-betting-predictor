import { NFLBettingPredictor } from "./nfl-betting-predictor";

async function main() {
  const predictor = new NFLBettingPredictor();

  try {
    await predictor.initialize();

    const analysis = await predictor.analyzeBettingOpportunity({
      homeTeam: "Minnesota Vikings",
      awayTeam: "Green Bay Packers",
      week: 12,
    });

    console.log(analysis);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    predictor.cleanUp();
  }
}

await main();
