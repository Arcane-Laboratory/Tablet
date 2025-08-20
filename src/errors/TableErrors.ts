export class TableError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly tableName: string,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'TableError'
  }
}

export class ValidationError extends TableError {
  constructor(message: string, tableName: string, originalError?: Error) {
    super(message, 'VALIDATION', tableName, originalError)
    this.name = 'ValidationError'
  }
}

export class DatabaseConnectionError extends TableError {
  constructor(message: string, tableName: string, originalError?: Error) {
    super(message, 'CONNECTION', tableName, originalError)
    this.name = 'DatabaseConnectionError'
  }
}

export class DataOperationError extends TableError {
  constructor(message: string, tableName: string, originalError?: Error) {
    super(message, 'DATA_OPERATION', tableName, originalError)
    this.name = 'DataOperationError'
  }
}
