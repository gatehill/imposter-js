import stock from "./stock";
import {afterAll, beforeAll, expect, it, jest} from '@jest/globals';
import imposter from "../imposter";

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
    const supplies = await stockService.listStock();
    expect(supplies).toHaveLength(2);
    expect(supplies[0].name).toEqual('Food bowl');
});
