import {versionReader} from "./version";
import {fileUtils} from "./fileutils";
import {nodeConsole} from "./console";
import {spawn} from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import {httpGet} from "./healthcheck";

export class ConfiguredMock {
    /**
     * @type {string}
     */
    configDir;

    /**
     * @type {number}
     */
    port;

    logVerbose = false;
    logToFile = true;
    logFileStream;
    proc;

    /**
     * @type {string}
     */
    logFilePath;

    /**
     * @type {Utils}
     */
    utils;

    constructor(configDir, port) {
        this.configDir = configDir;
        this.port = port;
        this.utils = new Utils();
    }

    /**
     * @return {Promise<ConfiguredMock>}
     */
    start = async () => {
        if (this.proc) {
            throw new Error(`Mock on port ${this.port} already started`);
        }
        try {
            await fileUtils.initIfRequired();
        } catch (e) {
            throw new Error(`Error during initialisation: ${e}`);
        }

        const localConfigFile = fileUtils.discoverLocalConfig();

        this.proc = await new Promise(async (resolve, reject) => {
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
                const proc = spawn('imposter', args);
                await this.listenForEvents(proc, reject);

                await this.waitUntilReady(proc);
                resolve(proc);

            } catch (e) {
                reject(new Error(`Error spawning Imposter process. Is Imposter CLI installed?\n${e}`));
            }
        });

        return this;
    }

    listenForEvents = async (proc, reject) => {
        proc.on('error', err => {
            reject(new Error(`Error running 'imposter' command. Is Imposter CLI installed?\n${err}`));

        }).on('close', (code) => {
            if (code !== 0) {
                const advice = this.utils.buildDebugAdvice(this.logToFile, this.logVerbose, this.logFilePath);
                reject(new Error(`Imposter process terminated with code: ${code}.${advice}`));
            } else {
                if (this.logVerbose) {
                    nodeConsole.debug('Imposter process terminated');
                }
            }
        });
        if (this.logToFile) {
            this.logFilePath = path.join(await fs.promises.mkdtemp(path.join(os.tmpdir(), 'imposter')), 'imposter.log');
            this.logFileStream = fs.createWriteStream(this.logFilePath);
            nodeConsole.debug(`Logging to ${this.logFilePath}`);
        }
        proc.stdout.on('data', chunk => {
            this.utils.writeChunk(chunk, this.logVerbose, this.logToFile, nodeConsole.debug, this.logFileStream);
        });
        proc.stderr.on('data', chunk => {
            this.utils.writeChunk(chunk, this.logVerbose, this.logToFile, nodeConsole.warn, this.logFileStream);
        });
    }

    waitUntilReady = async (proc) => {
        nodeConsole.debug(`Waiting for mock server to come up on port ${this.port}`);
        let ready = false;
        while (!ready) {
            if (proc.exitCode) {
                const advice = this.utils.buildDebugAdvice(this.logToFile, this.logVerbose, this.logFilePath);
                throw new Error(`Failed to start mock engine on port ${this.port}. Exit code: ${proc.exitCode}${advice}`);
            }
            try {
                const response = await httpGet(`http://localhost:${this.port}/system/status`);
                if (response.status === 200) {
                    ready = true;
                }
            } catch (ignored) {
                await this.utils.sleep(200);
            }
        }
        nodeConsole.debug('Mock server is up!');
    }

    stop = () => {
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
    verbose = () => {
        this.logVerbose = true;
        return this;
    }

    /**
     * @return {string}
     */
    baseUrl = () => {
        return `http://localhost:${this.port}`;
    }
}

export class Utils {
    buildDebugAdvice = (logToFile, logVerbose, logFilePath) => {
        let advice = '';
        if (logToFile) {
            advice += `\nSee log file: ${logFilePath}`;
        }
        if (!logVerbose) {
            advice += '\nConsider setting .verbose() on your mock for more details.';
        }
        versionReader.runIfVersionAtLeast(0, 6, 2, () => {
            advice += `\nRun 'imposter doctor' to diagnose engine issues.`
        });
        return advice;
    }

    writeChunk = (chunk, logVerbose, logToFile, consoleFn, logFileStream) => {
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

    sleep = (ms) => {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
