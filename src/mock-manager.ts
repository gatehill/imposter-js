import {MockBuilder} from "./mock-builder";
import {ConfiguredMock} from "./configured-mock";

export class MockManager {
    private _logVerbose: boolean = false;
    private _mocks: ConfiguredMock[] = [];

    prepare = (configDir: string, port: number | null = null, env: Record<string, string> = {}): ConfiguredMock => {
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
     */
    start = (configDir: string, port: number | null = null, env: Record<string, string> = {}): Promise<ConfiguredMock> => {
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
