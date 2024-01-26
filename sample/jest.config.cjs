module.exports = {
    clearMocks: false,
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageProvider: "v8",

    testEnvironment: "node",
    testMatch: [
        "<rootDir>/src/**/*.test.js",
    ],

    maxWorkers: 2,
};
