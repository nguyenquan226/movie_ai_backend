# CLAUDE.md — ChillFlix Backend

> **Dự án**: ChillFlix Backend — REST API cho nền tảng xem phim trực tuyến
> **Framework**: NestJS 11 (Express) + TypeScript
> **Database**: PostgreSQL 17 + Redis 7.4 + Elasticsearch 8.15
> **Ngày tạo**: 2025-06-27

---

## Mục Lục

1. [General Rules](#general-rules)
2. [Thông Tin Dự Án](#thông-tin-dự-án)
3. [Cách Làm Việc Với Dự Án](#cách-làm-việc-với-dự-án)
4. [Tài Liệu Chi Tiết](#tài-liệu-chi-tiết)
5. [Quy Tắc Code](#quy-tắc-code)
6. [Quy Tắc Git](#quy-tắc-git)

---

## General Rules

### Quy tắc chung khi Claude làm việc với dự án này

1. **Ngôn ngữ giao tiếp**: Giao tiếp với người dùng bằng **tiếng Việt**. Code, comment trong code, và commit message viết bằng **tiếng Anh**.

2. **Trước khi viết code**:
   - Đọc các file docs liên quan trong `docs/` để hiểu ngữ cảnh.
   - Nếu không chắc chắn về kiến trúc hoặc pattern, hỏi người dùng trước khi làm.
   - Với task phức tạp (nhiều file, thay đổi kiến trúc), dùng `EnterPlanMode` để lập kế hoạch trước.

3. **Khi viết code**:
   - Tuân theo cấu trúc module chuẩn của dự án: `entities/`, `dto/`, controller, service, module.
   - Response từ service luôn trả về `{ EC: 0, EM: "Success", ...data }`.
   - Inject repository qua `@InjectRepository(Entity)` — không dùng custom repository pattern.
   - Sử dụng `class-validator` decorators cho DTO validation.
   - Sử dụng `class-transformer` để transform response.
   - Import sử dụng `src/` alias (configured trong tsconfig).
   - Các route public phải có `@Public()` decorator.
   - Các route cần auth nhưng không cần permission check: `@SkipCheckPermission()`.

4. **Sau khi viết code**:
   - Chạy `npm run lint` để kiểm tra code style.
   - Chạy `npm run build` để đảm bảo code compile thành công.
   - Chạy tests liên quan nếu có.
   - Báo cáo kết quả cho người dùng.

5. **Tuyệt đối không**:
   - Không thay đổi `synchronize: true` trong TypeORM config (trừ khi được yêu cầu).
   - Không xóa dữ liệu thật trong database mà không có backup.
   - Không thay đổi `keyMap` của AllCode đã tồn tại.
   - Không commit file `.env` (đã có trong `.gitignore`).
   - Không thay đổi structure của response envelope `{ statusCode, EC, EM, data }`.
   - Không tự ý thêm dependencies mới mà không hỏi người dùng.

---

## Thông Tin Dự Án

### Tổng quan

- **Tên**: ChillFlix Backend
- **Version**: 0.0.1
- **Loại**: REST API cho nền tảng streaming phim
- **Framework**: NestJS 11 (Express adapter)
- **Language**: TypeScript 5.x, target ES2023, module NodeNext
- **Database**: PostgreSQL 17 (TypeORM 0.3.27, synchronize mode)
- **Cache**: Redis 7.4 (ioredis)
- **Search**: Elasticsearch 8.15
- **Queue**: Bull (backed by Redis)
- **Realtime**: Socket.IO (4 gateways)
- **Package Manager**: npm

### Các modules chính (36 modules)

| Nhóm | Modules |
|------|---------|
| **Auth** | `auth` (JWT + Local strategy), `roles`, `permissions`, `role_permission` |
| **Content** | `films`, `directors`, `actor`, `producers`, `film_director`, `film_actor`, `film_producer`, `parts`, `episodes` |
| **Social** | `comment`, `comment-reaction`, `rating`, `report`, `favorites`, `playlists`, `playlist-film`, `notifications` |
| **Payment** | `subscriptions`, `subscription-plans`, `payments` (VNPay) |
| **Infrastructure** | `redis` (@Global), `file` (Cloudinary), `video` (Mux), `search` (Elasticsearch), `email` (Nodemailer), `chatbot` (Gemini AI), `markdowns`, `co-watching` |
| **System** | `all-codes`, `users`, `app` (root) |

### Tech Stack đầy đủ

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + NestJS 11 (Express) |
| Language | TypeScript (NodeNext, ES2023) |
| ORM | TypeORM 0.3.27 (`synchronize: true`) |
| Database | PostgreSQL 17 |
| Cache | Redis 7.4 (ioredis) |
| Queue | Bull 4.16.5 |
| Search | Elasticsearch 8.15 |
| Auth | Passport (JWT + Local), bcryptjs |
| Realtime | Socket.IO (WebSocket) |
| Scheduler | @nestjs/schedule (cron) |
| Email | Nodemailer + Handlebars templates |
| Image Storage | Cloudinary |
| Video Streaming | Mux |
| AI | Google Gemini |
| Payment | VNPay (custom HMAC SHA512) |
| Validation | class-validator + class-transformer |
| Testing | Jest |
| Linting | ESLint + Prettier |

### Cấu trúc thư mục chính

```
src/
├── main.ts                   # Bootstrap: guards, interceptors, pipes, CORS, versioning
├── app.module.ts             # Root module: tất cả imports, TypeORM, Bull, Schedule
├── config/                   # Bull config, Multer config
├── constants/                # AllCode constants, VNPay constants
├── cores/                    # Startup banner, TransformInterceptor
├── common/utils/             # Shared helpers (slug, join-allcode, CommonField)
├── databases/                # Seed module + seed-data JSON files
├── decorators/               # @Public, @User, @ResponseMessage, @SkipCheckPermission, @Permission
└── modules/                  # 36 feature modules (mỗi module trong thư mục riêng)
```

---

## Cách Làm Việc Với Dự Án

### Khởi động môi trường development

```bash
# 1. Khởi động Docker services
make services-up
# PostgreSQL: localhost:5432
# Redis: localhost:6379
# Elasticsearch: localhost:9200

# 2. Chạy app ở dev mode
make dev
# App: http://localhost:8080
# API: http://localhost:8080/api/v1

# 3. Verify
curl http://localhost:8080/
```

### Các lệnh thường dùng

```bash
make dev              # Chạy dev với hot reload
make build            # Build production
make prod             # Chạy production
make test             # Chạy unit tests
make test-cov         # Tests với coverage
make lint             # ESLint check
make format           # Prettier format
make services-up      # Khởi động Docker services
make services-down    # Dừng Docker services
```

### Pattern cơ bản khi thêm tính năng mới

1. Tạo thư mục module trong `src/modules/<ten-module>/`
2. Tạo entity trong `entities/`, DTO trong `dto/`
3. Tạo service (business logic), controller (routes), module (NestJS module)
4. Đăng ký entity trong `app.module.ts` (TypeORM `entities` array)
5. Import module vào `app.module.ts`
6. Thêm permission tương ứng vào seed data nếu cần

### Quy ước response

```typescript
// Service return
return {
  EC: 0,                    // Error code (0 = success)
  EM: 'Success',            // Error message
  // ... data fields        // Payload
};

// TransformInterceptor sẽ tự động wrap thành:
{
  "statusCode": 200,
  "message": "",
  "EC": 0,
  "EM": "Success",
  "data": {
    // ... data fields (không có EC, EM)
  }
}
```

---

## Tài Liệu Chi Tiết

Toàn bộ tài liệu chi tiết của dự án được lưu tại: **`docs/`**

Trước khi làm bất kỳ task nào, Claude phải đọc file docs tương ứng để hiểu ngữ cảnh đầy đủ.

### Danh sách file tài liệu

| # | File | Đường dẫn | Mô tả |
|---|------|-----------|-------|
| 00 | **Index** | `docs/00-index.md` | Mục lục tổng quan, hướng dẫn đọc tài liệu theo nhu cầu |
| 01 | **Architecture** | `docs/01-architecture.md` | Kiến trúc tổng thể: cây thư mục đầy đủ, tech stack, luồng request HTTP qua global guard/interceptor/pipe, pattern tổ chức module, dependency injection |
| 02 | **API Overview** | `docs/02-api-overview.md` | Tổng quan API: versioning (`/api/v1`), response convention (EC/EM envelope), danh sách toàn bộ 34 controller với endpoint, method, auth requirement, pagination format, query filter |
| 03 | **Database** | `docs/03-database.md` | Database: TypeORM config (`synchronize: true`), 30 entity chia 7 nhóm (users/auth, film core, cast/crew, content, social, payment, other), pattern AllCode master lookup table, primary key strategy (UUID + numeric), audit/soft-delete columns, seed data mechanism, entity relationship diagram |
| 04 | **Modules** | `docs/04-modules.md` | Chi tiết 36 module: sơ đồ phụ thuộc, mô tả chức năng, service, controller, entity, dependencies nội bộ của từng module. Quy tắc tạo module mới |
| 05 | **Auth** | `docs/05-authentication-authorization.md` | Authentication & Authorization: flow đăng nhập/refresh/logout/register, JWT payload structure, JwtAuthGuard global (canActivate + handleRequest), LocalAuthGuard, permission system (apiPath + method matching), custom decorators (`@Public`, `@SkipCheckPermission`, `@User`, `@ResponseMessage`), role mặc định |
| 06 | **Third-Party** | `docs/06-third-party-integrations.md` | Tích hợp bên thứ ba: Cloudinary (image upload + queue), Mux Video (direct upload + webhook + HLS streaming), VNPay (HMAC SHA512 payment flow), Elasticsearch (indices + bulk sync + full-text search), Gemini AI (chatbot with DB context), Nodemailer (Handlebars templates), Redis (cache/view buffer/co-watching state), Bull (queue config + retry), Puppeteer |
| 07 | **Configuration** | `docs/07-configuration.md` | Cấu hình: toàn bộ biến môi trường (11 nhóm: database, docker, app, JWT, Cloudinary, VNPay, email, Gemini, ES, Redis, Mux), file config nội bộ (Bull config với exponential backoff, Multer config với memoryStorage + 5MB limit), constants (AllCode roles, VNPay response codes), TypeScript config, CORS config, ValidationPipe config |
| 08 | **Infrastructure** | `docs/08-infrastructure.md` | Hạ tầng: Docker Compose services (PostgreSQL 17, Redis 7.4-alpine, Elasticsearch 8.15 - profiles), Bull queue architecture (file-upload queue, 5 concurrent workers, retry config), cron job (SyncViewsJob mỗi 2 phút: Redis → PostgreSQL), Makefile commands (416 dòng, 4 nhóm: docker/dev/build/test/setup/db), network architecture diagram, không có CI/CD |
| 09 | **WebSocket** | `docs/09-websocket-realtime.md` | WebSocket & Realtime: 4 Gateway (WatchGateway - co-watching sync play/pause/seek, CommentGateway - realtime comment/reply/reaction, RatingGateway - realtime rating/hide, ReportGateway - admin report notification), event lists, socket maps (adminSockets, userSockets), room management, không có WebSocket auth (cần thêm nếu muốn) |
| 10 | **Business Rules** | `docs/10-business-rules.md` | Business rules: RBAC (Admin/Moderator/User + permission check per apiPath+method), subscription/payment flow (VNPay → Subscription → VIP role), soft delete pattern, view counting (Redis buffer + guard key 3-min cooldown + cron sync 2-min), comment hierarchy (1 cấp reply), rating rules (1/user/film), file upload rules (ảnh: jpeg/png/gif 5MB, video: Mux direct upload), slug generation, search indexing, co-watching room lifecycle, AllCode lookup rules |
| 11 | **Setup Guide** | `docs/11-setup-development.md` | Hướng dẫn setup môi trường dev: yêu cầu hệ thống, clone & install, cấu hình .env (bắt buộc + optional), Docker services, seed database, chạy app, verify, cấu trúc thư mục, quy trình làm việc hàng ngày, troubleshooting (PostgreSQL, port, token, seed, ES) |

### Cách sử dụng tài liệu

- **Developer mới**: Đọc theo thứ tự `11 → 01 → 02 → 05` (setup → kiến trúc → API → auth)
- **Làm việc với database**: Đọc `03-database.md` và `10-business-rules.md` (phần AllCode)
- **Tích hợp bên thứ ba**: Đọc `06-third-party-integrations.md`
- **Làm việc với realtime**: Đọc `09-websocket-realtime.md`
- **Triển khai / DevOps**: Đọc `08-infrastructure.md` và `07-configuration.md`
- **Thêm module mới**: Đọc `04-modules.md` (quy tắc ở cuối file)

---

## Quy Tắc Code

### NestJS Conventions

1. **Module structure**: Mỗi module trong `src/modules/<ten>/` gồm:
   - `<ten>.module.ts` — NestJS module definition
   - `<ten>.controller.ts` — Route handlers
   - `<ten>.service.ts` — Business logic
   - `entities/<entity>.entity.ts` — TypeORM entities
   - `dto/create-<entity>.dto.ts` — Create DTO
   - `dto/update-<entity>.dto.ts` — Update DTO
   - `dto/query-<entity>.dto.ts` — Query DTO (optional)
   - `socket/<name>.gateway.ts` — WebSocket gateway (optional)
   - `jobs/<name>.job.ts` — Cron job hoặc Bull processor (optional)

2. **Naming conventions**:
   - File: kebab-case (`film-actor.controller.ts`)
   - Class: PascalCase (`FilmActorController`)
   - Method: camelCase (`findByGenre`)
   - Variable: camelCase (`filmId`)
   - Database column: snake_case (TypeORM tự map từ camelCase entity property)
   - Table name: snake_case (entity name → TypeORM tự sinh)

3. **Import conventions**:
   - Dùng `src/` alias cho internal imports: `import { X } from 'src/modules/...'`
   - KHÔNG dùng relative paths kiểu `../../modules/...`

4. **Decorator usage**:
   - Mọi controller method public phải có `@Public()`
   - Method cần auth nhưng không cần permission: `@SkipCheckPermission()`
   - Response message tùy chỉnh: `@ResponseMessage('message')`
   - Lấy current user: `@User() user: IUser`

5. **Validation**:
   - DTO dùng `class-validator` decorators (`@IsString()`, `@IsEmail()`, `@IsOptional()`, ...)
   - Global `ValidationPipe` tự động validate + transform + whitelist

6. **Response format**:
   - Luôn trả về `{ EC: number, EM: string, ...data }` từ service
   - Không tự set HTTP status code trong service (dùng NestJS exceptions)

### TypeORM Conventions

1. Entity phải được thêm vào `entities` array trong `app.module.ts`.
2. Dùng `@PrimaryGeneratedColumn('uuid')` cho entity mới.
3. Entity quan hệ nhiều-nhiều dùng join table entity riêng (vd: `FilmGenre`, `FilmActor`).
4. AllCode references: dùng `@ManyToOne(() => AllCode)` + `@JoinColumn({ referencedColumnName: 'keyMap' })`.
5. Soft delete: set `isDeleted = true` hoặc `deletedAt = new Date()`.

### Security Conventions

1. Password luôn hash với `bcryptjs` trước khi lưu.
2. JWT secret lấy từ `ConfigService` — không hardcode.
3. Refresh token lưu trong httpOnly cookie + database.
4. Permission check dựa trên `apiPath` + `method` match.
5. Không expose password hash hoặc refresh token trong API response.

---

## Quy Tắc Git

### Commit Message Format

```
<type>(<scope>): <short description>

<detailed description (optional)>
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `perf`, `ci`

**Examples**:
```
feat(films): add filter by multiple genres
fix(auth): handle expired refresh token gracefully
refactor(database): migrate seeds from TypeScript to JSON
docs(api): add films endpoint documentation
```

### Branch Naming

```
<type>/<short-description>
```

**Examples**: `feat/user-favorites`, `fix/comment-pagination`, `refactor/uuid-primary-keys`

### Quy tắc commit

- Không commit file `.env`.
- Không commit `node_modules/`, `dist/`, `uploads/`.
- Commit message viết bằng tiếng Anh.
- Mỗi commit nên tập trung vào một thay đổi logic duy nhất.
- Chạy `npm run lint` trước khi commit.

---

## Ghi Chú

- **Document version**: 1.0
- **Last updated**: 2025-06-27
- **Maintained by**: Nguyen Hong Quan
- **Docs location**: `docs/`

Nếu phát hiện tài liệu lỗi thời hoặc thiếu, hãy cập nhật file docs tương ứng trong `docs/` và cập nhật reference trong file `CLAUDE.md` này.
