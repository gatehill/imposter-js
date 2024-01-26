module.exports = {
    clearMocks: false,
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageProvider: "v8",
    testTimeout: 60000,

    testEnvironment: "node",
    testMatch: [
        "<rootDir>/src/**/*.test.js",
        "<rootDir>/src/**/*.test.ts",
    ],
    preset: "ts-jest",
};
