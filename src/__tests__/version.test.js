import {beforeAll, expect, it} from '@jest/globals';
import {versionReader} from "../version";

describe('version reader', () => {
    beforeAll(() => {
        return versionReader.initIfRequired();
    });

    it('can determine the CLI version', () => {
        const version = versionReader.determineCliVersion();
        console.debug(`CLI version: ${JSON.stringify(version)}`);
        expect(version.major).toEqual(0);
    });

    it('runs version specific logic', () => {
        const execIf0_6 = versionReader.runIfVersionAtLeast(0, 6, 0, () => {
            return true;
        }, () => {
            return false;
        });
        const execIf99_0 = versionReader.runIfVersionAtLeast(99, 0, 0, () => {
            return true;
        }, () => {
            return false;
        });
        expect(execIf0_6).toEqual(true);
        expect(execIf99_0).toEqual(false);
    });
});
