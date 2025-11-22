import { Sandbox } from "@e2b/code-interpreter";

export class E2BSandbox {
  private sandbox: Sandbox | null = null;

  public async create() {
    this.sandbox = await Sandbox.create();
  }

  public async executeCode(code: string) {
    if (!this.sandbox) {
      await this.create();
    }

    const execution = await this.sandbox!.runCode(code);

    if (execution.error) {
      console.error("❌ code error:", execution.error.value);

      return {
        success: false,
        error: execution.error.value,
        traceback: execution.error.traceback,
      };
    }

    const charts = [];
    for (const [idx, result] of execution.results.entries()) {
      if (result.png) {
        charts.push({
          index: idx,
          base64: result.png,
        });
      }
    }

    return {
      success: true,
      stdout: execution.logs.stdout,
      stderr: execution.logs.stderr,
      charts,
      text: execution.text,
    };
  }

  public async close() {
    if (this.sandbox) {
      await this.sandbox.kill();
    }
  }
}
