const { spawn } = require('child_process');
const electron = require('electron');
const p = spawn(electron, ['andb-cli/dist/index.js', 'rpc', '--sqlite-path', '/Volumes/FlexibleWorkplace/side-pr/andb-storage.db'], {
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
});

p.stdout.on('data', d => console.log(d.toString()));
p.stderr.on('data', d => console.error(d.toString()));

p.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'execute',
  params: {
    operation: 'export',
    payload: {
      env: 'DEV',
      db: 'andb',
      type: 'all'
    }
  }
}) + '\n');

setTimeout(() => { p.kill(); process.exit(); }, 5000);
