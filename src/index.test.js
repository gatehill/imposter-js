import {afterAll, expect, it, jest} from '@jest/globals';
import imposter from "./index";
import axios from "axios";

const mocks = imposter();

jest.setTimeout(30000);

afterAll(async () => {
    return mocks.stopAll();
});

it('builds a mock from an Imposter config file', async () => {
    const configDir = `${process.cwd()}/test_data/full_config`;
    const mock = await mocks.start(configDir, 8080);

    const response = await axios.get(`${mock.baseUrl()}/products`);
    expect(response.status).toEqual(200);

    const products = response.data;
    expect(products).toHaveLength(2);
    expect(products[0].name).toEqual('Food bowl');
});

it('builds a mock from a bare OpenAPI spec', async () => {
    const specFile = `${process.cwd()}/test_data/bare_openapi/pet-name-service.yaml`;
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
