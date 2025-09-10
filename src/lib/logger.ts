type LogStatus = "success" | "error" | "info" | "warning";

interface Logger {
  (data: unknown): void;
  table: (data: unknown, title?: string, status?: LogStatus) => void;
  collapse: (data: unknown, title?: string, status?: LogStatus) => void;
}

class LoggerClass {
  private isDev = process.env.NODE_ENV === "development";

  private getFileName(): string {
    const stack = new Error().stack;
    if (!stack) return "unknown";

    const lines = stack.split("\n");
    const callerLine = lines[3] || lines[2] || lines[1];

    const match = callerLine.match(/([^/\\]+\.(ts|tsx|js|jsx)):(\d+):(\d+)/);
    if (match) {
      return match[1];
    }

    return "unknown";
  }

  private getStatusColor(status: LogStatus): string {
    const colors = {
      success: "background-color: #10B981; color: white; font-weight: bold; padding: 6px; border-radius: 4px;",
      error: "background-color: #EF4444; color: white; font-weight: bold; padding: 6px; border-radius: 4px;",
      info: "background-color: #3B82F6; color: white; font-weight: bold; padding: 6px; border-radius: 4px;",
      warning: "background-color: #F59E0B; color: white; font-weight: bold; padding: 6px; border-radius: 4px;"
    };
    return colors[status];
  }

  private getTitleColor(): string {
    return "color: white; font-weight: bold;";
  }

  log(data: unknown, title?: string, status: LogStatus = "info"): void {
    if (!this.isDev) return;

    const fileName = this.getFileName();
    const statusColor = this.getStatusColor(status);
    const titleColor = this.getTitleColor();

    const displayTitle = title || "Log";
    const fileInfo = `%c[${fileName}]`;

    console.log(`%c${displayTitle}%c ${fileInfo}`, statusColor, titleColor, data);
  }

  table(data: unknown, title: string = "Table", status: LogStatus = "info"): void {
    if (!this.isDev) return;

    const fileName = this.getFileName();
    const statusColor = this.getStatusColor(status);
    const titleColor = this.getTitleColor();

    const fileInfo = `%c[${fileName}]`;

    console.groupCollapsed(`%c${title}%c ${fileInfo}`, statusColor, titleColor);

    if (data && typeof data === "object" && !Array.isArray(data)) {
      console.table(data);
    } else {
      console.log(data);
    }

    console.groupEnd();
  }

  collapse(data: unknown, title: string = "Collapse", status: LogStatus = "info"): void {
    if (!this.isDev) return;

    const fileName = this.getFileName();
    const statusColor = this.getStatusColor(status);
    const titleColor = this.getTitleColor();

    const fileInfo = `%c[${fileName}]`;

    console.groupCollapsed(`%c${title}%c ${fileInfo}`, statusColor, titleColor);

    console.log(data);
    console.groupEnd();
  }
}

// Create the logger instance
const loggerInstance = new LoggerClass();

// Create the logger function that can be called directly
const logger = ((data: unknown) => {
  loggerInstance.log(data);
}) as Logger;

// Attach methods to the logger function
logger.table = loggerInstance.table.bind(loggerInstance);
logger.collapse = loggerInstance.collapse.bind(loggerInstance);

export { logger };
export type { LogStatus };
