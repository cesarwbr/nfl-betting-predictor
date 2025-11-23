import { NFLBettingPredictor } from "./nfl-betting-predictor";

const predictor = new NFLBettingPredictor();

await predictor.initialize();

// Helper function to add CORS headers to responses
function addCORSHeaders(headers = {}) {
    return {
        ...headers,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

Bun.serve({
    port: 3000,
    routes: {
        "/api/analysis": {
            GET: async (req) => {
                try {
                    const url = new URL(req.url);
                    const homeTeam = url.searchParams.get("homeTeam");
                    const awayTeam = url.searchParams.get("awayTeam");
                    const week = url.searchParams.get("week");

                    if (!homeTeam || !awayTeam || !week) {
                        return new Response(
                            JSON.stringify({
                                error: "Missing one of the required parameters: homeTeam, awayTeam, week",
                            }),
                            {
                                status: 400,
                                headers: addCORSHeaders({
                                    "Content-Type": "application/json",
                                }),
                            },
                        );
                    }

                    const game = {
                        homeTeam,
                        awayTeam,
                        week: parseInt(week),
                    };

                    // Start analysis in background
                    predictor.startAnalysisInBackground(game);

                    return new Response(
                        JSON.stringify({
                            success: true,
                            message: "Analysis started in background",
                            game,
                        }),
                        {
                            headers: addCORSHeaders({
                                "Content-Type": "application/json",
                            }),
                        },
                    );
                } catch (error) {
                    return new Response(
                        JSON.stringify({ error: String(error) }),
                        {
                            status: 500,
                            headers: addCORSHeaders({
                                "Content-Type": "application/json",
                            }),
                        },
                    );
                }
            },
            OPTIONS: async (req) => {
                return new Response(null, {
                    status: 204,
                    headers: addCORSHeaders(),
                });
            },
        },
        "/api/status": {
            GET: async (req) => {
                try {
                    const url = new URL(req.url);
                    const homeTeam = url.searchParams.get("homeTeam");
                    const awayTeam = url.searchParams.get("awayTeam");
                    const week = url.searchParams.get("week");

                    if (!homeTeam || !awayTeam || !week) {
                        return new Response(
                            JSON.stringify({
                                error: "Missing one of the required parameters: homeTeam, awayTeam, week",
                            }),
                            {
                                status: 400,
                                headers: addCORSHeaders({
                                    "Content-Type": "application/json",
                                }),
                            },
                        );
                    }

                    const game = {
                        homeTeam,
                        awayTeam,
                        week: parseInt(week),
                    };

                    const status = predictor.getStatus(game);

                    if (!status) {
                        return new Response(
                            JSON.stringify({
                                status: "not_found",
                                message: "No analysis found for this match",
                            }),
                            {
                                status: 404,
                                headers: addCORSHeaders({
                                    "Content-Type": "application/json",
                                }),
                            },
                        );
                    }

                    return new Response(JSON.stringify(status), {
                        headers: addCORSHeaders({
                            "Content-Type": "application/json",
                        }),
                    });
                } catch (error) {
                    return new Response(
                        JSON.stringify({ error: String(error) }),
                        {
                            status: 500,
                            headers: addCORSHeaders({
                                "Content-Type": "application/json",
                            }),
                        },
                    );
                }
            },
            OPTIONS: async (req) => {
                return new Response(null, {
                    status: 204,
                    headers: addCORSHeaders(),
                });
            },
        },
        "/api/result": {
            GET: async (req) => {
                try {
                    const url = new URL(req.url);
                    const homeTeam = url.searchParams.get("homeTeam");
                    const awayTeam = url.searchParams.get("awayTeam");
                    const week = url.searchParams.get("week");

                    if (!homeTeam || !awayTeam || !week) {
                        return new Response(
                            JSON.stringify({
                                error: "Missing one of the required parameters: homeTeam, awayTeam, week",
                            }),
                            {
                                status: 400,
                                headers: addCORSHeaders({
                                    "Content-Type": "application/json",
                                }),
                            },
                        );
                    }

                    const game = {
                        homeTeam,
                        awayTeam,
                        week: parseInt(week),
                    };

                    const status = predictor.getStatus(game);

                    if (!status) {
                        return new Response(
                            JSON.stringify({
                                error: "Analysis not found for this match",
                            }),
                            {
                                status: 404,
                                headers: addCORSHeaders({
                                    "Content-Type": "application/json",
                                }),
                            },
                        );
                    }

                    if (status.status !== "completed") {
                        return new Response(
                            JSON.stringify({
                                error: "Analysis not yet completed",
                                status: status.status,
                                statusInfo: status,
                            }),
                            {
                                status: 202,
                                headers: addCORSHeaders({
                                    "Content-Type": "application/json",
                                }),
                            },
                        );
                    }

                    const analysis = predictor.getAnalysisResult(game);

                    if (!analysis) {
                        return new Response(
                            JSON.stringify({
                                error: "Analysis result file not found",
                            }),
                            {
                                status: 404,
                                headers: addCORSHeaders({
                                    "Content-Type": "application/json",
                                }),
                            },
                        );
                    }

                    return new Response(analysis, {
                        headers: addCORSHeaders({
                            "Content-Type": "text/markdown",
                        }),
                    });
                } catch (error) {
                    return new Response(
                        JSON.stringify({ error: String(error) }),
                        {
                            status: 500,
                            headers: addCORSHeaders({
                                "Content-Type": "application/json",
                            }),
                        },
                    );
                }
            },
            OPTIONS: async (req) => {
                return new Response(null, {
                    status: 204,
                    headers: addCORSHeaders(),
                });
            },
        },
    },
    development: {
        hmr: true,
        console: true,
    },
});

console.log("Server running at http://localhost:3000");
