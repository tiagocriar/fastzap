const errorResponse = {
  type: "object",
  properties: {
    statusCode: { type: "integer" },
    code: { type: "string" },
    error: { type: "string" },
    message: { type: "string" },
  },
};

export const sessionQuerySchema = {
  tags: ["Chats"],
  summary: "Listar chats",
  description: "Retorna todos os chats pessoais da sessão.",
  querystring: {
    type: "object",
    required: ["id"],
    properties: {
      id: {
        type: "string",
        minLength: 1,
        description: "ID da sessão",
        example: "minha-sessao",
      },
    },
  },
  response: {
    200: {
      description: "Lista de chats",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: { type: "array", items: { $ref: "Chat#" } },
      },
    },
    401: { description: "Não autorizado", ...errorResponse },
    404: { description: "Sessão não encontrada", ...errorResponse },
  },
};

export const chatMessagesSchema = {
  tags: ["Chats"],
  summary: "Mensagens de um chat",
  description:
    "Retorna o histórico de mensagens de uma conversa com paginação por cursor.",
  querystring: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", minLength: 1, example: "minha-sessao" },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
      cursor_id: { type: "string", description: "ID da mensagem cursor" },
      cursor_from_me: { type: "boolean" },
    },
  },
  params: {
    type: "object",
    required: ["jid"],
    properties: {
      jid: {
        type: "string",
        minLength: 1,
        description: "JID do chat",
        example: "5511999999999@s.whatsapp.net",
      },
    },
  },
  response: {
    200: {
      description: "Mensagens do chat",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: { type: "array", items: { $ref: "Message#" } },
      },
    },
    401: { description: "Não autorizado", ...errorResponse },
    404: { description: "Sessão não encontrada", ...errorResponse },
  },
};

export const sendMessageSchema = {};
export const sendBulkSchema = {};
export const checkPhoneSchema = {};
