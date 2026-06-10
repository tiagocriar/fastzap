import axios from "axios";
import pino from "pino";
import { env } from "../../config/env.js";
import { MediaDownloader } from "../whatsapp/MediaDownloader.js";

const logger = pino({ level: "info" }).child({ module: "WebhookDispatcher" });

export class WebhookDispatcher {
  #webhookUrl;
  #maxRetries;
  #retryDelayMs;
  #mediaDownloader;
  #enabled;
  #sessionManager;

  constructor(sessionManager) {
    this.#webhookUrl = env.WEBHOOK_URL;
    this.#maxRetries = env.WEBHOOK_MAX_RETRIES;
    this.#retryDelayMs = env.WEBHOOK_RETRY_DELAY_MS;
    this.#mediaDownloader = new MediaDownloader();
    this.#enabled = Boolean(this.#webhookUrl);
    this.#sessionManager = sessionManager;

    if (!this.#enabled) {
      logger.warn(
        "WebhookDispatcher desabilitado: WEBHOOK_URL não configurado",
      );
      return;
    }

    sessionManager.onMessage((message, sessionId) => {
      this.#dispatch(message, sessionId).catch((err) =>
        logger.error({ err, sessionId }, "Erro fatal no dispatch de webhook"),
      );
    });

    logger.info({ url: this.#webhookUrl }, "WebhookDispatcher ativo");
  }

  async #dispatch(message, sessionId) {
    const payload = await this.#buildPayload(message, sessionId);
    await this.#sendWithRetry(payload);
  }

  async #buildPayload(msg, sessionId) {
    const key = msg.key ?? {};
    const rawJid = key.remoteJid ?? "";
    const isGroup = rawJid.endsWith("@g.us");
    const fromMe = key.fromMe ?? false;

    const phone = rawJid.replace(/@(s\.whatsapp\.net|g\.us|c\.us)$/, "");

    const momment =
      typeof msg.messageTimestamp === "object"
        ? Number(msg.messageTimestamp) * 1000
        : (msg.messageTimestamp ?? 0) * 1000;

    const msgContent = msg.message ?? {};

    const { type, typePayload } = await this.#extractTypePayload(
      msg,
      msgContent,
      sessionId,
    );

    return {
      instanceId: sessionId,
      phone,
      fromMe,
      isGroup,
      type: "ReceivedCallback",
      momment,
      messageId: key.id ?? null,
      ...typePayload,
    };
  }

  async #extractTypePayload(msg, msgContent, sessionId) {
    if (msgContent.conversation || msgContent.extendedTextMessage) {
      const text =
        msgContent.conversation ?? msgContent.extendedTextMessage?.text ?? "";

      return {
        type: "text",
        typePayload: {
          text: { message: text },
        },
      };
    }

    if (msgContent.imageMessage) {
      const im = msgContent.imageMessage;
      const imageUrl = await this.#tryDownloadMedia(msg, sessionId);

      return {
        type: "image",
        typePayload: {
          image: {
            imageUrl: im.url ?? null,
            caption: im.caption ?? null,
            base64: imageUrl,
            mimeType: im.mimetype ?? null,
          },
        },
      };
    }

    if (msgContent.audioMessage) {
      const am = msgContent.audioMessage;
      const base64 = await this.#tryDownloadMedia(msg, sessionId);

      return {
        type: am.ptt ? "ptt" : "audio",
        typePayload: {
          audio: {
            audioUrl: am.url ?? null,
            base64,
            mimeType: am.mimetype ?? null,
            ptt: am.ptt ?? false,
            seconds: am.seconds ?? null,
          },
        },
      };
    }

    if (msgContent.videoMessage) {
      const vm = msgContent.videoMessage;
      const base64 = await this.#tryDownloadMedia(msg, sessionId);

      return {
        type: "video",
        typePayload: {
          video: {
            videoUrl: vm.url ?? null,
            caption: vm.caption ?? null,
            base64,
            mimeType: vm.mimetype ?? null,
            seconds: vm.seconds ?? null,
          },
        },
      };
    }

    if (msgContent.documentMessage) {
      const dm = msgContent.documentMessage;
      const base64 = await this.#tryDownloadMedia(msg, sessionId);

      return {
        type: "document",
        typePayload: {
          document: {
            documentUrl: dm.url ?? null,
            fileName: dm.fileName ?? null,
            caption: dm.caption ?? null,
            base64,
            mimeType: dm.mimetype ?? null,
          },
        },
      };
    }

    if (msgContent.locationMessage) {
      const lm = msgContent.locationMessage;

      return {
        type: "location",
        typePayload: {
          location: {
            latitude: lm.degreesLatitude ?? null,
            longitude: lm.degreesLongitude ?? null,
            address: lm.name ?? null,
          },
        },
      };
    }

    if (msgContent.contactMessage) {
      const cm = msgContent.contactMessage;

      return {
        type: "contact",
        typePayload: {
          contact: {
            displayName: cm.displayName ?? null,
            vcard: cm.vcard ?? null,
          },
        },
      };
    }

    if (msgContent.reactionMessage) {
      const rm = msgContent.reactionMessage;

      return {
        type: "reaction",
        typePayload: {
          reaction: {
            value: rm.text ?? null,
            reactionMessageId: rm.key?.id ?? null,
          },
        },
      };
    }

    if (msgContent.stickerMessage) {
      const sm = msgContent.stickerMessage;
      const base64 = await this.#tryDownloadMedia(msg, sessionId);

      return {
        type: "sticker",
        typePayload: {
          sticker: {
            stickerUrl: sm.url ?? null,
            base64,
            mimeType: sm.mimetype ?? null,
          },
        },
      };
    }

    return {
      type: "unknown",
      typePayload: { raw: msgContent },
    };
  }

  async #tryDownloadMedia(message, sessionId) {
    try {
      if (!MediaDownloader.hasMedia(message)) return null;

      const client = this.#sessionManager?.getClient(sessionId);

      if (!client?.socket) return null;

      return await this.#mediaDownloader.downloadAsBase64(
        message,
        client.socket,
      );
    } catch {
      return null;
    }
  }

  async #sendWithRetry(payload) {
    let lastError;

    for (let attempt = 1; attempt <= this.#maxRetries; attempt++) {
      try {
        await axios.post(this.#webhookUrl, payload, {
          headers: { "Content-Type": "application/json" },
          timeout: 10_000,
        });

        return; // sucesso
      } catch (err) {
        lastError = err;

        if (attempt < this.#maxRetries) {
          const delay = this.#retryDelayMs * Math.pow(2, attempt - 1);
          logger.warn(
            { attempt, maxRetries: this.#maxRetries, delayMs: delay },
            "Falha no webhook, tentando novamente",
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    logger.error(
      { err: lastError, attempts: this.#maxRetries },
      "Webhook falhou após todas as tentativas",
    );
  }
}
