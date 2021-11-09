import {beforeAll, expect, it} from '@jest/globals';
import {Utils} from "../configured-mock";
import {versionReader} from "../version";
import net from "net";

/**
 * The majority of coverage for `ConfiguredMock` comes via
 * the `MockBuilder` tests and the end to end tests.
 */

const utils = new Utils();

beforeAll(() => {
    return versionReader.initIfRequired();
});

it('generates debug advice', async () => {
    const expected = `
See log file: /tmp/example
Consider setting .verbose() on your mock for more details.
Run 'imposter doctor' to diagnose engine issues.`

    expect(utils.buildDebugAdvice(true, false, '/tmp/example')).toEqual(expected);
});

it('writes chunk to console', async () => {
    let consoleOutput = '';
    const fakeConsole = (chunk) => {
        consoleOutput += chunk;
    };

    utils.writeChunk('foo', true, false, fakeConsole, null);

    expect(consoleOutput).toEqual('foo');
});

it('writes chunk to stream', async () => {
    let consoleOutput = '';
    const fakeStream = {
        write(chunk) {
            consoleOutput += chunk;
        }
    };

    utils.writeChunk('foo', false, true, null, fakeStream);

    expect(consoleOutput).toEqual('foo');
});

it('assigns free port', async () => {
    const freePort = await utils.assignFreePort();

    expect(freePort).toEqual(expect.any(Number));

    const srv = net.createServer();
    let listened = false;
    try {
        listened = await new Promise((resolve, reject) => {
            try {
                srv.listen(freePort, () => resolve(true));
            } catch (e) {
                reject(e);
            }
        });
    } finally {
        srv.close();
    }

    expect(listened).toBeTruthy();
});

it('sleeps', async () => {
    const expectedDurationMs = 10;
    const start = new Date().getMilliseconds();

    await utils.sleep(expectedDurationMs);

    const now = new Date().getMilliseconds();
    expect(now).toBeGreaterThanOrEqual(start + expectedDurationMs);
});
