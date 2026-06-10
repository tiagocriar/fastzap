export class ListSessionsUseCase {
  constructor(sessionRepository, sessionManager) {
    this.sessionRepository = sessionRepository;
    this.sessionManager = sessionManager;
  }

  async execute() {
    const sessions = await this.sessionRepository.findAll();

    return sessions.map((session) => {
      if (
        session.status === "authenticated" &&
        !this.sessionManager.isConnected(session.id)
      ) {
        return { ...session, status: "disconnected" };
      }
      return session;
    });
  }
}
