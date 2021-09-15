const {spawn} = require("child_process");
const axios = require("axios");

class MockEngine {
    runningProcesses = [];
    logVerbose = false;

    start = async (configDir, port) => {
        port = port ? port : 8080;

        const mock = spawn('imposter', [
            'up', configDir,
            '-p', port,
        ]);
        this.runningProcesses.push(mock);

        if (this.logVerbose) {
            mock.stdout.on('data', chunk => console.debug(chunk.toString()));
            mock.stderr.on('data', chunk => console.warn(chunk.toString()));
        }

        console.debug(`Waiting for mock server to come up on port ${port}`);
        let ready = false;
        while (!ready) {
            if (mock.exitCode) {
                const verbosePrompt = this.logVerbose ? "" : "\nTry starting with .verbose() to see details.";
                throw new Error(`Failed to start mock engine on port ${port}. Exit code: ${mock.exitCode}${verbosePrompt}`);
            }
            try {
                const response = await axios.get(`http://localhost:${port}/system/status`);
                if (response.status === 200) {
                    ready = true;
                }
            } catch (ignored) {
                await sleep(100);
            }
        }
        console.debug('Mock server is up!')
    };

    stopAll() {
        this.runningProcesses.forEach(proc => {
            try {
                console.debug(`Stopping mock server with pid ${proc.pid}`);
                proc.kill();
            } catch (e) {
                console.warn(`Error stopping mock server with pid ${proc.pid}`, e);
            }
        });
    }

    verbose() {
        this.logVerbose = true;
        return this;
    }
}

module.exports = () => {
    return new MockEngine();
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}