import users from "./users";
import {afterAll, beforeAll, expect, it, jest} from '@jest/globals';

// Important: In your own project, change this to:
// import {mocks} from "@imposter-js/imposter";
// or:
// const {mocks} = require("@imposter-js/imposter");
import {mocks} from "imposter/src";

jest.setTimeout(30000);

let userService;

beforeAll(async () => {
    const config = {
        plugin: 'rest',
        resources: [
            {
                path: "/users/{userName}",
                method: 'POST',
                capture: {
                    userName: {
                        pathParam: "userName"
                    }
                },
                response: {
                    statusCode: 201,
                    staticData: '{ "user": "${request.userName}", "status": "active" }',
                    template: true,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            }
        ]
    };

    const mock = mocks.builder()
        .withPort(8083)
        .withConfig(config)
        .build();

    // set the base URL
    userService = users('http://localhost:8083');
    return mock.start();
});

afterAll(async () => {
    return mocks.stopAll();
})

it('adds a user', async () => {
    const user = await userService.addUser('alice');
    expect(user.user).toEqual('alice');
    expect(user.status).toEqual('active');
});
