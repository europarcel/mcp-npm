import winston from "winston";

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    // Only log to stderr to avoid interfering with MCP JSON-RPC on stdout
    new winston.transports.Console({
      stderrLevels: ['error', 'warn', 'info', 'debug'],
      silent: process.env.NODE_ENV === "test"
    })
  ]
}); 