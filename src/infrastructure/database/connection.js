import postgres from "postgres";
import { env } from "../../config/env.js";

let _sql = null;

export function getDatabase() {
  if (!_sql) {
    _sql = postgres(env.DATABASE_URL, {
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10,
      onnotice: () => {},
    });
  }

  return _sql;
}

export async function closeDatabase() {
  if (_sql) {
    await _sql.end();
    _sql = null;
  }
}
