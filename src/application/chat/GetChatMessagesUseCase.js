import { SessionNotFoundError } from "../../domain/errors/index.js";

export class GetChatMessagesUseCase {
  constructor(sessionManager, messageRepository) {
    this.sessionManager = sessionManager;
    this.messageRepository = messageRepository;
  }

  async execute({
    sessionId,
    jid,
    limit = 25,
    cursorId = null,
    cursorFromMe = null,
  }) {
    if (!this.sessionManager.has(sessionId)) {
      throw new SessionNotFoundError(sessionId);
    }

    return this.messageRepository.findByChat({
      sessionId,
      jid,
      limit,
      cursorId,
      cursorFromMe,
    });
  }
}
