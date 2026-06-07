const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');

const wss = new WebSocketServer({ port: 8765, host: '0.0.0.0' });
console.log('JavaScript executor starting on port 8765...');

wss.on('connection', (ws) => {
    let proc = null;
    let execTimeout = null;

    const cleanup = () => {
        if (execTimeout) { clearTimeout(execTimeout); execTimeout = null; }
        if (proc) { proc.kill(); proc = null; }
    };

    ws.on('message', (rawMsg) => {
        let msg;
        try {
            msg = JSON.parse(rawMsg.toString());
        } catch {
            return;
        }

        if (msg.type === 'execute') {
            cleanup();

            const code = msg.code || '';

            proc = spawn('node', ['-e', code], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            execTimeout = setTimeout(() => {
                if (ws.readyState === 1) {
                    ws.send(JSON.stringify({ type: 'output', data: '\nExecution timed out (30s limit)\n' }));
                }
                cleanup();
            }, 30000);

            proc.stdout.on('data', (chunk) => {
                if (ws.readyState === 1) {
                    ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf8') }));
                }
            });

            proc.stderr.on('data', (chunk) => {
                if (ws.readyState === 1) {
                    ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf8') }));
                }
            });

            proc.on('close', (exitCode) => {
                if (execTimeout) { clearTimeout(execTimeout); execTimeout = null; }
                if (ws.readyState === 1) {
                    ws.send(JSON.stringify({ type: 'done', exit_code: exitCode ?? -1 }));
                }
                proc = null;
            });

            proc.on('error', (err) => {
                if (execTimeout) { clearTimeout(execTimeout); execTimeout = null; }
                if (ws.readyState === 1) {
                    ws.send(JSON.stringify({ type: 'error', data: `Execution error: ${err.message}` }));
                    ws.send(JSON.stringify({ type: 'done', exit_code: -1 }));
                }
                proc = null;
            });
        }

        else if (msg.type === 'input' && proc) {
            try {
                proc.stdin.write((msg.data || '') + '\n');
            } catch (err) {
                console.error('stdin write error:', err.message);
            }
        }

        else if (msg.type === 'stop') {
            cleanup();
        }
    });

    ws.on('close', cleanup);
    ws.on('error', (err) => console.error('WebSocket error:', err.message));
});

console.log('JavaScript executor ready');
