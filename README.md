

> API REST + WebSocket Gateway para la plataforma de casino online NoBet.

![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql)
![TypeORM](https://img.shields.io/badge/TypeORM-0.3-FE0902?style=flat-square)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socketdotio)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker)

---

## Descripción

Backend de NoBet construido con **NestJS** y **PostgreSQL**. Gestiona la autenticación de usuarios, el balance virtual, los tres módulos de juego (ruleta, blackjack y dados) y el sistema social de amigos. La ruleta funciona en tiempo real mediante un **WebSocket Gateway** basado en Socket.IO.

---

## Instalación y Arranque

### Requisitos previos
- Node.js 18+
- PostgreSQL 15+
- npm o yarn

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/nobet-backend.git
cd nobet-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de base de datos y JWT secret

# 4. Arrancar en desarrollo (con hot reload)
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000`

### Variables de entorno

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DATABASE=nobet

# JWT
JWT_SECRET=tu_secret_muy_seguro
JWT_EXPIRES_IN=7d

# App
PORT=3000
```

---

## Docker

```bash
# Arrancar todo el stack (backend + PostgreSQL)
docker compose up

# Solo el backend
docker build -t nobet-backend .
docker run -p 3000:3000 --env-file .env nobet-backend
```

---

## Estructura del Proyecto

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts     # POST /auth/login, /auth/register, GET /auth/profile
│   │   ├── auth.service.ts        # Validación de credenciales y generación de JWT
│   │   └── guards/
│   │       └── jwt-auth.guard.ts  # Guard para proteger rutas privadas
│   ├── users/
│   │   ├── users.controller.ts    # Leaderboard, claim-charity, roulette-settle, amigos
│   │   ├── users.service.ts       # Lógica de negocio: balance, amigos, ruleta settle
│   │   ├── users.module.ts
│   │   ├── dto/
│   │   │   └── create-user.dto.ts
│   │   └── entities/
│   │       ├── user.entity.ts
│   │       └── friend-request.entity.ts
│   └── games/
│       ├── blackjack/
│       │   └── blackjack.service.ts   # Estado en memoria (Map), lógica completa
│       ├── dice/
│       │   ├── dice.controller.ts     # POST /games/dice/roll
│       │   └── dice.service.ts        # RNG servidor, multiplicadores, balance
│       ├── roulette/
│       │   ├── roulette.gateway.ts    # WebSocket Gateway (Socket.IO)
│       │   ├── roulette.service.ts    # Ciclo de juego, fases, número ganador
│       │   └── roulette.module.ts
│       ├── games.controller.ts        # POST /games/blackjack/play, /hit, /stand
│       └── games.module.ts
├── app.module.ts
└── main.ts
```

---

## API Reference

### Autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | ❌ | Crear cuenta nueva |
| `POST` | `/auth/login` | ❌ | Iniciar sesión, devuelve JWT |
| `GET` | `/auth/profile` | ✅ | Perfil del usuario autenticado |

### Usuarios

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/users/leaderboard` | ❌ | Top 10 global por balance |
| `GET` | `/users/leaderboard/friends` | ✅ | Ranking de amigos del usuario |
| `POST` | `/users/claim-charity` | ✅ | Reponer balance a 1 (solo si balance = 0) |
| `POST` | `/users/roulette-settle` | ✅ | Resolver apuestas de ruleta y actualizar balance |
| `POST` | `/users/friend-request` | ✅ | Enviar solicitud de amistad por username |
| `GET` | `/users/friend-requests` | ✅ | Listar solicitudes pendientes recibidas |
| `POST` | `/users/friend-request/accept` | ✅ | Aceptar solicitud de amistad |
| `POST` | `/users/friend-request/reject` | ✅ | Rechazar solicitud de amistad |
| `POST` | `/users/remove-friend` | ✅ | Eliminar amigo |

### Juegos

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/games/blackjack/play` | ✅ | Iniciar partida de blackjack con apuesta |
| `POST` | `/games/blackjack/hit` | ✅ | Pedir carta |
| `POST` | `/games/blackjack/stand` | ✅ | Plantarse (el crupier completa su mano) |
| `POST` | `/games/dice/roll` | ✅ | Tirada de dados con apuesta |

### WebSocket

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `rouletteState` | Server → Client | Estado completo de la ruleta cada segundo |

**Estructura del evento `rouletteState`:**
```json
{
  "phase": "BETTING",
  "timer": 12,
  "history": [
    { "number": 17, "color": "black" },
    { "number": 0,  "color": "green" }
  ],
  "lastWinningNumber": { "number": 17, "color": "black" }
}
```

---

## Lógica de Juegos

### Ruleta — Ciclo de Fases

El servidor ejecuta un bucle cada segundo que avanza automáticamente entre tres fases:

```
BETTING (15s) ──► SPINNING (5s) ──► PAYING (3s) ──► BETTING ...
```

- **BETTING**: el frontend acepta apuestas del usuario. El balance se descuenta localmente al colocar cada ficha.
- **SPINNING**: el servidor genera el número ganador y lo emite. El frontend anima la rueda.
- **PAYING**: el frontend llama a `POST /users/roulette-settle` con las apuestas y el número ganador. El servidor calcula las ganancias y actualiza el balance en PostgreSQL.

**Pagos de la ruleta europea:**

| Apuesta | Pago | Devuelve |
|---------|------|----------|
| Número exacto (pleno) | 35:1 | 36× |
| Color (rojo/negro) | 1:1 | 2× |
| Docena | 2:1 | 3× |
| Columna | 2:1 | 3× |

### Blackjack — Estado en Memoria

Las partidas activas se almacenan en un `Map<userId, GameState>` en memoria. Al finalizar cada partida (win/loss/draw), el estado se elimina del Map y el balance se actualiza en la base de datos:

```typescript
// Balance tras cada resultado:
// Victoria normal:  updateBalance(userId, +bet * 2)
// Empate:           updateBalance(userId, +bet * 1)
// Derrota:          sin operación (el bet fue descontado al iniciar)
```

La lógica del crupier sigue la regla estándar de casino: **pide con ≤16, se planta con ≥17**.

### Dados — Modelo de Probabilidad

```
multiplier = (100 - houseEdge) / winChance
houseEdge  = 1.0%
winChance  = condición 'over' ? (100 - target) : target
```

El resultado se genera exclusivamente en el servidor. El balance se descuenta **antes** de la tirada y el payout se acredita **después**, garantizando consistencia aunque el cliente pierda la conexión.

---

## Modelo de Base de Datos

### Entidad `User`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `int` PK | Identificador único |
| `username` | `varchar` UNIQUE | Nombre de usuario |
| `email` | `varchar` UNIQUE | Correo electrónico |
| `password` | `varchar` | Hash bcrypt |
| `balance` | `decimal` | Balance virtual (default: 1000) |
| `friends` | `User[]` | Relación ManyToMany self-referencing |

### Entidad `FriendRequest`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `int` PK | Identificador único |
| `sender` | `User` FK | Usuario que envía la solicitud |
| `receiver` | `User` FK | Usuario que recibe la solicitud |
| `status` | `enum` | `PENDING` / `ACCEPTED` / `REJECTED` |

---

## Seguridad

- Contraseñas hasheadas con **bcrypt** (salt rounds: 10)
- Autenticación **stateless** mediante JWT con expiración configurable
- Todas las rutas de juego protegidas con `JwtAuthGuard`
- Validación de saldo en el servidor **antes** de cualquier operación de juego
- El RNG de dados y ruleta se ejecuta **exclusivamente en el servidor**

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| NestJS | 10 | Framework backend modular |
| TypeScript | 5 | Tipado estático |
| TypeORM | 0.3 | ORM para PostgreSQL |
| PostgreSQL | 15 | Base de datos relacional |
| Socket.IO | 4 | WebSocket Gateway (ruleta) |
| Passport.js + JWT | - | Autenticación |
| bcrypt | - | Hash de contraseñas |
| Docker | - | Contenerización |

---

## Licencia

MIT — Proyecto académico (TFG) · 2025/2026
