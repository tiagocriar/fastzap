const errorResponse = {
  type: "object",
  properties: {
    statusCode: { type: "integer" },
    code: { type: "string" },
    error: { type: "string" },
    message: { type: "string" },
  },
};

export const createSessionSchema = {
  tags: ["Sessões"],
  summary: "Criar sessão",
  description: `Cria uma nova sessão WhatsApp.

**Fluxo QR code** (padrão): envie apenas \`id\`. A resposta incluirá \`qrCode\` em base64.

**Fluxo Pairing Code**: envie \`id\` + \`phoneNumber\`. A resposta incluirá \`pairingCode\` (ex: \`"ABCD-EFGH"\`).
O usuário deve digitar o código no WhatsApp → Configurações → Aparelhos Conectados → Conectar com número de telefone.`,
  body: {
    type: "object",
    required: ["id"],
    properties: {
      id: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        pattern: "^[a-zA-Z0-9_-]+$",
        description:
          "Identificador único da sessão (apenas letras, números, - e _)",
        example: "minha-sessao",
      },
      phoneNumber: {
        type: "string",
        pattern: "^[0-9]{10,15}$",
        description:
          "Número com DDI, sem +, espaços ou traços. Quando informado, usa pairing code em vez de QR.",
        example: "5511999999999",
      },
    },
  },
  response: {
    201: {
      description: "Sessão criada.",
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            session: { $ref: "Session#" },
            qrCode: {
              type: "string",
              nullable: true,
              description:
                "QR code em base64 (presente no fluxo QR, nulo no fluxo pairing code)",
            },
            pairingCode: {
              type: "string",
              nullable: true,
              description:
                "Código de 8 dígitos no formato XXXX-XXXX (presente no fluxo pairing code, nulo no fluxo QR)",
              example: "ABCD-EFGH",
            },
          },
        },
      },
    },
    400: { description: "Dados inválidos", ...errorResponse },
    401: { description: "Não autorizado", ...errorResponse },
    409: { description: "Sessão já existe", ...errorResponse },
  },
};

export const listSessionsSchema = {
  tags: ["Sessões"],
  summary: "Listar sessões",
  description: "Retorna todas as sessões cadastradas no banco de dados.",
  response: {
    200: {
      description: "Lista de sessões",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: { type: "array", items: { $ref: "Session#" } },
      },
    },
    401: { description: "Não autorizado", ...errorResponse },
  },
};

export const sessionIdParamSchema = {
  tags: ["Sessões"],
  params: {
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
};

export const sessionStatusSchema = {
  tags: ["Sessões"],
  summary: "Status da sessão",
  description: "Retorna o status de conexão da sessão no formato Z-API.",
  params: {
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
      description: "Status da sessão",
      $ref: "SessionStatus#",
    },
    401: { description: "Não autorizado", ...errorResponse },
    404: { description: "Sessão não encontrada", ...errorResponse },
  },
};

export const sessionQrCodeSchema = {
  tags: ["Sessões"],
  summary: "QR code atual",
  description:
    "Retorna o QR code em base64 caso a sessão ainda não tenha sido autenticada.",
  params: {
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
      description: "QR code disponível ou nulo",
      $ref: "QrCode#",
    },
    401: { description: "Não autorizado", ...errorResponse },
    404: { description: "QR code não disponível", ...errorResponse },
  },
};

export const deleteSessionSchema = {
  tags: ["Sessões"],
  summary: "Remover sessão",
  description: "Faz logout e remove a sessão permanentemente.",
  params: {
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
      description: "Sessão removida",
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: { type: "null" },
      },
    },
    401: { description: "Não autorizado", ...errorResponse },
    404: { description: "Sessão não encontrada", ...errorResponse },
  },
};

export const qrScreenQuerySchema = {
  hide: true,
  querystring: {
    type: "object",
    required: ["session", "token"],
    properties: {
      session: { type: "string", minLength: 1 },
      token: { type: "string", minLength: 1 },
    },
  },
};
