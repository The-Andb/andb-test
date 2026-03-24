const bundle = require('./andb-cli/dist/index.js');
let foundExporter = false;
let foundStorage = false;

for (const key in bundle) {
  const item = bundle[key];
  if (item && item.name === 'ExporterService') {
    foundExporter = true;
    console.log('ExporterService prototype:', Object.getOwnPropertyNames(item.prototype));
  }
  if (item && item.name === 'StorageService') {
    foundStorage = true;
    console.log('StorageService prototype:', Object.getOwnPropertyNames(item.prototype));
  }
}

if (!foundExporter) console.log('ExporterService not found in exports');
if (!foundStorage) console.log('StorageService not found in exports');
