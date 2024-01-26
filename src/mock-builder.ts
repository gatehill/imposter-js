import fs from "fs";
import path from "path";
import os from "os";
import {nodeConsole} from "./console";
import {ConfiguredMock} from "./configured-mock";
import {MockManager} from "./mock-manager";

type ResponseConfig = {
    statusCode?: number;
    headers?: Record<string, string>;
    staticFile?: string;
    staticData?: string;
    template?: boolean;
    exampleName?: string;
};

type CaptureConfig = {
    pathParam?: string;
    queryParam?: string;
    requestHeader?: string;
    jsonPath?: string;
    store?: string;
};

type ResourceConfig = {
    path?: string;
    method?: string;
    capture?: Record<string, CaptureConfig>;
    response?: ResponseConfig;
};

type PluginConfig = {
    plugin: string;
    specFile?: string;
    resources?: ResourceConfig[];
    validation?: {
        request?: boolean;
        levels?: Record<string, string>;
    }
};

class ResourceResponse {
    response: ResponseConfig;

    constructor(response: ResponseConfig) {
        this.response = response;
    }

    withStatusCode = (statusCode: number): ResourceResponse => {
        this.response.statusCode = statusCode;
        return this;
    }

    withHeader = (headerName: string, headerValue: string): ResourceResponse => {
        this.response.headers = this.response.headers || {};
        this.response.headers[headerName] = headerValue;
        return this;
    }

    withData = (data: string): ResourceResponse => {
        this.response.staticData = data;
        return this;
    }

    /**
     * Only compatible with the 'openapi' plugin.
     */
    withExampleName = (exampleName: string): ResourceResponse => {
        this.response.exampleName = exampleName;
        return this;
    }

    template = (isTemplate: boolean = true): ResourceResponse => {
        this.response.template = isTemplate;
        return this;
    }

    /**
     * Convenience function equivalent to calling `withData(templateData).template()`.
     */
    withTemplateData = (templateData: string): ResourceResponse => {
        return this.withData(templateData).template();
    }

    /**
     * Convenience function equivalent to calling `withFile(templateFilePath).template()`.
     */
    withTemplateFile = (templateFilePath: string): ResourceResponse => {
        return this.withFile(templateFilePath).template();
    }

    withFile = (filePath: string): ResourceResponse => {
        this.response.staticFile = filePath;
        return this;
    }
}

class ResourceCapture {
    capture: Record<string, CaptureConfig>;

    constructor(capture: Record<string, CaptureConfig>) {
        this.capture = capture;
    }

    fromPath = (paramName: string, itemName?: string, storeName?: string) => {
        itemName = itemName || paramName;
        this.capture[itemName] = {
            pathParam: paramName,
            store: storeName,
        }
        return this;
    }

    fromQuery = (paramName: string, itemName?: string, storeName?: string) => {
        itemName = itemName || paramName;
        this.capture[itemName] = {
            queryParam: paramName,
            store: storeName,
        }
        return this;
    }

    fromHeader = (headerName: string, itemName?: string, storeName?: string) => {
        itemName = itemName || headerName;
        this.capture[itemName] = {
            requestHeader: headerName,
            store: storeName,
        }
        return this;
    }

    fromBodyJsonPath = (jsonPath: string, itemName?: string, storeName?: string) => {
        itemName = itemName || 'body';
        this.capture[itemName] = {
            jsonPath: jsonPath,
            store: storeName,
        }
        return this;
    }
}

class MockResource {
    resource: ResourceConfig;

    constructor(resource: ResourceConfig) {
        this.resource = resource;
    }

    withPath = (path: string): MockResource => {
        this.resource.path = path;
        return this;
    }

    withMethod = (method: string): MockResource => {
        this.resource.method = method;
        return this;
    }

    captures = (): ResourceCapture => {
        this.resource.capture = this.resource.capture || {};
        return new ResourceCapture(this.resource.capture);
    }

    responds = (statusCode: number = 200): ResourceResponse => {
        this.resource.response = {};
        return new ResourceResponse(this.resource.response)
            .withStatusCode(statusCode);
    }
}

export class MockBuilder {
    mockManager: MockManager;

    /**
     * Raw Imposter configuration.
     */
    config: Partial<PluginConfig> = {};

    configDir: string;

    port: any;

    env?: Record<string, string>;

    constructor(mockManager: MockManager) {
        this.mockManager = mockManager;
        this.configDir = fs.mkdtempSync(path.join(os.tmpdir(), 'imposter'));
    }

    withPort = (port: number): MockBuilder => {
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
     */
    withEnv = (env: Record<string, string>): MockBuilder => {
        this.env = env;
        return this;
    }

    withPlugin = (plugin: string): MockBuilder => {
        if (this.config.plugin && this.config.plugin !== plugin) {
            throw new Error(`Plugin already set to: ${this.config.plugin}`);
        }
        this.config.plugin = plugin;
        return this;
    }

    withOpenApiSpec = (specFilePath: string): MockBuilder => {
        this.withPlugin('openapi');
        const specFileName = path.basename(specFilePath);
        fs.copyFileSync(specFilePath, path.join(this.configDir, specFileName));
        this.config.specFile = specFileName;
        return this;
    }

    /**
     * Enables request validation against the OpenAPI spec.
     * Only compatible with the 'openapi' plugin.
     */
    withRequestValidation = (): MockBuilder => {
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
     */
    withConfig = (config: PluginConfig): MockBuilder => {
        this.config = config;
        return this;
    }

    addResource = (path: string, method: string = 'GET'): MockResource => {
        this.config.resources = this.config.resources || [];
        const resource = {};
        this.config.resources.push(resource);
        return new MockResource(resource)
            .withPath(path)
            .withMethod(method);
    }

    build = (options: { logVerbose?: boolean; } = {}): ConfiguredMock => {
        const mockConfigPath = path.join(this.configDir, 'imposter-config.json');
        const mockConfig = JSON.stringify(this.config, null, '  ');
        fs.writeFileSync(mockConfigPath, mockConfig);

        const logContext = (options.logVerbose ? `config=${mockConfig}` : '');
        nodeConsole.debug(`Wrote mock config to: ${mockConfigPath}`, logContext);

        return this.mockManager.prepare(this.configDir, this.port, this.env);
    }

    /**
     * Convenience function equivalent to calling `build().start()`.
     */
    start = (): Promise<ConfiguredMock> => {
        return this.build().start();
    }
}
