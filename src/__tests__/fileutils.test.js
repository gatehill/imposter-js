import {expect, it} from '@jest/globals';
import {fileUtils} from "../fileutils";
import path from "path";
import fs from "fs";

it('can discover local config file', async () => {
    const searchPaths = [
        path.join(process.cwd(), 'src', '__tests__', 'testdata'),
    ];
    const localConfig = await fileUtils.discoverLocalConfig(searchPaths);

    // check path
    expect(localConfig).toContain('/testdata/imposter.config.json');

    // check file exists
    expect(fs.existsSync(localConfig)).toBeTruthy();
});

it('returns null if no local config found', async () => {
    const searchPaths = [
        path.join(process.cwd(), 'invalid_dir'),
    ];
    const localConfig = await fileUtils.discoverLocalConfig(searchPaths);

    expect(localConfig).toBeNull();
});
