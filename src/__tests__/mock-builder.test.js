import {expect, it, jest} from '@jest/globals';
import {MockBuilder} from "../mock-builder";
import {MockManager} from "../mock-manager";
import fs from "fs";
import path from "path";

it('builds an openapi mock using builder', async () => {
    const specFile = `${__dirname}/testdata/bare_openapi/pet-name-service.yaml`;

    let prepared = false;
    const mockManager = {
        prepare: () => {
            prepared = true;
        }
    }

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
    expect(prepared).toEqual(true);

    // config file should be written
    const configFilePath = path.join(builder.configDir, 'imposter-config.json');
    expect(fs.existsSync(configFilePath)).toBe(true);

    // validate config
    const configData = await fs.promises.readFile(configFilePath);
    expect(configData.length).toBeGreaterThan(0);

    const configObj = JSON.parse(configData);
    expect(configObj.plugin).toEqual('openapi');
    expect(configObj.specFile).toEqual('pet-name-service.yaml');
});

it('builds an ephemeral mock using builder', async () => {
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

    let prepared = false;
    const mockManager = {
        prepare: () => {
            prepared = true;
        }
    }

    const builder = new MockBuilder(mockManager)
        .withPort(8082)
        .withConfig(config);

    // build should invoke prepare on the manager
    builder.build();
    expect(prepared).toEqual(true);

    // config file should be written
    const configFilePath = path.join(builder.configDir, 'imposter-config.json');
    expect(fs.existsSync(configFilePath)).toBe(true);

    // validate config
    const configData = await fs.promises.readFile(configFilePath);
    expect(configData.length).toBeGreaterThan(0);

    const configObj = JSON.parse(configData);
    expect(configObj.plugin).toEqual('rest');
    expect(configObj.resources).toHaveLength(1);
});
