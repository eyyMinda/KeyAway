import { logger } from "./logger";

// Example usage of the simplified logger

// Simple log (1 parameter)
logger("This is a simple log message");
logger({ user: "john", age: 30 });
logger([1, 2, 3, 4, 5]);

// Table log (data required, title and status optional)
logger.table({ name: "John", age: 30, city: "NYC" });
logger.table({ name: "John", age: 30, city: "NYC" }, "User Data");
logger.table({ name: "John", age: 30, city: "NYC" }, "User Data", "success");

// Collapse log (data required, title and status optional)
logger.collapse({ complex: "data", nested: { value: 123 } });
logger.collapse({ complex: "data", nested: { value: 123 } }, "Complex Data");
logger.collapse({ complex: "data", nested: { value: 123 } }, "Complex Data", "warning");

// All four status types (using collapse for status examples)
logger.collapse("Info message", "Info", "info");
logger.collapse("Success message", "Success", "success");
logger.collapse("Warning message", "Warning", "warning");
logger.collapse("Error message", "Error", "error");

// Table with different statuses
logger.table({ count: 5, total: 10 }, "Progress", "info");
logger.table({ count: 10, total: 10 }, "Complete", "success");
logger.table({ count: 0, total: 10 }, "Empty", "warning");
logger.table({ count: -1, total: 10 }, "Invalid", "error");

// Collapse with different statuses
logger.collapse({ step: 1, action: "start" }, "Process Start", "info");
logger.collapse({ step: 5, action: "complete" }, "Process Complete", "success");
logger.collapse({ step: 3, action: "retry" }, "Process Retry", "warning");
logger.collapse({ step: 0, action: "failed" }, "Process Failed", "error");
