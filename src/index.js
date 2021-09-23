import {spawn} from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import {fileUtils} from "./fileutils";
import {httpGet} from "./healthcheck";

// Don't use the global console - this gets
// overridden by Jest and makes output chatty.
const nodeConsole = require("console");

class MockBuilder {
    mockManager;
    config = {};
    configDir;

    /**
     * @param mockManager {MockManager}
     */
    constructor(mockManager) {
        this.mockManager = mockManager;
        this.configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'imposter'));
    }

    /**
     * @param port {number}
     * @return {MockBuilder}
     */
    withPort(port) {
        this.port = port;
        return this;
    }

    /**
     * @param plugin {string}
     * @return {MockBuilder}
     */
    withPlugin(plugin) {
        if (this.config.plugin && this.config.plugin !== plugin) {
            throw new Error(`Plugin already set to: ${this.config.plugin}`);
        }
        this.config.plugin = plugin;
        return this;
    }

    /**
     * @param specFilePath {string}
     * @return {MockBuilder}
     */
    withOpenApiSpec(specFilePath) {
        this.withPlugin('openapi');
        const specFileName = path.basename(specFilePath);
        fs.copyFileSync(specFilePath, path.join(this.configDir, specFileName));
        this.config.specFile = specFileName;
        return this;
    }

    /**
     * Enables request validation against the OpenAPI spec.
     *
     * @return {MockBuilder}
     */
    withRequestValidation() {
        this.withPlugin('openapi');
        this.config.validation = {
            request: true,
            levels: {
                "validation.request.security.missing": "WARN",
                "validation.request.security.invalid": "WARN"
            }
        }
        return this;
    }

    /**
     * Sets/overwrites configuration with `config`.
     * @param config
     * @return {MockBuilder}
     */
    withConfig(config) {
        this.config = config;
        return this;
    }

    /**
     * @return {ConfiguredMock}
     */
    build() {
        const mockConfigPath = path.join(this.configDir, 'imposter-config.json');
        fs.writeFileSync(mockConfigPath, JSON.stringify(this.config, null, '  '));
        nodeConsole.debug(`Wrote mock config to: ${mockConfigPath}`);
        return this.mockManager.prepare(this.configDir, this.port);
    }
}

class ConfiguredMock {
    configDir;
    port;
    logVerbose = false;
    logToFile = true;
    logFilePath;
    logFileStream;
    proc;

    constructor(configDir, port) {
        this.configDir = configDir;
        this.port = port;
    }

    /**
     * @return {Promise<ConfiguredMock>}
     */
    async start() {
        if (this.proc) {
            throw new Error(`Mock on port ${this.port} already started`);
        }

        const localConfigFile = await fileUtils.discoverLocalConfig();

        let proc;
        try {
            const args = [
                'up', this.configDir,
                `--port=${this.port}`,
                '--auto-restart=false',
            ];
            if (localConfigFile) {
                if (this.logVerbose) {
                    nodeConsole.debug(`Using project configuration: ${localConfigFile}`);
                }
                args.push(`--config=${localConfigFile}`);
            }
            proc = this.proc = spawn('imposter', args);
        } catch (e) {
            throw new Error(`Error spawning Imposter process: ${e}`)
        }

        this.configureLogging(proc);
        await this.waitUntilReady(proc);
        return this;
    }

    configureLogging(proc) {
        if (this.logToFile) {
            this.logFilePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'imposter')), 'imposter.log');
            this.logFileStream = fs.createWriteStream(this.logFilePath);
            nodeConsole.debug(`Logging to ${this.logFilePath}`);
        }

        proc.stdout.on('data', chunk => {
            writeChunk(chunk, this.logVerbose, this.logToFile, nodeConsole.debug, this.logFileStream);
        });
        proc.stderr.on('data', chunk => {
            writeChunk(chunk, this.logVerbose, this.logToFile, nodeConsole.warn, this.logFileStream);
        });
    }

    async waitUntilReady(proc) {
        nodeConsole.debug(`Waiting for mock server to come up on port ${this.port}`);
        let ready = false;
        while (!ready) {
            if (proc.exitCode) {
                const verbosePrompt = this.logVerbose ? "" : '\nTry setting .verbose() on your mock for more details.';
                throw new Error(`Failed to start mock engine on port ${this.port}. Exit code: ${proc.exitCode}\nSee log file: ${this.logFilePath}${verbosePrompt}`);
            }
            try {
                const response = await httpGet(`http://localhost:${this.port}/system/status`);
                if (response.status === 200) {
                    ready = true;
                }
            } catch (ignored) {
                await sleep(200);
            }
        }
        nodeConsole.debug('Mock server is up!');
    }

    stop() {
        if (!this.proc || !this.proc.pid) {
            nodeConsole.debug(`Mock server on port ${this.port} was not running`);
        } else {
            try {
                nodeConsole.debug(`Stopping mock server with pid ${this.proc.pid}`);
                this.proc.kill();
            } catch (e) {
                nodeConsole.warn(`Error stopping mock server with pid ${this.proc.pid}`, e);
            }
        }

        if (this.logFileStream) {
            this.logFileStream.close();
        }
    }

    /**
     * @return {ConfiguredMock}
     */
    verbose() {
        this.logVerbose = true;
        return this;
    }

    /**
     * @return {string}
     */
    baseUrl() {
        return `http://localhost:${this.port}`;
    }
}

class MockManager {
    logVerbose = false;

    /**
     * @type {ConfiguredMock[]}
     */
    _mocks = [];

    /**
     * @param configDir {string}
     * @param port {number}
     * @return {ConfiguredMock}
     */
    prepare(configDir, port) {
        port = port ? port : 8080;
        const mock = new ConfiguredMock(configDir, port);
        if (this.logVerbose) {
            mock.verbose();
        }
        this._mocks.push(mock);
        return mock;
    }

    /**
     * @param configDir {string}
     * @param port {number}
     * @return {Promise<ConfiguredMock>}
     */
    start(configDir, port) {
        return this.prepare(configDir, port).start();
    }

    stopAll() {
        this._mocks.forEach(mock => mock.stop());
    }

    /**
     * @return {MockBuilder}
     */
    builder() {
        return new MockBuilder(this);
    }

    /**
     * @return {MockManager}
     */
    verbose() {
        this.logVerbose = true;
        return this;
    }
}

function writeChunk(chunk, logVerbose, logToFile, consoleFn, logFileStream) {
    if (!chunk) {
        return;
    }
    if (logVerbose) {
        consoleFn(chunk.toString().trim());
    }
    if (logToFile) {
        try {
            logFileStream.write(chunk);
        } catch (ignored) {
        }
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const defaultMockManager = new MockManager();

export default () => {
    nodeConsole.warn('Using the default export is deprecated - import/require {mocks} from this module instead');
    return defaultMockManager;
};
export {defaultMockManager as mocks};
