import fs from "fs";
import path from "path";

export function savePNGCharts(
    charts: Array<{ index: number; base64: string }>,
    prefix: string = "chart",
) {
    const savedFiles: string[] = [];
    const dir = "analysis_results";
    for (const chart of charts) {
        const filename = `${prefix}-${chart.index}.png`;
        const filepath = path.join(dir, filename);
        fs.writeFileSync(filepath, chart.base64, { encoding: "base64" });
        savedFiles.push(filename);
    }
    return savedFiles;
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
