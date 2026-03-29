import { ExporterService } from '../../andb-core/src/modules/exporter/exporter.service';
import { ProjectConfigService } from '../../andb-core/src/modules/config/project-config.service';
import { StorageService } from '../../andb-core/src/modules/storage/storage.service';
import { CliStorageStrategy } from '../../andb-cli/src/storage/strategy/cli-storage.strategy';
import { DriverFactoryService } from '../../andb-core/src/modules/driver/driver-factory.service';
import { ParserService } from '../../andb-core/src/modules/parser/parser.service';
import { ConnectionType } from '../../andb-core/src/common/interfaces/connection.interface';
import * as path from 'path';
import * as fs from 'fs';

describe('ExporterService', () => {
  let exporter: ExporterService;
  let storage: StorageService;
  const testDbPath = path.join(__dirname, 'test-exporter.db');
  const dummySql = path.join(__dirname, 'dummy.sql');

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    fs.writeFileSync(dummySql, 'CREATE TABLE users (id INT);');

    const parser = new ParserService();
    const config = new ProjectConfigService();
    const driverFactory = new DriverFactoryService(parser);
    storage = new StorageService();
    await storage.initialize(new CliStorageStrategy(), testDbPath);

    config.setConnection('DUMMY', { type: ConnectionType.DUMP, host: dummySql, database: 'dummy.sql' }, ConnectionType.DUMP);

    exporter = new ExporterService(driverFactory, config, parser, storage);
  });

  afterAll(() => {
    storage.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    if (fs.existsSync(dummySql)) fs.unlinkSync(dummySql);
  });

  it('should export schema to storage', async () => {
    const result = await exporter.exportSchema('DUMMY') as any;
    expect(result.tables).toBe(1);

    // Verify storage has it
    const ddl = await storage.getDDL('DUMMY', 'dummy.sql', 'TABLES', 'users');
    expect(ddl).toContain('CREATE TABLE users');
  });
});
