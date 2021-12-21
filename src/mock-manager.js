import {MockBuilder} from "./mock-builder";
import {ConfiguredMock} from "./configured-mock";

export class MockManager {
    /**
     * @type {boolean}
     * @private
     */
    _logVerbose = false;

    /**
     * @type {ConfiguredMock[]}
     * @private
     */
    _mocks = [];

    /**
     * @param configDir {string}
     * @param port {number|null}
     * @param env {Record<string, string>}
     * @return {ConfiguredMock}
     */
    prepare = (configDir, port = null, env = {}) => {
        const mock = new ConfiguredMock(configDir, port, env);
        if (this._logVerbose) {
            mock.verbose();
        }
        this._mocks.push(mock);
        return mock;
    }

    /**
     * Start a mock using the Imposter configuration within `configDir`, listening
     * on `port`.
     *
     * This is a convenience function that has limited options. Consider using `MockBuilder` instead:
     *
     * ```
     * const {mocks}
     * ```
     *
     * @param configDir {string}
     * @param port {number|null}
     * @param env {Record<string, string>}
     * @return {Promise<ConfiguredMock>}
     */
    start = (configDir, port = null, env= {}) => {
        return this.prepare(configDir, port, env).start();
    }

    stopAll = () => {
        this._mocks.forEach(mock => mock.stop());
    }

    /**
     * @return {MockBuilder}
     */
    builder = () => {
        return new MockBuilder(this);
    }

    /**
     * @return {MockManager}
     */
    verbose = () => {
        this._logVerbose = true;
        return this;
    }
}
