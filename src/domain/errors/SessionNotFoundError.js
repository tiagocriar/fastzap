import { AppError } from './AppError.js'

export class SessionNotFoundError extends AppError {
  constructor(sessionId) {
    super(`Sessão '${sessionId}' não encontrada`, 404, 'SESSION_NOT_FOUND')
    this.sessionId = sessionId
  }
}
