import { OrchestrationService } from '../../andb-core/src/modules/orchestration/orchestration.service';
import { SecurityOrchestrator } from '../../andb-core/src/modules/orchestration/security-orchestrator.service';
import { GitOrchestrator } from '../../andb-core/src/modules/orchestration/git-orchestrator.service';
import { SchemaOrchestrator } from '../../andb-core/src/modules/orchestration/schema-orchestrator.service';
import { ProjectConfigService } from '../../andb-core/src/modules/config/project-config.service';
import { StorageService } from '../../andb-core/src/modules/storage/storage.service';
import { CliStorageStrategy } from '../../andb-cli/src/storage/strategy/cli-storage.strategy';
import { DriverFactoryService } from '../../andb-core/src/modules/driver/driver-factory.service';
import { ComparatorService } from '../../andb-core/src/modules/comparator/comparator.service';
import { ParserService } from '../../andb-core/src/modules/parser/parser.service';
import { ExporterService } from '../../andb-core/src/modules/exporter/exporter.service';
import { MigratorService } from '../../andb-core/src/modules/migrator/migrator.service';
import { ConnectionType } from '../../andb-core/src/common/interfaces/connection.interface';
import { featureConfig } from '../../andb-core/src/modules/config/feature.config';
import * as path from 'path';
import * as fs from 'fs';

describe('OrchestrationService Integration', () => {
  let orchestration: OrchestrationService;
  let storage: StorageService;
  let config: ProjectConfigService;
  const testDbPath = path.join(__dirname, 'test-orchestration.db');
  const srcSql = path.join(__dirname, 'src.sql');
  const destSql = path.join(__dirname, 'dest.sql');

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

    const parser = new ParserService();
    storage = new StorageService();
    await storage.initialize(new CliStorageStrategy(), testDbPath);

    config = new ProjectConfigService();
    const driverFactory = new DriverFactoryService(parser);
    const comparator = new ComparatorService(parser, storage, config);
    const migrator = new MigratorService();
    const exporter = new ExporterService(driverFactory, config, parser, storage);

    const mirrorService = {} as any;
    const gitOrchestrator = new GitOrchestrator(mirrorService);
    const securityOrchestrator = new SecurityOrchestrator(config, driverFactory);
    const schemaOrchestrator = new SchemaOrchestrator(
      config,
      storage,
      driverFactory,
      comparator,
      exporter,
      migrator,
      {} as any, // semanticDiff
      gitOrchestrator,
      {} as any, // dependencySearch
      parser
    );

    orchestration = new OrchestrationService(
      config,
      featureConfig,
      securityOrchestrator,
      gitOrchestrator,
      schemaOrchestrator,
      parser
    );

    // Create mock SQL files for DumpDriver
    fs.writeFileSync(srcSql, 'CREATE TABLE `users` (\n  `id` INT PRIMARY KEY,\n  `name` TEXT\n);');
    fs.writeFileSync(destSql, 'CREATE TABLE `users` (\n  `id` INT PRIMARY KEY\n);');

    // Rule #1 parity: Populate storage for offline compare
    await storage.saveDDL('SOURCE', 'src.sql', 'TABLES', 'users', 'CREATE TABLE `users` (\n  `id` INT PRIMARY KEY,\n  `name` TEXT\n);');
    await storage.saveDDL('TARGET', 'dest.sql', 'TABLES', 'users', 'CREATE TABLE `users` (\n  `id` INT PRIMARY KEY\n);');
  });

  afterAll(() => {
    storage.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  describe('Connection & Basic Ops', () => {
    it('should test connection successfully', async () => {
      const result = await orchestration.execute('test-connection', {
        host: srcSql,
        type: ConnectionType.DUMP,
        database: 'test.sql'
      });
      expect(result.success).toBe(true);
    });

    it('should throw error for unknown operation', async () => {
      await expect(orchestration.execute('invalid-op', {})).rejects.toThrow('Unknown operation');
    });
  });

  describe('Schema Comparison & Migration (Offline/Dump)', () => {
    beforeAll(() => {
      // Already created in top-level beforeAll
    });

    afterAll(() => {
      if (fs.existsSync(srcSql)) fs.unlinkSync(srcSql);
      if (fs.existsSync(destSql)) fs.unlinkSync(destSql);
    });

    it('should compare two dump files and identify changes', async () => {
      const payload = {
        srcEnv: 'SOURCE',
        destEnv: 'TARGET',
        sourceConfig: { type: ConnectionType.DUMP, host: srcSql, database: 'src.sql' },
        targetConfig: { type: ConnectionType.DUMP, host: destSql, database: 'dest.sql' },
        type: 'tables'
      };

      const diff = await orchestration.execute('compare', payload);
      expect(Array.isArray(diff)).toBe(true);

      const userTable = diff.find((d: any) => d.name === 'users');
      expect(userTable).toBeDefined();
      expect(userTable.status).toBe('different');
      expect(userTable.alterStatements.some((s: string) => s.includes('ADD COLUMN `name`'))).toBe(true);
    });

    it('should migrate changes with auto-backup enabled', async () => {
      const payload = {
        srcEnv: 'SOURCE',
        destEnv: 'TARGET',
        sourceConfig: { type: ConnectionType.DUMP, host: srcSql, database: 'src.sql' },
        targetConfig: { type: ConnectionType.DUMP, host: destSql, database: 'dest.sql' },
        objects: [
          {
            name: 'users',
            type: 'TABLE',
            status: 'different',
            ddl: ['ALTER TABLE users ADD COLUMN name TEXT;']
          }
        ]
      };

      // Set auto-backup in config
      config.setAutoBackup(true);

      const result = await orchestration.execute('migrate', payload);
      expect(result.success).toBe(true);
      expect(result.successful.length).toBe(1);

      // Verify backup exists in storage
      const stats = await storage.getStats();
      expect(stats.snapshots).toBeDefined();
    });
  });

  describe('User Setup Generation', () => {
    it('should generate script for restricted user (MySQL driver imitation)', async () => {
      // We can't easily test real MySQL generation here without a real driver instance 
      // that has the generateUserSetupScript method. DumpDriver doesn't support it.
      // But we can verify the error handling when it's not supported.
      const payload = {
        adminConnection: { type: ConnectionType.DUMP, host: srcSql, database: 'fake.sql' },
        restrictedUser: { username: 'testuser', password: 'password' },
        permissions: { read: true }
      };

      await expect(orchestration.execute('generate-user-setup-script', payload))
        .rejects.toThrow('User setup script generation is not supported');
    });
  });
});
