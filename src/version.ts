import {spawn} from "child_process";

type SemanticVersion = { major: number; minor: number; revision: number; };

class VersionReader {
    private _initialised: boolean = false;
    private _versionOutput?: string;
    private _cliVersion?: {major: number, minor: number, revision: number};

    initIfRequired = async () => {
        if (!this._initialised) {
            this._versionOutput = await this.invokeVersionCommand();
            this._initialised = true;
        }
    }

    invokeVersionCommand = async (): Promise<string> => {
        return new Promise((resolve, reject) => {
            try {
                const options = {
                    env: {
                        ...process.env,
                        "LOG_LEVEL": "INFO"
                    }
                };
                const proc = spawn('imposter', ['version'], options);
                let output = '';

                proc.on('error', err => {
                    reject(new Error(`Error determining version from 'imposter' command. Is Imposter CLI installed?\n${err}`));
                }).on('close', (code) => {
                    if (code === 0) {
                        resolve(output);
                    } else {
                        reject(new Error(`Error determining version. Imposter process terminated with code: ${code}`));
                    }
                });
                proc.stdout.on('data', chunk => {
                    if (chunk) {
                        output += chunk.toString();
                    }
                });
                proc.stderr.on('data', chunk => {
                    if (chunk) {
                        output += chunk.toString();
                    }
                });
            } catch (e) {
                reject(new Error(`Error spawning Imposter process: ${e}`));
            }
        });
    }

    /**
     * Determines the version of the CLI subcomponent.
     */
    determineVersion = (componentName: RegExp): SemanticVersion => {
        if (!this._initialised) {
            throw new Error('initIfRequired() not called');
        }
        try {
            /*
             * Parse CLI output in the form:
             *
             * imposter-cli 0.1.0
             * imposter-engine 0.1.0
             *
             * ...filtering by componentName, into an array of Strings containing the SemVer components:
             * [ "0", "1", "0" ]
             */
            const version = this._versionOutput!!.split('\n')
                .filter(line => line.match(componentName))
                .map(cliVersion => cliVersion.split(' ')[1].trim().split('.'))[0];

            return {
                major: Number(version[0]),
                minor: Number(version[1]),
                revision: Number(version[2]),
            };

        } catch (e) {
            throw new Error(`Error parsing version '${this._versionOutput}': ${e}`);
        }
    }

    /**
     * Determine the version of the CLI.
     */
    determineCliVersion = (): SemanticVersion => {
        if (!this._cliVersion) {
            this._cliVersion = this.determineVersion(/imposter-cli/);
        }
        return this._cliVersion;
    }

    /**
     * Runs the `block` if the CLI version is equal to or greater than the specified version.
     */
    runIfVersionAtLeast = (major: number, minor: number, revision: number, block: () => any, orElseBlock: (() => any) | undefined = undefined): any | undefined => {
        const cliVersion = this.determineCliVersion();
        if (this.versionAtLeast({major, minor, revision}, cliVersion)) {
            return block();
        } else if (orElseBlock) {
            return orElseBlock();
        }
        return undefined;
    }

    /**
     * Determines if the `test` SemVer version is equal to or greater than `required`.
     */
    versionAtLeast = (required: SemanticVersion, test: SemanticVersion): boolean => {
        if (test.major > required.major) {
            return true;
        } else if (test.major === required.major) {
            if (test.minor > required.minor) {
                return true;
            } else if (test.minor === required.minor) {
                return (test.revision >= required.revision);
            }
        }
        return false;
    }
}

const versionReader = new VersionReader();

export {versionReader};
