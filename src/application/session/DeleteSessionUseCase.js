export class DeleteSessionUseCase {
  constructor(sessionManager, sessionRepository) {
    this.sessionManager = sessionManager;
    this.sessionRepository = sessionRepository;
  }

  async execute(sessionId) {
    await this.sessionManager.delete(sessionId);
    await this.sessionRepository.deleteById(sessionId);
  }
}
