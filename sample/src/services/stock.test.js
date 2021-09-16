import stock from "./stock";
import {afterAll, beforeAll, expect, it, jest} from '@jest/globals';
import imposter from "imposter/src";

const mocks = imposter();

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
