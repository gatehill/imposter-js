import path, {dirname} from "path";
import fs, {constants} from "fs";
import {versionReader} from "./version";

const {promises: {access}} = require('fs');

class FileUtils {
    pkgJsonDir;

    /**
     * Searches the current working directory and the module's project directory
     * for a CLI configuration file.
     *
     * @param searchPaths {string[]}
     * @returns {Promise<string|undefined|null>}
     */
    async discoverLocalConfig(searchPaths = null) {
        return await versionReader.runIfVersionAtLeast(0, 6, async () => {
            const sp = searchPaths || [
                await this.getPkgJsonDir(),
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
     * @returns {Promise<string>}
     */
    async getPkgJsonDir() {
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
        return this.pkgJsonDir;
    }
}

const fileUtils = new FileUtils();

export {fileUtils};
