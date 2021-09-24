/**
 * Don't use the global console - this gets
 * overridden by Jest and makes output chatty.
 */
const nodeConsole = require("console");

export {nodeConsole};
