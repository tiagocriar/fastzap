import { CreateSessionUseCase } from "../../../application/session/CreateSessionUseCase.js";
import { DeleteSessionUseCase } from "../../../application/session/DeleteSessionUseCase.js";
import { GetSessionStatusUseCase } from "../../../application/session/GetSessionStatusUseCase.js";
import { ListSessionsUseCase } from "../../../application/session/ListSessionsUseCase.js";
import { UnauthorizedError } from "../../../domain/errors/index.js";
import { env } from "../../../config/env.js";
import {
  createSessionSchema,
  listSessionsSchema,
  sessionStatusSchema,
  sessionQrCodeSchema,
  deleteSessionSchema,
  qrScreenQuerySchema,
} from "../schemas/session.schema.js";

export async function sessionRoutes(
  app,
  { sessionManager, sessionRepository },
) {
  const createSession = new CreateSessionUseCase(
    sessionManager,
    sessionRepository,
  );
  const deleteSession = new DeleteSessionUseCase(
    sessionManager,
    sessionRepository,
  );
  const getStatus = new GetSessionStatusUseCase(
    sessionManager,
    sessionRepository,
  );
  const listSessions = new ListSessionsUseCase(
    sessionRepository,
    sessionManager,
  );

  app.get("/", { schema: listSessionsSchema }, async (_req, reply) => {
    const sessions = await listSessions.execute();

    return reply.send({
      success: true,
      message: "Sessões listadas com sucesso",
      data: sessions,
    });
  });

  app.get(
    "/:id/status",
    { schema: sessionStatusSchema },
    async (req, reply) => {
      const result = await getStatus.execute(req.params.id);

      return reply.send(result);
    },
  );

  app.get(
    "/:id/qr-code",
    { schema: sessionQrCodeSchema },
    async (req, reply) => {
      const qrCode = sessionManager.getQrCode(req.params.id);

      if (!qrCode) {
        return reply
          .status(404)
          .send({ value: null, error: "QR code not available" });
      }

      return reply.send({ value: qrCode });
    },
  );

  app.post("/", { schema: createSessionSchema }, async (req, reply) => {
    const { id, phoneNumber = null } = req.body;
    const { session, qrCode, pairingCode } = await createSession.execute(
      id,
      phoneNumber,
    );

    const message = pairingCode
      ? `Sessão criada. Digite o código ${pairingCode} no WhatsApp → Aparelhos Conectados → Conectar com número de telefone.`
      : "Sessão criada. Escaneie o QR code para autenticar.";

    return reply.status(201).send({
      success: true,
      message,
      data: {
        session,
        qrCode,
        pairingCode,
      },
    });
  });

  app.delete("/:id", { schema: deleteSessionSchema }, async (req, reply) => {
    await deleteSession.execute(req.params.id);

    return reply.send({
      success: true,
      message: "Sessão removida com sucesso",
      data: null,
    });
  });

  app.get(
    "/qr-screen",
    {
      schema: qrScreenQuerySchema,
      config: { public: true },
    },
    async (req, reply) => {
      const { session: sessionId, token } = req.query;

      if (token !== env.QR_ACCESS_TOKEN) {
        throw new UnauthorizedError("Token de acesso ao QR inválido");
      }

      const qrCode = sessionManager.getQrCode(sessionId);

      const html = buildQrHtml(sessionId, qrCode);

      return reply.type("text/html").send(html);
    },
  );
}

function buildQrHtml(sessionId, qrCode) {
  const content = qrCode
    ? `<img src="${qrCode}" alt="QR Code" style="max-width:300px"/>`
    : `<p style="color:#888">Aguardando QR code para a sessão <strong>${sessionId}</strong>...</p>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta http-equiv="refresh" content="3"/>
  <title>QR Code — ${sessionId}</title>
  <style>
    body { font-family: sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#f5f5f5; }
    h1 { font-size:1.2rem; color:#333; margin-bottom:1rem; }
  </style>
</head>
<body>
  <h1>WhatsApp QR Code — ${sessionId}</h1>
  ${content}
  <p style="font-size:.8rem;color:#aaa;margin-top:1rem">Página atualiza automaticamente a cada 3 segundos</p>
</body>
</html>`;
}
