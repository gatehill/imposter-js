import {spawn} from "child_process";

class VersionReader {
    /**
     * @private {string}
     */
    _versionOutput;

    /**
     * @private {{major: number, minor: number, revision: number}}
     */
    _cliVersion;

    async checkInit() {
        if (!this._versionOutput) {
            this._versionOutput = await this.invokeVersionCommand();
        }
    }

    invokeVersionCommand() {
        return new Promise((resolve, reject) => {
            try {
                const proc = spawn('imposter', ['version']);
                let output = '';

                proc.on('error', err => {
                    reject(new Error(`Error determining version from 'imposter' command. Is Imposter CLI installed?\n${err}`));
                }).on('exit', (code) => {
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
        })
    }

    /**
     * Determines the version of the CLI subcomponent.
     *
     * @param componentName {RegExp}
     * @returns {{major: number, minor: number, revision: number}}
     */
    determineVersion(componentName) {
        if (!this._versionOutput) {
            throw new Error('checkInit() not called');
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
            const version = this._versionOutput.split('\n')
                .filter(line => line.match(componentName))
                .map(cliVersion => cliVersion.split(' ')[1].trim().split('.'))[0];

            return {
                major: Number(version[0]),
                minor: Number(version[1]),
                revision: Number(version[2]),
            };

        } catch (e) {
            throw new Error(`Error parsing version: ${e}`);
        }
    }

    /**
     * Determine the version of the CLI.
     *
     * @returns {{major: number, minor: number, revision: number}}
     */
    determineCliVersion() {
        if (!this._cliVersion) {
            this._cliVersion = this.determineVersion(/imposter-cli/);
        }
        return this._cliVersion;
    }

    /**
     * Runs the `block` if the CLI version is equal to or greater than the specified version.
     *
     * @param major {number}
     * @param minor {number}
     * @param revision {number}
     * @param block {function}
     * @param orElseBlock {function}
     * @returns {*|undefined}
     */
    runIfVersionAtLeast(major, minor, revision, block, orElseBlock = undefined) {
        const cliVersion = this.determineCliVersion();
        if (cliVersion.major >= major && cliVersion.minor >= minor && cliVersion.revision >= revision) {
            return block();
        } else if (orElseBlock) {
            return orElseBlock();
        }
        return undefined;
    }
}

const versionReader = new VersionReader();

export {versionReader};
