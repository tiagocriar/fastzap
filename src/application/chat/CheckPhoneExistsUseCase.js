import { SessionNotFoundError } from "../../domain/errors/index.js";
import { PhoneFormatter } from "../../infrastructure/whatsapp/PhoneFormatter.js";

export class CheckPhoneExistsUseCase {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
  }

  async execute({ sessionId, phone }) {
    const client = this.sessionManager.getClient(sessionId);

    if (!client) {
      throw new SessionNotFoundError(sessionId);
    }

    const jid = PhoneFormatter.toJid(phone);
    const results = await client.onWhatsApp(jid);

    if (!results || results.length === 0) {
      return [{ exists: false, phone, lid: null }];
    }

    return results.map((r) => ({
      exists: r.exists,
      phone: PhoneFormatter.fromJid(r.jid ?? jid),
      lid: r.lid ?? null,
    }));
  }
}
