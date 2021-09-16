import {afterAll, beforeAll, expect, it, jest} from '@jest/globals';
import imposter from "./index";
import axios from "axios";

const mocks = imposter();

jest.setTimeout(30000);

let baseUrl;

beforeAll(async () => {
    const configDir = `${process.cwd()}/test_data`;
    const mock = mocks.start(configDir, 8080);

    // set the base URL
    baseUrl = `http://localhost:8080`;
    return mock;
});

afterAll(async () => {
    return mocks.stopAll();
})

it('fetches available stock', async () => {
    const response = await axios.get(`${baseUrl}/products`);
    expect(response.status).toEqual(200);

    const products = response.data;
    expect(products).toHaveLength(2);
    expect(products[0].name).toEqual('Food bowl');
});
