import fs from "fs";
import path from "path";
import os from "os";
import {nodeConsole} from "./console";

export class MockBuilder {
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
    withPort = (port) => {
        this.port = port;
        return this;
    }

    /**
     * @param plugin {string}
     * @return {MockBuilder}
     */
    withPlugin = (plugin) => {
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
    withOpenApiSpec = (specFilePath) => {
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
    withRequestValidation = () => {
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
    withConfig = (config) => {
        this.config = config;
        return this;
    }

    /**
     * @return {ConfiguredMock}
     */
    build = () => {
        const mockConfigPath = path.join(this.configDir, 'imposter-config.json');
        fs.writeFileSync(mockConfigPath, JSON.stringify(this.config, null, '  '));
        nodeConsole.debug(`Wrote mock config to: ${mockConfigPath}`);
        return this.mockManager.prepare(this.configDir, this.port);
    }
}
