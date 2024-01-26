import {describe, expect, it} from '@jest/globals';
import {nodeConsole} from "../console";

describe('console', () => {
    it('returns the console', () => {
        expect(nodeConsole).toBeTruthy();
        expect(nodeConsole.info).toBeTruthy();
    });
});
