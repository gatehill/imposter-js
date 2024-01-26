module.exports = {
    clearMocks: false,
    collectCoverage: false,
    coverageDirectory: "coverage",
    coverageProvider: "v8",

    testEnvironment: "node",
    testMatch: [
        "<rootDir>/src/**/*.test.js",
    ],

    maxWorkers: 2,
};
