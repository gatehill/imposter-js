import users from "./users";
import {afterAll, beforeAll, expect, it, jest} from '@jest/globals';
import {mocks} from "imposter/src";

/**
 * Tests for user-service mock
 *
 * A mock defined entirely within the test - no OpenAPI specification,
 * no Imposter configuration - all configured within the Jest test.
 *
 * Important: In your own project, change the import to:
 *   import {mocks} from "@imposter-js/imposter";
 * or:
 *   const {mocks} = require("@imposter-js/imposter");
 */

jest.setTimeout(30000);

let userService;

beforeAll(async () => {
    const builder = mocks.builder().withPort(8083).withPlugin('rest');

    // add a POST resource with a path parameter
    const resource = builder.addResource('/users/{userName}', 'POST');

    // capture the userName path parameter from the request
    // for later use in the response
    resource.captures().fromPath('userName');

    // respond with a templated message indicating the user
    // was created by name
    resource.responds(201)
        .withTemplateData('${request.userName} registered')
        .withHeader('Content-Type', 'text/plain');

    const mock = builder.build();

    // set the base URL
    userService = users(mock.baseUrl());

    return mock.start();
});

afterAll(async () => {
    return mocks.stopAll();
})

it('adds a user', async () => {
    const response = await userService.addUser('alice');
    expect(response).toEqual('alice registered');
});
