const bun = require('./andb-cli/dist/index.js');
for (const key in bun) {
  if (bun[key] && bun[key].name === 'ExporterService') {
     console.log('Found ExporterService! Methods:');
     console.log(Object.getOwnPropertyNames(bun[key].prototype));
  }
  if (bun[key] && bun[key].name === 'StorageService') {
     console.log('Found StorageService! Methods:');
     console.log(Object.getOwnPropertyNames(bun[key].prototype));
  }
}
