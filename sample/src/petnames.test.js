import petnames from "./petnames";
import {afterAll, beforeAll, expect, it, jest} from '@jest/globals';
import {mocks} from "imposter/src";

/**
 * Tests for pet-name-service mock
 *
 * A bare directory under `apis/pet-name-service` containing only an OpenAPI file,
 * with the Imposter configuration generated when the mock starts.
 *
 * Important: In your own project, change the import to:
 *   import {mocks} from "@imposter-js/imposter";
 * or:
 *   const {mocks} = require("@imposter-js/imposter");
 */

jest.setTimeout(30000);

let petNameService;

beforeAll(async () => {
    const specPath = `${__dirname}/../apis/pet-name-service/pet-name-service.yaml`;

    // build a mock from a bare OpenAPI spec file
    const mock = mocks.builder()
        .withPort(8082)
        .withOpenApiSpec(specPath)
        .withRequestValidation()
        .build();

    // set the base URL
    petNameService = petnames('http://localhost:8082');
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
