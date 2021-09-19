import petNames from "./petNames";
import {afterAll, beforeAll, expect, it, jest} from '@jest/globals';
import imposter from "imposter/src";

const mocks = imposter();

jest.setTimeout(30000);

let petNameService;

beforeAll(async () => {
    const specPath = `${process.cwd()}/third-party/pet-name-service/pet-name-service.yaml`;

    // build a mock from a bare OpenAPI spec file
    const mock = mocks.builder()
        .withPort(8082)
        .withOpenApiSpec(specPath)
        .withRequestValidation()
        .build();

    // set the base URL
    petNameService = petNames('http://localhost:8082');
    return mock.start();
});

afterAll(async () => {
    return mocks.stopAll();
})

it('generates pet names', async () => {
    const names = await petNameService.suggestNames();
    expect(names).toHaveLength(2);
    expect(names[0]).toEqual('Fluffy');
});
