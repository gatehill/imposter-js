import fs from "fs";
import path from "path";
import os from "os";
import {nodeConsole} from "./console";

class ResourceResponse {
    response;

    constructor(response) {
        this.response = response;
    }

    /**
     * @param statusCode {number}
     * @return {ResourceResponse}
     */
    withStatusCode = (statusCode) => {
        this.response.statusCode = statusCode;
        return this;
    }

    /**
     * @param headerName {string}
     * @param headerValue {string}
     * @return {ResourceResponse}
     */
    withHeader = (headerName, headerValue) => {
        this.response.headers = this.response.headers || {};
        this.response.headers[headerName] = headerValue;
        return this;
    }

    /**
     * @param data {string}
     * @return {ResourceResponse}
     */
    withData = (data) => {
        this.response.staticData = data;
        return this;
    }

    /**
     * Only compatible with the 'openapi' plugin.
     * @param exampleName {string}
     * @return {ResourceResponse}
     */
    withExampleName = (exampleName) => {
        this.response.exampleName = exampleName;
        return this;
    }

    /**
     * @param isTemplate {boolean}
     * @return {ResourceResponse}
     */
    template = (isTemplate = true) => {
        this.response.template = isTemplate;
        return this;
    }

    /**
     * Convenience function equivalent to calling `withData(templateData).template()`.
     * @param templateData
     * @return {ResourceResponse}
     */
    withTemplateData = (templateData) => {
        return this.withData(templateData).template();
    }

    /**
     * Convenience function equivalent to calling `withFile(templateFilePath).template()`.
     * @param templateFilePath
     * @return {ResourceResponse}
     */
    withTemplateFile = (templateFilePath) => {
        return this.withFile(templateFilePath).template();
    }

    /**
     * @param filePath {string}
     * @return {ResourceResponse}
     */
    withFile = (filePath) => {
        this.response.staticFile = filePath;
        return this;
    }
}

class ResourceCapture {
    capture;

    constructor(capture) {
        this.capture = capture;
    }

    fromPath = (paramName, itemName = null, storeName = null) => {
        itemName = itemName || paramName;
        this.capture[itemName] = {
            pathParam: paramName,
            store: storeName,
        }
        return this;
    }

    fromQuery = (paramName, itemName = null, storeName = null) => {
        itemName = itemName || paramName;
        this.capture[itemName] = {
            queryParam: paramName,
            store: storeName,
        }
        return this;
    }

    fromHeader = (headerName, itemName = null, storeName = null) => {
        itemName = itemName || headerName;
        this.capture[itemName] = {
            requestHeader: headerName,
            store: storeName,
        }
        return this;
    }

    fromBodyJsonPath = (jsonPath, itemName = null, storeName = null) => {
        itemName = itemName || 'body';
        this.capture[itemName] = {
            jsonPath: jsonPath,
            store: storeName,
        }
        return this;
    }
}

class MockResource {
    resource;

    constructor(resource) {
        this.resource = resource;
    }

    /**
     * @param path {string}
     * @return {MockResource}
     */
    withPath = (path) => {
        this.resource.path = path;
        return this;
    }

    /**
     * @param method {string}
     * @return {MockResource}
     */
    withMethod = (method) => {
        this.resource.method = method;
        return this;
    }

    /**
     * @return {ResourceCapture}
     */
    captures = () => {
        this.resource.capture = this.resource.capture || {};
        return new ResourceCapture(this.resource.capture);
    }

    /**
     * @param statusCode {number}
     * @return {ResourceResponse}
     */
    responds = (statusCode = 200) => {
        this.resource.response = {};
        return new ResourceResponse(this.resource.response)
            .withStatusCode(statusCode);
    }
}

export class MockBuilder {
    /**
     * @type {MockManager}
     */
    mockManager;

    /**
     * Raw Imposter configuration.
     */
    config = {};

    /**
     * @type {string}
     */
    configDir;

    /**
     * @type {number}
     */
    port;

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
     * Set environment variables passed to the mock engine.
     *
     * **Note** only those matching the following names are passed:
     * - IMPOSTER_*
     * - JAVA_TOOL_OPTIONS
     *
     * For example:
     * ```
     * withEnv({
     *     "IMPOSTER_LOG_SUMMARY": "true",
     *     "IMPOSTER_SOME_VAR": "123",
     * })
     * ```
     *
     * @param env {Record<string, string>}
     * @return {MockBuilder}
     */
    withEnv = (env) => {
        this.env = env;
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
     * Only compatible with the 'openapi' plugin.
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
     * @param path {string}
     * @param method {string}
     * @return {MockResource}
     */
    addResource = (path, method = 'GET') => {
        this.config.resources = this.config.resources || [];
        const resource = {};
        this.config.resources.push(resource);
        return new MockResource(resource)
            .withPath(path)
            .withMethod(method);
    }

    /**
     * @return {ConfiguredMock}
     * @param options {{logVerbose:boolean}}
     */
    build = (options = {}) => {
        const mockConfigPath = path.join(this.configDir, 'imposter-config.json');
        const mockConfig = JSON.stringify(this.config, null, '  ');
        fs.writeFileSync(mockConfigPath, mockConfig);

        const logContext = (options.logVerbose ? `config=${mockConfig}` : '');
        nodeConsole.debug(`Wrote mock config to: ${mockConfigPath}`, logContext);

        return this.mockManager.prepare(this.configDir, this.port, this.env);
    }

    /**
     * Convenience function equivalent to calling `build().start()`.
     * @return {Promise<ConfiguredMock>}
     */
    start = () => {
        return this.build().start();
    }
}
