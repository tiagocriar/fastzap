import { GetChatsUseCase } from "../../../application/chat/GetChatsUseCase.js";
import { GetChatMessagesUseCase } from "../../../application/chat/GetChatMessagesUseCase.js";
import {
  sessionQuerySchema,
  chatMessagesSchema,
} from "../schemas/chat.schema.js";

export async function chatRoutes(
  app,
  { sessionManager, chatRepository, messageRepository },
) {
  const getChats = new GetChatsUseCase(sessionManager, chatRepository);
  const getMessages = new GetChatMessagesUseCase(
    sessionManager,
    messageRepository,
  );

  app.get("/", { schema: sessionQuerySchema }, async (req, reply) => {
    const chats = await getChats.execute(req.query.id);

    return reply.send({
      success: true,
      message: "Chats listados com sucesso",
      data: chats,
    });
  });

  app.get("/:jid", { schema: chatMessagesSchema }, async (req, reply) => {
    const { limit, cursor_id, cursor_from_me } = req.query;

    const messages = await getMessages.execute({
      sessionId: req.query.id,
      jid: req.params.jid,
      limit: limit ? Number(limit) : 25,
      cursorId: cursor_id ?? null,
      cursorFromMe:
        cursor_from_me !== undefined ? cursor_from_me === "true" : null,
    });

    return reply.send({
      success: true,
      message: "Mensagens obtidas com sucesso",
      data: messages,
    });
  });
}
