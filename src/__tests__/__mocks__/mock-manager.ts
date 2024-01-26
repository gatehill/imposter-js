import {jest} from "@jest/globals";

export default jest.fn().mockImplementation(() => {
    return {prepare: jest.fn()};
});
