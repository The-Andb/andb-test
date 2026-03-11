import { spawn, ChildProcess } from 'child_process';

export interface CliRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export class CliRunner {
  private process: ChildProcess | null = null;
  private stdoutData: string = '';
  private stderrData: string = '';

  constructor(private cliPath: string) { }

  /**
   * Run a CLI command and return results
   */
  public async run(args: string[], input: string[] = []): Promise<CliRunResult> {
    return new Promise((resolve) => {
      this.stdoutData = '';
      this.stderrData = '';

      this.process = spawn('node', [this.cliPath, ...args]);

      if (input.length > 0) {
        this.process.stdin?.write(input.join('\n') + '\n');
        this.process.stdin?.end();
      }

      this.process.stdout?.on('data', (data) => {
        this.stdoutData += data.toString();
      });

      this.process.stderr?.on('data', (data) => {
        this.stderrData += data.toString();
      });

      this.process.on('close', (code) => {
        resolve({
          stdout: this.stdoutData,
          stderr: this.stderrData,
          exitCode: code,
        });
      });
    });
  }

  /**
   * Run interactive (experimental - for future use)
   */
  public async runInteractive(args: string[], triggers: { pattern: string | RegExp, response: string }[]): Promise<CliRunResult> {
    return new Promise((resolve) => {
      this.stdoutData = '';
      this.stderrData = '';

      this.process = spawn('node', [this.cliPath, ...args]);

      this.process.stdout?.on('data', (data) => {
        const str = data.toString();
        this.stdoutData += str;

        for (const trigger of triggers) {
          if (str.match(trigger.pattern)) {
            this.process?.stdin?.write(trigger.response + '\n');
            break;
          }
        }
      });

      this.process.stderr?.on('data', (data) => {
        this.stderrData += data.toString();
      });

      this.process.on('close', (code) => {
        resolve({
          stdout: this.stdoutData,
          stderr: this.stderrData,
          exitCode: code,
        });
      });
    });
  }
}
