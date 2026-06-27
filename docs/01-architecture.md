# 01 — Kiến Trúc Tổng Thể (Architecture)

> **Mô tả**: Cây thư mục, pattern NestJS, luồng request, global middleware/guard/interceptor/pipe.

---

## 1. Cây thư mục tổng quan

```
ChillFlix_Backend/
├── .env                          # Biến môi trường active
├── .env.example                  # Template biến môi trường (có key, không có value)
├── .prettierrc                   # Cấu hình Prettier
├── Makefile                      # CLI wrapper (docker, dev, test, lint, setup...)
├── docker-compose.yml            # PostgreSQL 17 + Redis 7.4 + Elasticsearch 8.15
├── nest-cli.json                 # NestJS CLI config
├── tsconfig.json                 # TypeScript config (NodeNext, ES2023)
├── tsconfig.build.json           # TypeScript build config (exclude test files)
├── eslint.config.mjs             # ESLint config
├── package.json                  # Dependencies & scripts
├── public/                       # Static assets
├── uploads/                      # Thư mục tạm cho file upload (Bull queue)
├── dist/                         # Build output (TypeScript → JavaScript)
├── agent/                        # Tài liệu nội bộ cho agent (schema DB, migration plan, seed plan)
│   ├── database/
│   │   ├── schema.md
│   │   ├── id_type_recommendation.md
│   │   └── seed/                 # Các plan seed data
│   └── ...
└── src/
    ├── main.ts                   # App bootstrap: guards, interceptors, pipes, CORS, versioning
    ├── app.module.ts             # Root module: import tất cả module, cấu hình TypeORM, Bull, Schedule
    ├── app.controller.ts         # Root controller (GET /)
    ├── app.service.ts            # Root service
    │
    ├── config/                   # Cấu hình nội bộ
    │   ├── bull.config.ts        # Bull queue config (Redis, retry, backoff)
    │   └── multer.config.ts      # Multer config (memoryStorage, filter ảnh, 5MB limit)
    │
    ├── constants/                # Hằng số toàn cục
    │   ├── allcode.constant.ts   # Role enum (ADMIN=1, MODERATOR=2, USER=3), Gender
    │   └── vnpay.constant.ts     # Mã trạng thái & message VNPay
    │
    ├── cores/                    # Core services dùng chung
    │   ├── startup-banner.service.ts  # In banner khởi động (version, env, health checks)
    │   └── transform.interceptor.ts   # Global response interceptor (unwrap EC/EM)
    │
    ├── common/utils/             # Utilities dùng chung
    │   ├── CommonField.ts        # AllCode common fields cho query join
    │   ├── generatekeyMap.ts     # Sinh keyMap từ value
    │   ├── join-allcode.ts       # QueryBuilder helper join AllCode
    │   └── slug.util.ts          # Sinh slug từ string
    │
    ├── databases/                # Module khởi tạo database (seed)
    │   ├── databases.module.ts
    │   ├── databases.service.ts  # OnModuleInit → seed allcodes, roles, users, permissions
    │   ├── helpers/
    │   │   └── seed-data.loader.ts  # Load JSON seed files
    │   └── seed-data/            # Dữ liệu seed dạng JSON
    │       ├── allcodes.json
    │       ├── permissions.json
    │       ├── role-permissions.json
    │       ├── roles.json
    │       ├── subscription-plans.json
    │       └── users.json
    │
    ├── decorators/               # Custom decorators
    │   ├── customize.ts          # @Public, @User, @ResponseMessage, @SkipCheckPermission
    │   └── permission.decorator.ts  # @Permission(name, module)
    │
    └── modules/                  # 36 module chức năng (xem 04-modules.md)
        ├── actor/
        ├── all-codes/
        ├── auth/
        ├── chatbot/
        ├── co-watching/
        ├── comment/
        ├── comment-reaction/
        ├── directors/
        ├── email/
        ├── episodes/
        ├── favorites/
        ├── file/
        ├── film_actor/
        ├── film_director/
        ├── film_producer/
        ├── films/
        ├── markdowns/
        ├── notifications/
        ├── parts/
        ├── payments/
        ├── permissions/
        ├── playlist-film/
        ├── playlists/
        ├── producers/
        ├── rating/
        ├── redis/
        ├── report/
        ├── role_permission/
        ├── roles/
        ├── search/
        ├── subscription-plans/
        ├── subscriptions/
        ├── users/
        └── video/
```

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js (TypeScript → JavaScript qua NestJS CLI) |
| **Framework** | NestJS 11 (Express adapter) |
| **Database** | PostgreSQL 17 (TypeORM 0.3.27, `synchronize: true`) |
| **Cache** | Redis 7.4 (ioredis) |
| **Queue** | Bull (backed by Redis) |
| **Search** | Elasticsearch 8.15 |
| **Auth** | Passport (JWT + Local strategy), bcryptjs |
| **Realtime** | Socket.IO (WebSocket) |
| **Scheduler** | @nestjs/schedule (cron jobs) |
| **Email** | Nodemailer + Handlebars templates |
| **File Storage** | Cloudinary (ảnh), Mux (video) |
| **AI** | Google Gemini (chatbot) |
| **Payment** | VNPay (custom integration, HMAC SHA512) |

