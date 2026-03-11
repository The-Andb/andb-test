import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const scenarioMap = require('./fixtures/scenario-map.json');

const execPromise = util.promisify(exec);

import { CliRunner } from './utils/cli-runner';

// Helper: use professional CliRunner
const runner = new CliRunner(path.join(__dirname, '../../andb-cli/andb.js'));
async function execPlayground(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return await runner.run(args);
}

describe('CLI Playground Matrix E2E', () => {
  const cliPath = path.join(__dirname, '../../andb-cli/andb.js');
  const scenariosDir = path.join(__dirname, 'fixtures/scenarios');
  const scenarios = fs.readdirSync(scenariosDir).filter(f =>
    fs.statSync(path.join(scenariosDir, f)).isDirectory()
  );

  // Scenarios where normalization should make source === target (zero false positives)
  const noChangeScenarios = new Set([
    'int-display-width',
    'implicit-btree',
    'reorder-columns',
    'implicit-collation'
  ]);

  const skipScenarios = new Set([
    'table-rename' // Directory is empty in current repo state
  ]);

  const scenarioData = scenarios
    .filter(id => !skipScenarios.has(id))
    .map(id => ({
      id,
      description: (scenarioMap as Record<string, string>)[id] || 'Dynamic database transformation'
    }));

  test.each(scenarioData)('Scenario: $description ($id)', async ({ id, description }) => {
    const sourceFile = path.join(scenariosDir, id, 'source.sql');
    const targetFile = path.join(scenariosDir, id, 'target.sql');

    const args = ['playground', '-s', sourceFile, '-t', targetFile];

    const { stdout, stderr, exitCode } = await execPlayground(args);

    // UI/Headers/Metadata now go to stderr
    expect(stderr).toContain('Comparing');
    const cleanStderr = stderr.replace(/\x1b\[[0-9;]*m/g, '');

    // Extract operations summary from stderr (structured output)
    const diffMatch = cleanStderr.match(/--- Diff Operations ---\s+([\s\S]+?)\s+--- Generated/);

    // stdout now contains ONLY the generated SQL
    const cleanStdout = stdout.replace(/\x1b\[[0-9;]*m/g, '').trim();

    if (noChangeScenarios.has(id) || cleanStderr.includes('structurally identical')) {
      // Tier 1 / Normalization: Engine should detect ZERO differences
      const diff = diffMatch ? JSON.parse(diffMatch[1]) : null;
      if (diff) {
        console.log(`   \x1b[36m◌ Zero Operations (normalization pass)\x1b[0m`);
        expect(diff.hasChanges).toBe(false);
        expect(diff.operations.length).toBe(0);
      }
      expect(cleanStdout).toBe('');
    } else if (diffMatch) {
      // Standard scenario: parse and validate operations
      const diff = JSON.parse(diffMatch[1]);
      const ops = diff.operations.map((op: any) => `${op.type} ${op.target} ${op.name}`).join(', ');
      console.log(`   \x1b[32m✔ Detected Operations:\x1b[0m ${ops}`);
      expect(diff.hasChanges).toBe(true);
      expect(diff.operations.length).toBeGreaterThan(0);
    } else if (!id.includes('drop-table') && !id.includes('new-table')) {
      // Fallback for scenarios without structured diff output
      expect(cleanStdout).toMatch(/ALTER TABLE|^$/);
    }
  });

  it('should fail gracefully if files are not found', async () => {
    const args = ['playground', '-s', 'fake1.sql', '-t', 'fake2.sql'];

    const { stdout, stderr, exitCode } = await runner.run(args);

    // CLI uses andb-logger which might output to stdout OR stderr depending on environment
    const allOutput = (stdout || '') + (stderr || '');
    expect(allOutput).toContain('no such file or directory');
    expect(exitCode).toBe(1);
  });
});
