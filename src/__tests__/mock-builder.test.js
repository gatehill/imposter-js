import {expect, it} from '@jest/globals';
import {MockBuilder} from "../mock-builder";
import MockManager from "./__mocks__/mock-manager";
import fs from "fs";
import path from "path";

describe('mock builder', () => {
    it('builds an openapi mock', async () => {
        const specFile = `${__dirname}/test_data/bare_openapi/pet-name-service.yaml`;

        // manual mock
        const mockManager = new MockManager();

        const builder = new MockBuilder(mockManager)
            .withPort(8081)
            .withOpenApiSpec(specFile)
            .withRequestValidation();

        expect(builder.config.plugin).toEqual('openapi');
        expect(builder.config.specFile).toEqual('pet-name-service.yaml');
        expect(builder.config.validation).toBeTruthy();
        expect(builder.config.validation.request).toBe(true);
        expect(builder.config.validation.levels).toBeTruthy();

        // build should invoke prepare on the manager
        builder.build();
        expect(mockManager.prepare).toHaveBeenCalled();

        const configObj = await readConfigFile(builder);
        expect(configObj.plugin).toEqual('openapi');
        expect(configObj.specFile).toEqual('pet-name-service.yaml');
    });

    it('builds a mock from raw config', async () => {
        const config = {
            plugin: 'rest',
            resources: [
                {
                    path: "/example",
                    method: 'POST',
                    response: {
                        statusCode: 201,
                        staticData: 'Hello world'
                    }
                }
            ]
        };

        // manual mock
        const mockManager = new MockManager();

        const builder = new MockBuilder(mockManager)
            .withPort(8082)
            .withConfig(config);

        // build should invoke prepare on the manager
        builder.build();
        expect(mockManager.prepare).toHaveBeenCalled();

        const configObj = await readConfigFile(builder);
        expect(configObj.plugin).toEqual('rest');
        expect(configObj.resources).toHaveLength(1);
    });
});

const readConfigFile = async function (builder) {
    // config file should be written
    const configFilePath = path.join(builder.configDir, 'imposter-config.json');
    expect(fs.existsSync(configFilePath)).toBe(true);

    // validate config
    const configData = await fs.promises.readFile(configFilePath);
    expect(configData.length).toBeGreaterThan(0);

    return JSON.parse(configData.toString());
};
