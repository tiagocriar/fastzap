import { SessionNotFoundError } from "../../domain/errors/index.js";

export class GetChatsUseCase {
  constructor(sessionManager, chatRepository) {
    this.sessionManager = sessionManager;
    this.chatRepository = chatRepository;
  }

  async execute(sessionId) {
    if (!this.sessionManager.has(sessionId)) {
      throw new SessionNotFoundError(sessionId);
    }

    return this.chatRepository.findBySession(sessionId, false);
  }
}
