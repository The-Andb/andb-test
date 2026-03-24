import { CoreBridge } from '@the-andb/core';
import { CliStorageStrategy } from './andb-cli/src/storage/strategy/cli-storage.strategy';

async function run() {
  const strategy = new CliStorageStrategy();
  await CoreBridge.init('/Users/anph/Library/Application Support/TheAndb_v3_dev', '/Volumes/FlexibleWorkplace/side-pr/andb-storage.db', strategy);
  
  await CoreBridge.getStorage().saveDDL('DEV', 'preflow_41', 'TABLES', 'TEST_NAME_123', 'CREATE TABLE test()');
  
  const sqlite3 = require('better-sqlite3');
  const db = new sqlite3('/Volumes/FlexibleWorkplace/side-pr/andb-storage.db');
  console.log("DB Content:", db.prepare("SELECT export_name, export_type FROM ddl_exports WHERE export_name = 'TEST_NAME_123'").all());
}

run().catch(console.error);
