import {afterAll, expect, it, jest} from '@jest/globals';
import {mocks} from "../index";
import axios from "axios";
import {MockManager} from "../mock-manager";

jest.setTimeout(30000);

afterAll(async () => {
    return mocks.stopAll();
});

it('builds a mock from an Imposter config dir', async () => {
    const configDir = `${__dirname}/testdata/full_config`;
    const mock = await mocks.start(configDir, 8080);

    const response = await axios.get(`${mock.baseUrl()}/products`);
    expect(response.status).toEqual(200);

    const products = response.data;
    expect(products).toHaveLength(2);
    expect(products[0].name).toEqual('Food bowl');
});

it('builds a mock from a bare OpenAPI spec', async () => {
    const specFile = `${__dirname}/testdata/bare_openapi/pet-name-service.yaml`;
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

it('builds a mock using resource builder', async () => {
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
