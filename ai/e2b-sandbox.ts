import { Sandbox } from "@e2b/code-interpreter";

export class E2BSandbox {
  private sandbox: Sandbox | null = null;

  public async create() {
    // 15 minute timeout for long-running analyses
    this.sandbox = await Sandbox.create({
      timeoutMs: 15 * 60 * 1000,
    });
  }

  private async ensureSandbox() {
    if (!this.sandbox) {
      await this.create();
      return;
    }

    // Check if sandbox is still alive, recreate if needed
    try {
      // Try a simple operation to check if sandbox is alive
      await this.sandbox.setTimeout(15 * 60 * 1000);
    } catch (error) {
      console.log("Sandbox appears dead, recreating...");
      this.sandbox = null;
      await this.create();
    }
  }

  public async executeCode(code: string) {
    await this.ensureSandbox();

    try {
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
    } catch (error: any) {
      // If sandbox timed out or died, try to recreate and retry once
      if (error.message?.includes("sandbox") || error.code === 502) {
        console.log("Sandbox error, recreating and retrying...");
        this.sandbox = null;
        await this.ensureSandbox();

        // Retry once
        const execution = await this.sandbox!.runCode(code);

        if (execution.error) {
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

      throw error;
    }
  }

  public async close() {
    if (this.sandbox) {
      try {
        await this.sandbox.kill();
      } catch (error) {
        // Ignore errors when closing
        console.log("Error closing sandbox (may already be dead):", error);
      }
      this.sandbox = null;
    }
  }
}
