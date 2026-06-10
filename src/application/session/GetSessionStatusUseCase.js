import { SessionNotFoundError } from "../../domain/errors/index.js";

export class GetSessionStatusUseCase {
  constructor(sessionManager, sessionRepository) {
    this.sessionManager = sessionManager;
    this.sessionRepository = sessionRepository;
  }

  async execute(sessionId) {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    const connected = session.status === "authenticated";
    const hasActiveClient = this.sessionManager.isConnected(sessionId);

    let error = null;

    if (!connected) {
      const statusMessages = {
        connecting: "You need to restore the session.",
        qr_ready: "You need to restore the session.",
        disconnected: "You are not connected.",
      };
      error = statusMessages[session.status] ?? "You are not connected.";
    }

    return {
      connected,
      smartphoneConnected: connected && hasActiveClient,
      error,
    };
  }
}
