import {beforeAll, expect, it} from '@jest/globals';
import {fileUtils} from "../fileutils";
import path from "path";
import fs from "fs";

beforeAll(async () => {
    await fileUtils.checkInit();
});

it('can discover local config file', () => {
    const searchPaths = [
        path.join(__dirname, 'testdata', 'cli_config'),
    ];
    const localConfig = fileUtils.discoverLocalConfig(searchPaths);

    // check path
    expect(localConfig).toContain('/testdata/cli_config/imposter.config.json');

    // check file exists
    expect(fs.existsSync(localConfig)).toBe(true);
});

it('returns null if no local config found', () => {
    const searchPaths = [
        path.join(__dirname, 'invalid_dir'),
    ];
    const localConfig = fileUtils.discoverLocalConfig(searchPaths);

    expect(localConfig).toBeNull();
});
