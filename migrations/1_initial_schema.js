export const up = (pgm) => {
  pgm.createType("session_status", [
    "connecting",
    "qr_ready",
    "authenticated",
    "disconnected",
  ]);

  pgm.createTable("sessions", {
    id: {
      type: "varchar(100)",
      primaryKey: true,
      notNull: true,
    },
    status: {
      type: "session_status",
      notNull: true,
      default: "connecting",
    },
    qr_code: {
      type: "text",
      notNull: false,
    },
    phone_number: {
      type: "varchar(30)",
      notNull: false,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createTable("chats", {
    jid: {
      type: "varchar(100)",
      notNull: true,
    },
    session_id: {
      type: "varchar(100)",
      notNull: true,
      references: '"sessions"',
      onDelete: "CASCADE",
    },
    name: {
      type: "varchar(255)",
      notNull: false,
    },
    is_group: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    unread_count: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    last_message_at: {
      type: "timestamptz",
      notNull: false,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint("chats", "chats_pkey", "PRIMARY KEY (jid, session_id)");

  pgm.createIndex("chats", ["session_id", "is_group"]);
  pgm.createIndex("chats", ["session_id", "last_message_at"]);

  pgm.createTable("messages", {
    id: {
      type: "varchar(100)",
      notNull: true,
    },
    session_id: {
      type: "varchar(100)",
      notNull: true,
      references: '"sessions"',
      onDelete: "CASCADE",
    },
    jid: {
      type: "varchar(100)",
      notNull: true,
    },
    from_me: {
      type: "boolean",
      notNull: true,
    },
    type: {
      type: "varchar(50)",
      notNull: true,
    },
    content: {
      type: "text",
      notNull: false,
    },
    raw_payload: {
      type: "jsonb",
      notNull: false,
    },
    timestamp: {
      type: "timestamptz",
      notNull: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint(
    "messages",
    "messages_pkey",
    "PRIMARY KEY (id, session_id)",
  );

  pgm.createIndex("messages", ["session_id", "jid", "timestamp"]);
  pgm.createIndex("messages", ["session_id", "jid", "from_me"]);
};

export const down = (pgm) => {
  pgm.dropTable("messages");
  pgm.dropTable("chats");
  pgm.dropTable("sessions");
  pgm.dropType("session_status");
};
