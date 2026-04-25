type EventLogLevel = 'info' | 'warn' | 'error';

class EventLogger {
  private static instance: EventLogger;

  private constructor() {}

  public static getInstance(): EventLogger {
    if (!EventLogger.instance) {
      EventLogger.instance = new EventLogger();
    }

    return EventLogger.instance;
  }

  public info(scope: string, message: string, metadata?: unknown): void {
    this.log('info', scope, message, metadata);
  }

  public warn(scope: string, message: string, metadata?: unknown): void {
    this.log('warn', scope, message, metadata);
  }

  public error(scope: string, message: string, metadata?: unknown): void {
    this.log('error', scope, message, metadata);
  }

  private log(level: EventLogLevel, scope: string, message: string, metadata?: unknown): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [events] [${scope}]`;

    if (metadata !== undefined) {
      console[level](`${prefix} ${message}`, metadata);
      return;
    }

    console[level](`${prefix} ${message}`);
  }
}

export const eventLogger = EventLogger.getInstance();
