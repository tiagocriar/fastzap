import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "../../config/env.js";
import { errorHandlerPlugin } from "./plugins/errorHandler.js";
import fpAuth from "./plugins/auth.js";
import swaggerPlugin from "./plugins/swagger.js";
import { sessionRoutes } from "./routes/sessions.routes.js";
import { chatRoutes } from "./routes/chats.routes.js";
import { groupRoutes } from "./routes/groups.routes.js";
import { messageRoutes } from "./routes/messages.routes.js";
import { contactRoutes } from "./routes/contacts.routes.js";

export function buildServer({
  sessionManager,
  sessionRepository,
  chatRepository,
  messageRepository,
}) {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      ...(env.NODE_ENV !== "production" && {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss" },
        },
      }),
    },
    ajv: {
      customOptions: {
        strict: false,
        keywords: ["example"],
      },
    },
  });

  app.register(cors, { origin: true });
  app.register(swaggerPlugin);
  app.register(errorHandlerPlugin);
  app.register(fpAuth);

  app.get(
    "/health",
    { schema: { hide: true }, config: { public: true } },
    async (_req, reply) => {
      return reply.send({
        success: true,
        message: "API operacional",
        data: {
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          activeSessions: sessionManager.listIds().length,
        },
      });
    },
  );

  app.register(sessionRoutes, {
    prefix: "/sessions",
    sessionManager,
    sessionRepository,
  });

  app.register(chatRoutes, {
    prefix: "/chats",
    sessionManager,
    chatRepository,
    messageRepository,
  });

  app.register(groupRoutes, {
    prefix: "/groups",
    sessionManager,
    chatRepository,
    messageRepository,
  });

  app.register(messageRoutes, {
    sessionManager,
  });

  app.register(contactRoutes, {
    prefix: "/contacts",
    sessionManager,
  });

  return app;
}

export async function startServer(app) {
  await app.listen({ host: env.HOST, port: env.PORT });
}
