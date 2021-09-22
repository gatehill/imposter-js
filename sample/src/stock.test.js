import stock from "./stock";
import {afterAll, beforeAll, expect, it, jest} from '@jest/globals';

// Important: In your own project, change this to:
// import {mocks} from "@imposter-js/imposter";
// or:
// const {mocks} = require("@imposter-js/imposter");
import {mocks} from "imposter/src";

jest.setTimeout(30000);

let stockService;

beforeAll(async () => {
    const configDir = `${process.cwd()}/third-party/stock-service`;
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
