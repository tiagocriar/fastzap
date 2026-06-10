# Fastzap

Gateway HTTP para o WhatsApp construído sobre [Baileys](https://github.com/WhiskeySockets/Baileys), com suporte a **múltiplas sessões**, persistência em PostgreSQL, webhooks de mensagens recebidas e alertas via Telegram. Escrito em Node.js com [Fastify](https://fastify.dev) e organizado em **Clean Architecture**.

Projeto open source e livre, distribuído sob licença MIT.

## Recursos

- 🔌 **Múltiplas sessões** simultâneas, cada uma identificada por um `id`.
- 🔐 Autenticação via **QR code** ou **pairing code** (código de pareamento por número).
- 💬 Envio de **texto, imagem, áudio, vídeo, documento, link com preview, localização, contato e reação**.
- 📤 Envio em **massa** (`send-bulk`).
- 👥 Suporte a **grupos** (listar, metadados, enviar, histórico).
- 📥 **Webhook** para encaminhar mensagens recebidas a uma URL externa (com retry e backoff).
- 🗄️ Persistência de sessões, chats e mensagens em **PostgreSQL**.
- 🔁 **Reconexão automática** com backoff progressivo.
- 📲 **Alertas no Telegram** quando uma sessão cai.
- 📖 Documentação **Swagger / OpenAPI** em `/docs`.
- 🐳 Pronto para **Docker**.

## Arquitetura

O código segue Clean Architecture, separando responsabilidades em camadas:

```
src/
├── domain/           # Entidades e erros de negócio (sem dependências externas)
├── application/      # Casos de uso (orquestração da lógica)
├── infrastructure/   # Detalhes técnicos: HTTP, banco, WhatsApp, webhook, notificações
│   ├── http/         # Servidor Fastify, rotas, plugins (auth, swagger, error handler)
│   ├── database/     # Conexão e repositórios PostgreSQL
│   ├── whatsapp/     # SessionManager, BaileysClient, formatadores
│   ├── webhook/      # Dispatcher de mensagens recebidas
│   └── notifications/# Notifier do Telegram
├── config/           # Validação de variáveis de ambiente (Zod)
└── main.js           # Bootstrap da aplicação
```

## Requisitos

- Node.js **>= 22**
- PostgreSQL
- (Opcional) Docker + Docker Compose

## Instalação

```bash
git clone <url-do-repositorio>
cd fastzap
npm install
cp .env.example .env   # edite os valores
```

Rode as migrations do banco:

```bash
npm run migrate
```

Inicie a aplicação:

```bash
npm run dev    # modo desenvolvimento (com --watch e logs formatados)
npm start      # modo produção
```

A API sobe em `http://localhost:3333` por padrão e a documentação fica em `http://localhost:3333/docs`.

## Configuração (.env)

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `NODE_ENV` | não | `development` | `development` \| `production` \| `test` |
| `HOST` | não | `0.0.0.0` | Host de escuta |
| `PORT` | não | `3333` | Porta de escuta |
| `API_TOKEN` | **sim** | — | Token Bearer para autenticar as chamadas à API |
| `QR_ACCESS_TOKEN` | **sim** | — | Token separado para acessar a página do QR code no browser |
| `DATABASE_URL` | **sim** | — | URL de conexão PostgreSQL |
| `MAX_RETRIES` | não | `5` | Tentativas de reconexão automática |
| `RECONNECT_INTERVAL_MS` | não | `5000` | Intervalo base entre reconexões (escala por tentativa, máx. 60s) |
| `SESSIONS_DIR` | não | `./sessions` | Diretório dos arquivos de auth das sessões |
| `WEBHOOK_URL` | não | — | URL para encaminhar mensagens recebidas (vazio = desabilitado) |
| `WEBHOOK_MAX_RETRIES` | não | `3` | Tentativas de envio do webhook |
| `WEBHOOK_RETRY_DELAY_MS` | não | `1000` | Delay base do retry do webhook (dobra a cada falha) |
| `TELEGRAM_TOKEN` | não | — | Token do bot do Telegram (vazio = sem alertas) |
| `TELEGRAM_CHAT_ID` | não | — | Chat/grupo que recebe os alertas |

## Autenticação

Todas as rotas (exceto `/health`, `/docs` e a tela pública do QR) exigem o header:

```
Authorization: Bearer <API_TOKEN>
```

## Uso rápido

### 1. Criar uma sessão

```bash
curl -X POST http://localhost:3333/sessions \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "id": "minha-sessao" }'
```

A resposta traz um `qrCode` (base64). Para autenticar por **pairing code**, envie também `phoneNumber`:

```bash
curl -X POST http://localhost:3333/sessions \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "id": "minha-sessao", "phoneNumber": "5511999999999" }'
```

> Você também pode abrir a tela do QR no navegador (atualiza sozinha a cada 3s):
> `http://localhost:3333/sessions/qr-screen?session=minha-sessao&token=<QR_ACCESS_TOKEN>`

### 2. Enviar uma mensagem de texto

```bash
curl -X POST "http://localhost:3333/send-text?id=minha-sessao" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "phone": "5511999999999", "message": "Olá!" }'
```

## Endpoints

> A documentação interativa completa (com schemas e exemplos) está em `/docs`.

### Health
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Status da API e sessões ativas (público) |

### Sessões (`/sessions`)
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/sessions` | Lista todas as sessões |
| `POST` | `/sessions` | Cria sessão (QR ou pairing code) |
| `GET` | `/sessions/:id/status` | Status de conexão da sessão |
| `GET` | `/sessions/:id/qr-code` | QR code atual em base64 |
| `DELETE` | `/sessions/:id` | Remove a sessão |
| `GET` | `/sessions/qr-screen` | Página HTML com o QR (público, via `QR_ACCESS_TOKEN`) |

### Mensagens (`?id=<sessão>`)
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/send-text` | Texto |
| `POST` | `/send-image` | Imagem (com legenda / view once) |
| `POST` | `/send-audio` | Áudio (com PTT) |
| `POST` | `/send-video` | Vídeo |
| `POST` | `/send-document` | Documento |
| `POST` | `/send-link` | Link com preview |
| `POST` | `/send-location` | Localização |
| `POST` | `/send-contact` | Contato (vCard) |
| `POST` | `/send-reaction` | Reação a uma mensagem |
| `POST` | `/send-bulk` | Envio em massa |

### Chats (`/chats`, `?id=<sessão>`)
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/chats` | Lista os chats |
| `GET` | `/chats/:jid` | Histórico de mensagens (paginado por cursor) |

### Grupos (`/groups`, `?id=<sessão>`)
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/groups` | Lista os grupos |
| `GET` | `/groups/:jid/meta` | Metadados do grupo |
| `POST` | `/groups/send` | Envia mensagem ao grupo |
| `GET` | `/groups/:jid/messages` | Histórico de mensagens do grupo |

### Contatos (`/contacts`, `?id=<sessão>`)
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/contacts/phone-exists/:phone` | Verifica se o número tem conta no WhatsApp |

## Webhook

Se `WEBHOOK_URL` estiver definida, cada mensagem recebida é encaminhada por `POST` para essa URL, com retry e backoff exponencial controlados por `WEBHOOK_MAX_RETRIES` e `WEBHOOK_RETRY_DELAY_MS`.

## Docker

```bash
docker compose up -d --build
```

O `docker-compose.yml` já configura volume persistente para as sessões, healthcheck e roda as migrations no start. Lembre-se de fornecer um `.env` com as variáveis (especialmente `DATABASE_URL` apontando para um PostgreSQL acessível pelo container).

## Stack

- **Runtime:** Node.js 22 (ESM)
- **Framework HTTP:** Fastify 5
- **WhatsApp:** @whiskeysockets/baileys 7
- **Banco:** PostgreSQL (driver `postgres`, migrations com `node-pg-migrate`)
- **Validação:** Zod
- **Docs:** @fastify/swagger + swagger-ui
- **Logs:** Pino

## Licença

MIT.
