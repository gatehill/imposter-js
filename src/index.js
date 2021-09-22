import {exec, spawn} from "child_process";
import axios from "axios";
import fs from "fs";
import os from "os";
import path, {dirname} from "path";

const {constants, promises: {access}} = require('fs');

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
    start = async () => {
        if (this.proc) {
            throw new Error(`Mock on port ${this.port} already started`);
        }

        const localConfigFile = await findLocalConfig();

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
                const response = await axios.get(`http://localhost:${this.port}/system/status`);
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

/**
 * Determines the version of the CLI subcomponent.
 *
 * @param componentName {string}
 * @returns {Promise<object>}
 */
function determineVersion(componentName) {
    return new Promise((resolve, reject) => {
        try {
            exec('imposter version', (error, stdout, stderr) => {
                const output = `${stdout}\n${stderr}`;
                if (error) {
                    reject(new Error(`Error determining version: ${error}\n${output}`));
                    return;
                }
                try {
                    /*
                     * Parse CLI output in the form:
                     *
                     * imposter-cli 0.1.0
                     * imposter-engine 0.1.0
                     *
                     * ...into an array of Strings containing the SemVer components:
                     * [ "0", "1", "0" ]
                     */
                    const version = output.split('\n')
                        .filter(line => line.match(componentName))
                        .map(cliVersion => cliVersion.split(' ')[1].trim().split('.'))[0];

                    resolve({
                        major: Number(version[0]),
                        minor: Number(version[1]),
                        revision: Number(version[2]),
                    });

                } catch (e) {
                    reject(new Error(`Error parsing version: ${e}`));
                }
            });
        } catch (e) {
            reject(new Error(`Error spawning Imposter process: ${e}`));
        }
    });
}

/**
 * Determine the version of the CLI.
 *
 * @returns {Promise<object>}
 */
function determineCliVersion() {
    return determineVersion(/imposter-cli/);
}

/**
 * Runs the `block` if the CLI version is equal to or greater than the specified version.
 *
 * @param major {number}
 * @param minor {number}
 * @param block {function}
 * @returns {Promise<*|undefined>}
 */
async function runIfVersionAtLeast(major, minor, block) {
    const cliVersion = await determineCliVersion();
    if (cliVersion.major >= major && cliVersion.minor >= minor) {
        return await block();
    }
    return undefined;
}

/**
 * Searches the current working directory and the module's project directory
 * for a CLI configuration file.
 *
 * @returns {Promise<string|undefined|null>}
 */
async function findLocalConfig() {
    return await runIfVersionAtLeast(0, 6, async () => {
        const searchPaths = [
            await getPkgJsonDir(),
            process.cwd(),
        ];
        const configs = searchPaths
            .map(searchPath => path.join(searchPath, 'imposter.config.json'))
            .filter(fs.existsSync);

        return configs.length > 0 ? configs[0] : null;
    });
}

/**
 * Determine the path to the module's project directory.
 *
 * @returns {Promise<string>}
 */
async function getPkgJsonDir() {
    for (let path of module.paths) {
        try {
            let prospectivePkgJsonDir = dirname(path);
            await access(path, constants.F_OK);
            return prospectivePkgJsonDir;
        } catch (ignored) {
        }
    }
}

const defaultMockManager = new MockManager();

export default () => defaultMockManager;

export {defaultMockManager as mocks, determineCliVersion};
