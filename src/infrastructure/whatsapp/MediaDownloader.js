import { downloadMediaMessage } from "@whiskeysockets/baileys";

export class MediaDownloader {
  static MEDIA_TYPES = new Set([
    "imageMessage",
    "videoMessage",
    "audioMessage",
    "documentMessage",
    "stickerMessage",
  ]);

  static hasMedia(message) {
    if (!message?.message) return false;

    return MediaDownloader.MEDIA_TYPES.has(Object.keys(message.message)[0]);
  }

  async downloadAsBase64(message, socket) {
    try {
      const buffer = await downloadMediaMessage(
        message,
        "buffer",
        {},
        {
          logger: socket.logger,
          reuploadRequest: socket.updateMediaMessage,
        },
      );

      return buffer.toString("base64");
    } catch {
      return null;
    }
  }
}
