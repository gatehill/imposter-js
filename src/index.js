const {spawn} = require("child_process");
const axios = require("axios");
const fs = require("fs");
const os = require("os");
const path = require("path");

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
        console.debug(`Wrote mock config to: ${mockConfigPath}`);
        return this.mockManager.prepare(this.configDir, this.port);
    }
}

class ConfiguredMock {
    configDir;
    port;
    logVerbose = false;
    proc;

    constructor(configDir, port) {
        this.configDir = configDir;
        this.port = port;
    }

    /**
     * @return {Promise<ConfiguredMock>}
     */
    start = async () => {
        if (this.proc) {
            throw new Error(`Mock on port ${this.port} already started`);
        }
        try {
            this.proc = spawn('imposter', [
                'up', this.configDir,
                '-p', this.port,
            ]);
        } catch (e) {
            throw new Error(`Error spawning Imposter process: ${e}`)
        }

        if (this.logVerbose) {
            this.proc.stdout.on('data', chunk => console.debug(chunk.toString()));
            this.proc.stderr.on('data', chunk => console.warn(chunk.toString()));
        }

        console.debug(`Waiting for mock server to come up on port ${this.port}`);
        let ready = false;
        while (!ready) {
            if (this.proc.exitCode) {
                const verbosePrompt = this.logVerbose ? "" : "\nTry starting with .verbose() to see details.";
                throw new Error(`Failed to start mock engine on port ${this.port}. Exit code: ${this.proc.exitCode}${verbosePrompt}`);
            }
            try {
                const response = await axios.get(`http://localhost:${this.port}/system/status`);
                if (response.status === 200) {
                    ready = true;
                }
            } catch (ignored) {
                await sleep(100);
            }
        }
        console.debug('Mock server is up!')
        return this;
    }

    stop() {
        if (!this.proc || !this.proc.pid) {
            console.debug(`Mock server on port ${this.port} was not running`);
            return;
        }
        try {
            console.debug(`Stopping mock server with pid ${this.proc.pid}`);
            this.proc.kill();
        } catch (e) {
            console.warn(`Error stopping mock server with pid ${this.proc.pid}`, e);
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

module.exports = () => {
    return new MockManager();
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
