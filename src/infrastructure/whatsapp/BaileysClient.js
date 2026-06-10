import path from 'path'
import { EventEmitter } from 'events'
import makeWASocket, {
  Browsers,
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import { env } from '../../config/env.js'

export class BaileysClient extends EventEmitter {
  #socket = null
  #sessionId
  #sessionsDir
  #isShuttingDown = false
  #phoneNumber = null
  #pendingSetup = false
  #pairingCodeRequested = false

  constructor(sessionId) {
    super()
    this.#sessionId = sessionId
    this.#sessionsDir = path.resolve(env.SESSIONS_DIR)
  }

  get sessionId() {
    return this.#sessionId
  }

  get socket() {
    return this.#socket
  }

  get isAuthenticated() {
    return this.#socket?.user?.id != null
  }

  async connect(phoneNumber = null) {
    this.#phoneNumber = phoneNumber ? phoneNumber.replace(/\D/g, '') : null
    this.#pendingSetup = true

    const authDir = path.join(this.#sessionsDir, `md_${this.#sessionId}`)
    const { state, saveCreds } = await useMultiFileAuthState(authDir)
    const { version } = await fetchLatestBaileysVersion()

    const logger = pino({ level: 'silent' })

    this.#socket = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: Browsers.macOS('Chrome'),
      logger,
      printQRInTerminal: false,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
    })

    this.#socket.ev.on('creds.update', saveCreds)
    this.#bindConnectionEvents()
    this.#bindMessageEvents()
  }

  async close() {
    this.#isShuttingDown = true
    this.#pendingSetup = false

    if (this.#socket) {
      this.#socket.end()
      this.#socket = null
    }
  }

  async disconnect() {
    this.#isShuttingDown = true
    this.#pendingSetup = false

    if (this.#socket) {
      await this.#socket.logout().catch(() => {})
      this.#socket.end()
      this.#socket = null
    }
  }

  async sendMessage(jid, content) {
    if (!this.#socket) {
      throw new Error(`Socket da sessão '${this.#sessionId}' não está disponível`)
    }

    const delay = Math.floor(Math.random() * 3000) + 1000
    await new Promise((resolve) => setTimeout(resolve, delay))

    return this.#socket.sendMessage(jid, content)
  }

  async onWhatsApp(...jids) {
    if (!this.#socket) {
      throw new Error(`Socket da sessão '${this.#sessionId}' não está disponível`)
    }

    return this.#socket.onWhatsApp(...jids)
  }

  getChats() {
    if (!this.#socket?.store) return []
    return Object.values(this.#socket.store.chats ?? {})
  }

  async getGroupMetadata(jid) {
    if (!this.#socket) {
      throw new Error(`Socket da sessão '${this.#sessionId}' não está disponível`)
    }

    return this.#socket.groupMetadata(jid)
  }

  #bindConnectionEvents() {
    this.#socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        if (this.#phoneNumber && !this.#socket.authState?.creds?.registered) {
          if (this.#pairingCodeRequested) return
          this.#pairingCodeRequested = true
          try {
            const code = await this.#socket.requestPairingCode(this.#phoneNumber)
            const formatted = code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code
            this.#pendingSetup = false
            this.emit('pairing_code', formatted)
          } catch (err) {
            this.#pairingCodeRequested = false
            this.#pendingSetup = false
            this.emit('setup_failed', err.message)
          }
        } else {
          const { toDataURL } = await import('qrcode')
          const qrBase64 = await toDataURL(qr)
          this.#pendingSetup = false
          this.emit('qr', qrBase64)
        }
      }

      if (connection === 'open') {
        this.#pendingSetup = false
        this.emit('connected')

        const phoneNumber = this.#socket?.user?.id
          ? this.#socket.user.id.split(':')[0]
          : null

        if (phoneNumber) {
          this.emit('authenticated', phoneNumber)
        }
      }

      if (connection === 'close') {
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut
        const reason = DisconnectReason[statusCode] ?? 'unknown'

        if (this.#pendingSetup) {
          this.#pendingSetup = false
          this.emit('setup_failed', reason)
          return
        }

        this.emit('disconnected', reason, shouldReconnect && !this.#isShuttingDown)
      }
    })
  }

  #bindMessageEvents() {
    this.#socket.ev.on('messages.upsert', ({ messages, type }) => {
      if (type !== 'notify') return

      for (const message of messages) {
        if (!message.message) continue
        this.emit('message', message, this.#sessionId)
      }
    })
  }
}
