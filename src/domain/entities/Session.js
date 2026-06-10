export class Session {
  status;

  /**
   * @param {object} props
   * @param {string} props.id - Identificador único da sessão
   * @param {'connecting'|'qr_ready'|'authenticated'|'disconnected'} props.status
   * @param {string|null} [props.qrCode] - QR code em base64 para autenticação
   * @param {string|null} [props.pairingCode] - Código de 8 dígitos para autenticação via pairing code (ex: "ABCD-EFGH")
   * @param {string|null} [props.phoneNumber] - Número autenticado
   * @param {Date} [props.createdAt]
   * @param {Date} [props.updatedAt]
   */
  constructor({
    id,
    status,
    qrCode = null,
    pairingCode = null,
    phoneNumber = null,
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    this.id = id;
    this.status = status;
    this.qrCode = qrCode;
    this.pairingCode = pairingCode;
    this.phoneNumber = phoneNumber;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isAuthenticated() {
    return this.status === "authenticated";
  }

  isConnecting() {
    return this.status === "connecting" || this.status === "qr_ready";
  }
}
