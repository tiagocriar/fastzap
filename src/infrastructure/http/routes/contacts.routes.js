import { CheckPhoneExistsUseCase } from "../../../application/chat/CheckPhoneExistsUseCase.js";

export async function contactRoutes(app, { sessionManager }) {
  const checkPhone = new CheckPhoneExistsUseCase(sessionManager);

  app.get(
    "/phone-exists/:phone",
    {
      schema: {
        tags: ["Contatos"],
        summary: "Verificar número no WhatsApp",
        description:
          "Verifica se um número de telefone tem conta ativa no WhatsApp.",
        params: {
          type: "object",
          required: ["phone"],
          properties: {
            phone: {
              type: "string",
              minLength: 8,
              description: "Número DDI+DDD+Número (ex: 5511999999999)",
              example: "5511999999999",
            },
          },
        },
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
            description: "Resultado da verificação",
            $ref: "PhoneExists#",
          },
          401: {
            description: "Não autorizado",
            type: "object",
            properties: { message: { type: "string" } },
          },
          404: {
            description: "Sessão não encontrada",
            type: "object",
            properties: { message: { type: "string" } },
          },
        },
      },
    },
    async (req, reply) => {
      const result = await checkPhone.execute({
        sessionId: req.query.id,
        phone: req.params.phone,
      });

      return reply.send(result);
    },
  );
}
