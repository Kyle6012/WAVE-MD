const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

// Function to start the server with a specified port
function start(port) {
    let args = [path.join(__dirname, 'plugins.js'), port, ...process.argv.slice(2)];
    console.log(`Spawning process: ${process.argv[0]} ${args.join(' ')}`);

    let p = spawn(process.argv[0], args, {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc']
    });

    p.on('message', data => {
        if (data === 'reset') {
            console.log('Restarting Bot...');
            p.kill();
            start(port); // Restart with the same port
        }
    });

    p.on('exit', code => {
        console.error('Exited with code:', code);
        // Retry if the process exits with an error code or is terminated
        if (code === 0 || code === 1) start(port); // Restart on exit code 0 or 1
    });
}

// Explicitly set port to 3000
const port = 3000;
start(port);

// Create an HTTP server to keep the HTTP port open
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello, world!\n');
});

server.listen(port, () => {
    console.log(`HTTP server running at http://localhost:${port}/`);
});
