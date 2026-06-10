export class Message {
  /**
   * @param {object} props
   * @param {string} props.id - ID da mensagem (gerado pelo WA)
   * @param {string} props.sessionId - Sessão que enviou/recebeu
   * @param {string} props.jid - JID do chat (ex: 5511999999999@s.whatsapp.net)
   * @param {boolean} props.fromMe - Se foi enviada por nós
   * @param {string} props.type - Tipo da mensagem (text, image, video, etc.)
   * @param {string|null} [props.content] - Conteúdo textual
   * @param {object|null} [props.rawPayload] - Payload completo do Baileys
   * @param {Date} [props.timestamp]
   */
  constructor({
    id,
    sessionId,
    jid,
    fromMe,
    type,
    content = null,
    rawPayload = null,
    timestamp = new Date(),
  }) {
    this.id = id;
    this.sessionId = sessionId;
    this.jid = jid;
    this.fromMe = fromMe;
    this.type = type;
    this.content = content;
    this.rawPayload = rawPayload;
    this.timestamp = timestamp;
  }

  isGroup() {
    return this.jid.endsWith("@g.us");
  }
}
