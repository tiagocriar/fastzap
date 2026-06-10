import { SessionNotFoundError } from "../../domain/errors/index.js";
import { PhoneFormatter } from "../../infrastructure/whatsapp/PhoneFormatter.js";

export class GetGroupMetaUseCase {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
  }

  async execute({ sessionId, jid }) {
    const client = this.sessionManager.getClient(sessionId);

    if (!client) {
      throw new SessionNotFoundError(sessionId);
    }

    const groupJid = PhoneFormatter.toGroupJid(jid);

    return client.getGroupMetadata(groupJid);
  }
}
