import { SessionNotFoundError } from "../../domain/errors/index.js";
import { PhoneFormatter } from "../../infrastructure/whatsapp/PhoneFormatter.js";

export class SendGroupMessageUseCase {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
  }

  async execute({ sessionId, jid, message }) {
    const client = this.sessionManager.getClient(sessionId);

    if (!client) {
      throw new SessionNotFoundError(sessionId);
    }

    const groupJid = PhoneFormatter.toGroupJid(jid);

    const result = await client.sendMessage(groupJid, message);

    const messageId = result?.key?.id ?? result?.key?.id ?? "";

    return { messageId, id: messageId };
  }
}
