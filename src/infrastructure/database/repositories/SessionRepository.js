import { getDatabase } from "../connection.js";
import { Session } from "../../../domain/entities/Session.js";

export class SessionRepository {
  get db() {
    return getDatabase();
  }

  async findById(id) {
    const db = this.db;
    const rows = await db`
      SELECT id, status, qr_code, phone_number, created_at, updated_at
      FROM sessions
      WHERE id = ${id}
      LIMIT 1
    `;

    if (rows.length === 0) return null;

    return this.#toEntity(rows[0]);
  }

  async findAll() {
    const db = this.db;
    const rows = await db`
      SELECT id, status, qr_code, phone_number, created_at, updated_at
      FROM sessions
      ORDER BY created_at ASC
    `;

    return rows.map((row) => this.#toEntity(row));
  }

  async save(session) {
    const db = this.db;
    const rows = await db`
      INSERT INTO sessions (id, status, qr_code, phone_number, created_at, updated_at)
      VALUES (
        ${session.id},
        ${session.status},
        ${session.qrCode},
        ${session.phoneNumber},
        ${session.createdAt},
        ${session.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        status      = EXCLUDED.status,
        qr_code     = EXCLUDED.qr_code,
        phone_number = EXCLUDED.phone_number,
        updated_at  = now()
      RETURNING *
    `;

    return this.#toEntity(rows[0]);
  }

  async update(id, fields) {
    const db = this.db;
    const rows = await db`
      UPDATE sessions SET
        status       = COALESCE(${fields.status ?? null}, status),
        qr_code      = ${fields.qrCode !== undefined ? fields.qrCode : db`qr_code`},
        phone_number = ${fields.phoneNumber !== undefined ? fields.phoneNumber : db`phone_number`},
        updated_at   = now()
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) return null;

    return this.#toEntity(rows[0]);
  }

  async deleteById(id) {
    const db = this.db;
    const result = await db`
      DELETE FROM sessions WHERE id = ${id}
    `;

    return result.count > 0;
  }

  #toEntity(row) {
    return new Session({
      id: row.id,
      status: row.status,
      qrCode: row.qr_code,
      phoneNumber: row.phone_number,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
