const { fork } = require('child_process');
const path = require('path');

const cliPath = path.join(__dirname, 'andb-cli', 'andb.js');

console.log(`Forking ${cliPath} rpc...`);
const child = fork(cliPath, ['rpc', '--user-data-path', path.join(__dirname, 'temp_data')], {
  stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  env: {
    ...process.env,
    ANDB_QUIET: '1',
    ELECTRON_RUN_AS_NODE: '1'
  }
});

child.on('message', (msg) => {
  console.log('[IPC Message received]:', msg);
  if (msg.result === 'pong') {
    console.log('✅ IPC works perfectly! Exiting...');
    child.kill();
    process.exit(0);
  }
});

child.stdout.on('data', (d) => console.log('[STDOUT]', d.toString().trim()));
child.stderr.on('data', (d) => console.error('[STDERR]', d.toString().trim()));

setTimeout(() => {
  console.log('Sending ping over IPC...');
  child.send({ jsonrpc: '2.0', id: 1, method: 'ping' });
}, 2000);

setTimeout(() => {
  console.error('❌ Timeout waiting for pong!');
  child.kill();
  process.exit(1);
}, 5000);
