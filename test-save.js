const { CoreBridge } = require('./andb-core/dist/index');
const { CliStorageStrategy } = require('./andb-cli/dist/storage/strategy/cli-storage.strategy');
const path = require('path');
const sqlite3 = require('better-sqlite3');

async function run() {
  const strategy = new CliStorageStrategy();
  await CoreBridge.init(
    '/Users/anph/Library/Application Support/TheAndb_v3_dev', 
    '/Volumes/FlexibleWorkplace/side-pr/andb-storage.db', 
    strategy
  );
  
  await CoreBridge.getStorage().saveDDL('DEV', 'preflow_41', 'TABLES', 'TEST_NAME_123', 'CREATE TABLE test()');
  
  const db = new sqlite3('/Volumes/FlexibleWorkplace/side-pr/andb-storage.db');
  const rows = db.prepare("SELECT * FROM ddl_exports WHERE export_name = 'TEST_NAME_123'").all();
  console.log("DB Content length:", rows.length);
  if (rows.length > 0) console.log(rows[0]);
}

run().catch(console.error);
