import fp from "fastify-plugin";
import { UnauthorizedError } from "../../../domain/errors/index.js";
import { env } from "../../../config/env.js";

async function authPlugin(app) {
  app.addHook("onRequest", async (request, _reply) => {
    if (request.routeOptions?.config?.public) return;
    if (request.url.startsWith("/docs")) return;

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError("Header Authorization ausente");
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (token !== env.API_TOKEN) {
      throw new UnauthorizedError("Token inválido");
    }
  });
}

export default fp(authPlugin, { name: "auth" });
export { authPlugin };
