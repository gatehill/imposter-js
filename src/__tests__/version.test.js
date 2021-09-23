import {expect, it} from '@jest/globals';
import {versionReader} from "../version";

it('can determine the CLI version', async () => {
    const version = await versionReader.determineCliVersion();
    console.debug(`CLI version: ${JSON.stringify(version)}`);
    expect(version.major).toEqual(0);
});

it('runs version specific logic', async () => {
    const execIf0_6 = await versionReader.runIfVersionAtLeast(0, 6, () => {
        return true;
    }, () => {
        return false;
    });
    const execIf99_0 = await versionReader.runIfVersionAtLeast(99, 0, () => {
        return true;
    }, () => {
        return false;
    });
    expect(execIf0_6).toEqual(true);
    expect(execIf99_0).toEqual(false);
});