---

## 3. Luồng xử lý request HTTP

```
HTTP Request
    │
    ▼
┌─────────────────────┐
│  Cookie Parser      │  ← cookie-parser middleware
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  CORS               │  ← app.enableCors({ origin: true, credentials: true })
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  ValidationPipe     │  ← Global pipe (transform, whitelist, forbidNonWhitelisted)
└─────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  JwtAuthGuard (Global Guard)        │
│  ┌─────────────────────────────┐    │
│  │ 1. Check @Public()          │─── ✅ Bỏ qua auth
│  │ 2. Validate JWT token       │    │
│  │ 3. Check permissions        │    │
│  │    - /api/v1/auth/* → pass  │    │
│  │    - @SkipCheckPermission   │    │
│  │    - Match apiPath + method │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
    │
    ▼
┌──────────────────────┐
│  Controller          │  ← Route handler
└──────────────────────┘
    │
    ▼
┌──────────────────────┐
│  Service             │  ← Business logic
└──────────────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│  TransformInterceptor (Global)       │
│  ┌──────────────────────────────┐    │
│  │ if response has {EC, EM}:    │    │
│  │   return { statusCode,       │    │
│  │            message,          │    │
│  │            EC, EM,           │    │
│  │            data: rest }      │    │
│  │ else:                        │    │
│  │   return { statusCode,       │    │
│  │            message,          │    │
│  │            data }            │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
    │
    ▼
HTTP Response (JSON)
```

---

## 4. Global Components (khởi tạo trong `main.ts`)

| Component | Type | Mục đích |
|-----------|------|----------|
| `JwtAuthGuard` | Global Guard | Xác thực JWT + phân quyền cho tất cả route |
| `TransformInterceptor` | Global Interceptor | Chuẩn hóa response format (EC/EM envelope) |
| `ValidationPipe` | Global Pipe | Validate + transform input (whitelist, forbidNonWhitelisted) |
| `cookieParser()` | Middleware | Parse cookie (dùng cho refresh token) |
| `enableCors()` | Middleware | CORS với credentials |
| `setGlobalPrefix('api')` | Prefix | Tất cả route có prefix `/api` |
| `enableVersioning()` | Versioning | URI versioning: `/api/v1/...`, `/api/v2/...` |

---

## 5. Pattern tổ chức Module

Mỗi module trong `src/modules/<ten-module>/` tuân theo cấu trúc chuẩn của NestJS:

```
<ten-module>/
├── <ten-module>.module.ts       # NestJS Module (imports, controllers, providers, exports)
├── <ten-module>.controller.ts   # Route handlers (hoặc thư mục controllers/)
├── <ten-module>.service.ts      # Business logic (hoặc thư mục services/)
├── entities/                    # TypeORM Entity
│   └── <ten-entity>.entity.ts
├── dto/                         # Data Transfer Objects (create, update, query)
│   ├── create-<ten>.dto.ts
│   ├── update-<ten>.dto.ts
│   └── query-<ten>.dto.ts
├── repositories/                # (optional) Custom repository nếu có
├── guards/                      # (optional) Module-specific guards
├── socket/                      # (optional) WebSocket Gateway
├── jobs/                        # (optional) Bull queue processor hoặc cron job
└── pipes/                       # (optional) Custom pipes
```

---

## 6. Dependency Injection

- Tất cả service, repository, config đều dùng DI của NestJS.
- `ConfigService` được import global (`isGlobal: true` trong `ConfigModule.forRoot()`).
- `RedisModule` được đánh dấu `@Global()` — có thể inject `RedisService` ở bất kỳ module nào mà không cần import lại.
- `BullModule.forRootAsync()` dùng chung Redis connection từ `RedisModule`.

---

## 7. Xử lý lỗi

- NestJS exception filter mặc định xử lý `HttpException` (bao gồm `BadRequestException`, `NotFoundException`, `ForbiddenException`, `UnauthorizedException`).
- Service trả về object chứa `EC` (error code) và `EM` (error message), `TransformInterceptor` unwrap và đặt vào response envelope.
- Không có custom exception filter toàn cục — dùng mặc định của NestJS.
