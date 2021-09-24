import path, {dirname} from "path";
import fs, {constants} from "fs";
import {versionReader} from "./version";

class FileUtils {
    /**
     * @type {boolean}
     * @private
     */
    _initialised = false;

    /**
     * @private
     */
    _pkgJsonDir;

    initIfRequired = async () => {
        await versionReader.initIfRequired();

        if (!this._initialised) {
            for (let path of module.paths) {
                try {
                    let prospectivePkgJsonDir = dirname(path);
                    await fs.promises.access(path, constants.F_OK);
                    this._pkgJsonDir = prospectivePkgJsonDir;
                    break
                } catch (ignored) {
                }
            }
            this._initialised = true;
        }
    }

    /**
     * Searches the current working directory and the module's project directory
     * for a CLI configuration file.
     *
     * @param searchPaths {string[]}
     * @returns {string|undefined|null}
     */
    discoverLocalConfig = (searchPaths = null) => {
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
    getPkgJsonDir = () => {
        if (!this._initialised) {
            throw new Error('initIfRequired() not called');
        }
        return this._pkgJsonDir;
    }
}

const fileUtils = new FileUtils();

export {fileUtils};
