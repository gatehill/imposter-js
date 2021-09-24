import path, {dirname} from "path";
import fs, {constants} from "fs";
import {versionReader} from "./version";

const {promises: {access}} = require('fs');

class FileUtils {
    pkgJsonDir;

    async checkInit() {
        await versionReader.checkInit();

        if (!this.pkgJsonDir) {
            for (let path of module.paths) {
                try {
                    let prospectivePkgJsonDir = dirname(path);
                    await access(path, constants.F_OK);
                    this.pkgJsonDir = prospectivePkgJsonDir;
                    break
                } catch (ignored) {
                }
            }
        }
    }

    /**
     * Searches the current working directory and the module's project directory
     * for a CLI configuration file.
     *
     * @param searchPaths {string[]}
     * @returns {string|undefined|null}
     */
    discoverLocalConfig(searchPaths = null) {
        return versionReader.runIfVersionAtLeast(0, 6, 0, () => {
            const sp = searchPaths || [
                this.getPkgJsonDir(),
                process.cwd(),
            ];
            const configs = sp
                .map(searchPath => path.join(searchPath, 'imposter.config.json'))
                .filter(fs.existsSync);

            return configs.length > 0 ? configs[0] : null;
        });
    }

    /**
     * Determine the path to the module's project directory.
     *
     * @returns {string}
     */
    getPkgJsonDir() {
        if (!this.pkgJsonDir) {
            throw new Error('checkInit() not called');
        }
        return this.pkgJsonDir;
    }
}

const fileUtils = new FileUtils();

export {fileUtils};
