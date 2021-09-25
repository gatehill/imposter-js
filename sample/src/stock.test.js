import {buildService} from "./stock";
import {afterAll, beforeAll, expect, it, jest} from '@jest/globals';
import {mocks} from "imposter/src";

/**
 * Tests for stock-service mock
 *
 * Defined using OpenAPI specifications under the `apis/stock-api` directory.
 * The directory also contains Imposter configuration files, but no dynamic scripts.
 *
 * Important: In your own project, change the import to:
 *   import {mocks} from "@imposter-js/imposter";
 * or:
 *   const {mocks} = require("@imposter-js/imposter");
 */

jest.setTimeout(30000);

describe('stock service', () => {
    let stockService;

    beforeAll(async () => {
        const configDir = `${__dirname}/../apis/stock-api`;
        const mock = await mocks.start(configDir);

        // set the base URL for the service
        stockService = buildService(mock.baseUrl());
    });

    afterAll(async () => {
        return mocks.stopAll();
    });

    it('fetches available stock', async () => {
        const products = await stockService.listStock();
        expect(products).toHaveLength(2);
        expect(products[0].name).toEqual('Food bowl');
    });
});
