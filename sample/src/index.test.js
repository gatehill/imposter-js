import App from "./index";
import {afterAll, beforeAll, expect, it, jest} from '@jest/globals';
import {mocks} from "imposter/src";

/**
 * Tests for the application
 *
 * A simple application is that chains calls for some of the services.
 *
 * Important: In your own project, change the import to:
 *   import {mocks} from "@imposter-js/imposter";
 * or:
 *   const {mocks} = require("@imposter-js/imposter");
 */

const apisToMock = {
    stockService: {dir: 'stock-service', port: 9080},
    orderService: {dir: 'order-service', port: 9081},
};

jest.setTimeout(30000);

let app;

beforeAll(async () => {
    // spin up a mock for all third parties
    const mockInstances = [];
    for (const t in apisToMock) {
        const service = apisToMock[t];
        const configDir = `${__dirname}/../apis/${service.dir}`;
        mockInstances.push(
            mocks.start(configDir, service.port)
        );
    }

    // configure app with endpoints
    app = App({
        stockBaseUrl: `http://localhost:${apisToMock.stockService.port}`,
        ordersBaseUrl: `http://localhost:${apisToMock.orderService.port}`,
    })

    return Promise.all(mockInstances);
});

afterAll(async () => {
    return mocks.stopAll();
})

it('order item in stock', async () => {
    const confirmation = await app.orderItemInStock();
    expect(confirmation.total).toEqual(13.00);
});
