import {expect, it} from '@jest/globals';
import {nodeConsole} from "../console";

it('returns the console', () => {
    expect(nodeConsole).toBeTruthy();
    expect(nodeConsole.info).toBeTruthy();
});
