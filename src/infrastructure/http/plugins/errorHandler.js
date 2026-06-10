import { AppError } from "../../../domain/errors/AppError.js";

export async function errorHandlerPlugin(app) {
  app.setErrorHandler((error, _request, reply) => {
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Dados de entrada inválidos",
        errors: error.validation.map((v) => ({
          field: v.instancePath.replace("/", "") || v.params?.missingProperty,
          message: v.message,
        })),
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        code: error.code,
        message: error.message,
      });
    }

    app.log.error({ err: error }, "Erro não tratado");

    return reply.status(500).send({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Ocorreu um erro interno. Tente novamente.",
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      success: false,
      code: "NOT_FOUND",
      message: "Rota não encontrada",
    });
  });
}
