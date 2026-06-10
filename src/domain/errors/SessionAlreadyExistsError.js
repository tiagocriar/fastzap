import { AppError } from './AppError.js'

export class SessionAlreadyExistsError extends AppError {
  constructor(sessionId) {
    super(`Sessão '${sessionId}' já existe`, 409, 'SESSION_ALREADY_EXISTS')
    this.sessionId = sessionId
  }
}
