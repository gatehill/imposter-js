import {afterAll, expect, it, jest} from '@jest/globals';
import {mocks} from "../index";
import axios from "axios";
import {MockManager} from "../mock-manager";

jest.setTimeout(30000);

describe('end to end tests', () => {
    afterAll(async () => {
        return mocks.stopAll();
    });

    it('starts a mock from an Imposter config dir', async () => {
        const configDir = `${__dirname}/test_data/full_config`;
        const mock = await mocks.start(configDir, 8080);

        const response = await axios.get(`${mock.baseUrl()}/products`);
        expect(response.status).toEqual(200);

        const products = response.data;
        expect(products).toHaveLength(2);
        expect(products[0].name).toEqual('Food bowl');
    });

    it('starts a mock from a bare OpenAPI spec', async () => {
        const specFile = `${__dirname}/test_data/bare_openapi/pet-name-service.yaml`;
        const mock = mocks.builder()
            .withPort(8081)
            .withOpenApiSpec(specFile)
            .withRequestValidation()
            .build();

        await mock.start();

        const response = await axios.get(`${mock.baseUrl()}/names`);
        expect(response.status).toEqual(200);

        const names = response.data;
        expect(names).toHaveLength(2);
        expect(names[0]).toEqual('Fluffy');
    });

    it('starts a mock using resource builder', async () => {
        const builder = mocks.builder()
            .withPort(8083)
            .withPlugin('rest');

        const resource = builder.addResource('/users/{userName}', 'POST');

        resource.captures().fromPath('userName');
        resource.responds(201).withTemplateData('Hello ${request.userName}');

        const mock = builder.build();
        await mock.start();

        const response = await axios.post(`${mock.baseUrl()}/users/alice`);
        expect(response.status).toEqual(201);
        expect(response.data).toEqual('Hello alice');
    });

    it('starts a mock on random free port', async () => {
        const builder = mocks.builder().withPlugin('rest');
        builder.addResource('/example').responds().withData('Hello world');
        const mock = await builder.start();

        // port should be auto-assigned
        expect(mock.port).toBeTruthy();

        const response = await axios.get(`${mock.baseUrl()}/example`);
        expect(response.status).toEqual(200);
        expect(response.data).toEqual('Hello world');
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

        const mock = mocks.builder()
            .withPort(8082)
            .withConfig(config)
            .build();

        await mock.start();

        const response = await axios.post(`${mock.baseUrl()}/example`);
        expect(response.status).toEqual(201);
        expect(response.data).toEqual('Hello world');
    });

    it('returns deprecated manager', async () => {
        const legacyManager = require('../index').default();
        expect(legacyManager).toBeInstanceOf(MockManager);
    });
});
