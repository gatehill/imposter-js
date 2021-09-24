import stock from "./stock";
import {afterAll, beforeAll, expect, it, jest} from '@jest/globals';
import {mocks} from "imposter/src";

/**
 * Tests for stock-service mock
 *
 * Defined using OpenAPI specifications under the `third-party/stock-service` directory.
 * The directory also contains Imposter configuration files, but no dynamic scripts.
 *
 * Important: In your own project, change the import to:
 *   import {mocks} from "@imposter-js/imposter";
 * or:
 *   const {mocks} = require("@imposter-js/imposter");
 */

jest.setTimeout(30000);

let stockService;

beforeAll(async () => {
    const configDir = `${__dirname}/../apis/stock-service`;
    const mock = mocks.start(configDir, 8080);

    // set the base URL
    stockService = stock('http://localhost:8080');
    return mock;
});

afterAll(async () => {
    return mocks.stopAll();
})

it('fetches available stock', async () => {
    const products = await stockService.listStock();
    expect(products).toHaveLength(2);
    expect(products[0].name).toEqual('Food bowl');
});
