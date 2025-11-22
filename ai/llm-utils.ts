import fs from "fs";
import path from "path";

export interface ChartInfo {
    filename: string;
    base64: string;
}

export function savePNGCharts(
    charts: Array<{ index: number; base64: string }>,
    dir: string,
    prefix: string = "chart",
): ChartInfo[] {
    const chartInfos: ChartInfo[] = [];

    // Ensure directory exists
    fs.mkdirSync(dir, { recursive: true });

    for (const chart of charts) {
        const filename = `${prefix}-${chart.index}.png`;
        const filepath = path.join(dir, filename);
        fs.writeFileSync(filepath, chart.base64, { encoding: "base64" });
        chartInfos.push({
            filename,
            base64: chart.base64,
        });
    }
    return chartInfos;
}

export function embedChartsInMarkdown(markdown: string, charts: ChartInfo[]): string {
    if (charts.length === 0) {
        return markdown;
    }

    // Add charts section at the end of the markdown
    let result = markdown + "\n\n## Generated Charts\n\n";

    for (const chart of charts) {
        result += `### ${chart.filename}\n\n`;
        result += `![${chart.filename}](data:image/png;base64,${chart.base64})\n\n`;
    }

    return result;
}

export function extractPythonCode(argumentsString: string): string | null {
    try {
        const args = JSON.parse(argumentsString);
        return args.code;
    } catch {
        const codeMatch =
            argumentsString.match(/"code"\s*:\s*"((?:\\.|[^"\\])*)"/) ||
            argumentsString.match(/"code"\s*:\s*([^}]+)/);
        if (codeMatch) {
            let code = codeMatch[1];
            if (code) {
                code = code.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
                return code;
            } else return null;
        }
        return null;
    }
}
