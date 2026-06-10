import { getDatabase } from "../connection.js";
import { Message } from "../../../domain/entities/Message.js";

export class MessageRepository {
  get db() {
    return getDatabase();
  }

  async save(message) {
    const db = this.db;
    const rows = await db`
      INSERT INTO messages (id, session_id, jid, from_me, type, content, raw_payload, timestamp)
      VALUES (
        ${message.id},
        ${message.sessionId},
        ${message.jid},
        ${message.fromMe},
        ${message.type},
        ${message.content},
        ${JSON.stringify(message.rawPayload)},
        ${message.timestamp}
      )
      ON CONFLICT (id, session_id) DO NOTHING
      RETURNING *
    `;

    if (rows.length === 0) return message;

    return this.#toEntity(rows[0]);
  }

  async findByChat({
    sessionId,
    jid,
    limit = 25,
    cursorId = null,
    cursorFromMe = null,
  }) {
    const db = this.db;

    if (cursorId) {
      const rows = await db`
        SELECT * FROM messages
        WHERE session_id = ${sessionId}
          AND jid = ${jid}
          AND (timestamp, id) < (
            SELECT timestamp, id FROM messages
            WHERE id = ${cursorId}
              AND session_id = ${sessionId}
              AND from_me = ${cursorFromMe}
            LIMIT 1
          )
        ORDER BY timestamp DESC, id DESC
        LIMIT ${limit}
      `;
      return rows.map((r) => this.#toEntity(r));
    }

    const rows = await db`
      SELECT * FROM messages
      WHERE session_id = ${sessionId}
        AND jid = ${jid}
      ORDER BY timestamp DESC, id DESC
      LIMIT ${limit}
    `;

    return rows.map((r) => this.#toEntity(r));
  }

  #toEntity(row) {
    return new Message({
      id: row.id,
      sessionId: row.session_id,
      jid: row.jid,
      fromMe: row.from_me,
      type: row.type,
      content: row.content,
      rawPayload: row.raw_payload,
      timestamp: row.timestamp,
    });
  }
}
