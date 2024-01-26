import {versionReader} from "./version";
import {fileUtils} from "./fileutils";
import {nodeConsole} from "./console";
import {ChildProcess, ChildProcessWithoutNullStreams, spawn} from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import net from "net";
import {httpGet} from "./healthcheck";

export class ConfiguredMock {
    configDir: string;
    port: number | null;
    env: Record<string, string>;
    logVerbose = false;
    logToFile = true;
    logFileStream?: fs.WriteStream;
    proc?: ChildProcess;
    logFilePath?: string;

    private utils: Utils;

    constructor(configDir: string, port: number | null = null, env: Record<string, string> = {}) {
        this.configDir = configDir;
        this.port = port;
        this.env = env;
        this.utils = new Utils();
    }

    start = async (): Promise<ConfiguredMock> => {
        if (this.proc) {
            throw new Error(`Mock on port ${this.port} already started`);
        }
        try {
            await fileUtils.initIfRequired();
        } catch (e) {
            throw new Error(`Error during initialisation: ${e}`);
        }
        if (!this.port) {
            this.port = await this.utils.assignFreePort();
            if (this.logVerbose) {
                nodeConsole.debug(`Assigned free port ${this.port}`);
            }
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
                this.validateEnv(this.env);
                const options = {
                    env: {
                        ...process.env,
                        ...this.env,
                    },
                }
                if (this.logVerbose) {
                    nodeConsole.debug(`Arguments: ${JSON.stringify(args)}`);
                    nodeConsole.debug(`Environment: ${JSON.stringify(options.env)}`);
                }
                const proc = spawn('imposter', args, options);
                await this.listenForEvents(proc, reject);

                await this.waitUntilReady(proc);
                resolve(proc);

            } catch (e) {
                reject(new Error(`Error spawning Imposter process. Is Imposter CLI installed?\n${e}`));
            }
        });

        return this;
    }

    validateEnv(env: Record<string, string>) {
        for (const key in env) {
            if (!key.match(/IMPOSTER_.+/) && key !== "JAVA_TOOL_OPTIONS") {
                nodeConsole.warn(`Environment variable ${key} does not match IMPOSTER_* or JAVA_TOOL_OPTIONS - this may be ignored by the mock engine`);
            }
        }
    }

    listenForEvents = async (proc: ChildProcessWithoutNullStreams, reject: (reason: any) => void) => {
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

    waitUntilReady = async (proc: ChildProcess) => {
        nodeConsole.debug(`Waiting for mock server to come up on port ${this.port}`);
        while (true) {
            if (proc.exitCode) {
                const advice = this.utils.buildDebugAdvice(this.logToFile, this.logVerbose, this.logFilePath);
                throw new Error(`Failed to start mock engine on port ${this.port}. Exit code: ${proc.exitCode}${advice}`);
            }
            try {
                const response = await httpGet(`http://localhost:${this.port}/system/status`);
                if (response.status === 200) {
                    nodeConsole.debug('Mock server is up!');
                    break
                }
            } catch (ignored) {
            }
            await this.utils.sleep(200);
        }
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
            try {
                this.logFileStream.close();
            } catch (ignored) {
            }
        }
    }

    verbose = (): ConfiguredMock => {
        this.logVerbose = true;
        return this;
    }

    baseUrl = (): string => {
        if (!this.port) {
            throw new Error('Cannot get base URL before starting mock unless port explicitly set');
        }
        return `http://localhost:${this.port}`;
    }
}

interface LogFileWriter {
    write(chunk: string): void;
}

export class Utils {
    buildDebugAdvice = (logToFile: boolean, logVerbose: boolean, logFilePath?: string) => {
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

    writeChunk = (chunk: any, logVerbose: boolean, logToFile: boolean, consoleFn: (msg: string) => void, logFileWriter?: LogFileWriter) => {
        if (!chunk) {
            return;
        }
        if (logVerbose) {
            consoleFn(chunk.toString().trim());
        }
        if (logToFile) {
            try {
                if (!logFileWriter) {
                    throw new Error('Log file stream not set');
                }
                logFileWriter.write(chunk);
            } catch (ignored) {
            }
        }
    }

    /**
     * Promisified sleep.
     */
    sleep = (ms: number): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    /**
     * Find a free port on which to listen.
     */
    assignFreePort = async (): Promise<number> => {
        return new Promise((resolve, reject) => {
            try {
                const srv = net.createServer();
                srv.listen(0, () => {
                    const port = (srv.address() as net.AddressInfo).port;
                    srv.close(() => {
                        resolve(port);
                    });
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}
