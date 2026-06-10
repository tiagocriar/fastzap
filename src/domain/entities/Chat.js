export class Chat {
  /**
   * @param {object} props
   * @param {string} props.jid - JID do chat
   * @param {string} props.sessionId - Sessão à qual pertence
   * @param {string|null} [props.name] - Nome do contato/grupo
   * @param {boolean} [props.isGroup] - Se é um grupo
   * @param {number} [props.unreadCount]
   * @param {Date|null} [props.lastMessageAt]
   */
  constructor({
    jid,
    sessionId,
    name = null,
    isGroup = false,
    unreadCount = 0,
    lastMessageAt = null,
  }) {
    this.jid = jid;
    this.sessionId = sessionId;
    this.name = name;
    this.isGroup = isGroup;
    this.unreadCount = unreadCount;
    this.lastMessageAt = lastMessageAt;
  }
}
