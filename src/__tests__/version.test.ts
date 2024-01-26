import {beforeAll, describe, expect, it} from '@jest/globals';
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

    it('runs version specific logic without else', () => {
        const execIf99_0 = versionReader.runIfVersionAtLeast(99, 0, 0, () => {
            return true;
        });
        expect(execIf99_0).toBeUndefined();
    });

    it('runs version specific logic with greater major', () => {
        // exercise the path where major version is greater
        const execIf0_0 = versionReader.runIfVersionAtLeast(-1, 0, 0, () => {
            return true;
        }, () => {
            return false;
        });
        expect(execIf0_0).toBeTruthy();
    });
});
