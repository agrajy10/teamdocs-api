const config = {
  verbose: true,
  testEnvironment: "node",
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  testMatch: ["**/tests/**/*.test.js"],
  setupFiles: ["dotenv/config"],
};

export default config;
