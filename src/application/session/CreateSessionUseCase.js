import { Session } from "../../domain/entities/Session.js";

export class CreateSessionUseCase {
  constructor(sessionManager, sessionRepository) {
    this.sessionManager = sessionManager;
    this.sessionRepository = sessionRepository;
  }

  async execute(sessionId, phoneNumber = null) {
    const result = await this.sessionManager.create(sessionId, phoneNumber);

    const qrCode = result.type === "qr" ? result.value : null;
    const pairingCode = result.type === "pairing_code" ? result.value : null;

    const session = await this.sessionRepository.save(
      new Session({
        id: sessionId,
        status: "qr_ready",
        qrCode,
        pairingCode,
      }),
    );

    return { session, qrCode, pairingCode };
  }
}
