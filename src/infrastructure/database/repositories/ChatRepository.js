import { getDatabase } from "../connection.js";
import { Chat } from "../../../domain/entities/Chat.js";

export class ChatRepository {
  get db() {
    return getDatabase();
  }

  async save(chat) {
    const db = this.db;
    const rows = await db`
      INSERT INTO chats (jid, session_id, name, is_group, unread_count, last_message_at)
      VALUES (
        ${chat.jid},
        ${chat.sessionId},
        ${chat.name},
        ${chat.isGroup},
        ${chat.unreadCount},
        ${chat.lastMessageAt}
      )
      ON CONFLICT (jid, session_id) DO UPDATE SET
        name            = EXCLUDED.name,
        unread_count    = EXCLUDED.unread_count,
        last_message_at = EXCLUDED.last_message_at,
        updated_at      = now()
      RETURNING *
    `;

    return this.#toEntity(rows[0]);
  }

  async findBySession(sessionId, isGroup = false) {
    const db = this.db;
    const rows = await db`
      SELECT * FROM chats
      WHERE session_id = ${sessionId}
        AND is_group = ${isGroup}
      ORDER BY last_message_at DESC NULLS LAST
    `;

    return rows.map((r) => this.#toEntity(r));
  }

  async findByJid(jid, sessionId) {
    const db = this.db;
    const rows = await db`
      SELECT * FROM chats
      WHERE jid = ${jid} AND session_id = ${sessionId}
      LIMIT 1
    `;

    if (rows.length === 0) return null;

    return this.#toEntity(rows[0]);
  }

  #toEntity(row) {
    return new Chat({
      jid: row.jid,
      sessionId: row.session_id,
      name: row.name,
      isGroup: row.is_group,
      unreadCount: row.unread_count,
      lastMessageAt: row.last_message_at,
    });
  }
}
