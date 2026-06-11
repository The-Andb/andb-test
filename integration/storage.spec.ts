import 'reflect-metadata';
import { StorageService } from '../../andb-core/src/modules/storage/storage.service';
import { CliStorageStrategy } from '../../andb-cli/src/storage/strategy/cli-storage.strategy';
import * as path from 'path';
import * as fs from 'fs';

describe('StorageService', () => {
  let storage: StorageService;
  const testDbPath = path.join(__dirname, 'test-storage.db');

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    storage = new StorageService();
    const strategy = new CliStorageStrategy();
    await storage.initialize(strategy, testDbPath);
  });

  afterAll(() => {
    storage.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  it('should save and retrieve DDL exports', async () => {
    await storage.saveDDL('DEV', 'mydb', 'TABLE', 'users', 'CREATE TABLE users (id INT)');
    const content = await storage.getDDL('DEV', 'mydb', 'TABLE', 'users');
    expect(content).toBe('CREATE TABLE users (id INT)');

    const objects = await storage.getDDLObjects('DEV', 'mydb', 'TABLE') as any[];
    expect(objects.length).toBe(1);
    expect(objects[0].name).toBe('users');
  });

  it('should return environments and databases', async () => {
    const envs = await storage.getEnvironments();
    expect(envs).toContain('DEV');

    const dbs = await storage.getDatabases('DEV');
    expect(dbs.map((d: any) => d.name)).toContain('mydb');
  });

  it('should save and retrieve comparisons', async () => {
    await storage.saveComparison({
      srcEnv: 'DEV',
      destEnv: 'PROD',
      database: 'mydb',
      type: 'TABLE',
      name: 'users',
      status: 'different',
      alterStatements: ['ALTER TABLE users ADD COLUMN age INT']
    });

    const comps = await storage.getComparisons('DEV', 'PROD', 'mydb', 'TABLE') as any[];
    expect(comps.length).toBe(1);
    expect(comps[0].ddl_name).toBe('users');
    expect(comps[0].alter_statements).toContain('ALTER TABLE users ADD COLUMN age INT');

    const latest = await storage.getLatestComparisons(5);
    expect(latest.length).toBeGreaterThan(0);
  });

  it('should handle snapshots', async () => {
    await storage.saveSnapshot('PROD', 'mydb', 'TABLE', 'users', 'CREATE TABLE users (id INT)', 'hash_v1');
    const snaps = await storage.getSnapshots('PROD', 'mydb', 'TABLE', 'users') as any[];
    expect(snaps.length).toBe(1);
    expect(snaps[0].hash).toBe('hash_v1');

    const allSnaps = await storage.getAllSnapshots(10);
    expect(allSnaps.length).toBeGreaterThan(0);
  });

  it('should save migration history', async () => {
    await storage.addMigrationHistory('DEV', 'mydb', 'SYNC', { table: 'users' });

    const history = await storage.getMigrationHistory(5) as any[];
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].status).toBe('PENDING');
  });

  it('should provide stats', async () => {
    const stats = await storage.getStats();
    expect(stats.exports).toBeGreaterThan(0);
    expect(stats.snapshots).toBeGreaterThan(0);
  });

  it('should clear data', async () => {
    await storage.clearConnectionData('DEV', 'mydb');
    const envs = await storage.getEnvironments();
    expect(envs).not.toContain('DEV');

    await storage.execute('DELETE FROM ddl_exports');
    const stats = await storage.getStats();
    expect(stats.exports).toBe(0);
  });
});
