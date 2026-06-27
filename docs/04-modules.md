# 04 — Modules Chi Tiết

> **Mô tả**: Chi tiết 36 module: chức năng, service, controller, entity liên quan, dependency nội bộ.

---

## 1. Sơ đồ phụ thuộc giữa các module

```
AppModule (root)
├── ConfigModule (@Global)
├── ScheduleModule (@Global)
├── TypeOrmModule (30 entities)
├── BullModule (queue, dùng RedisModule)
├── RedisModule (@Global)
│
├── AuthModule ──────────────→ UsersModule
├── UsersModule ─────────────→ (TypeORM: User)
├── AllCodesModule ──────────→ (TypeORM: AllCode)
├── RolesModule ─────────────→ (TypeORM: Role)
├── PermissionsModule ───────→ (TypeORM: Permission)
├── RolePermissionModule ────→ (TypeORM: RolePermission)
│
├── FilmsModule ─────────────→ (TypeORM: Film, FilmGenre, FilmImage)
│   ├── WatchGateway (WebSocket)
│   └── SyncViewsJob (Cron)
├── FilmDirectorModule ──────→ (TypeORM: FilmDirector)
├── FilmActorModule ─────────→ (TypeORM: FilmActor)
├── FilmProducerModule ──────→ (TypeORM: FilmProducer)
├── DirectorModule ──────────→ (TypeORM: Director)
├── ActorModule ─────────────→ (TypeORM: Actor)
├── ProducerModule ──────────→ (TypeORM: Producer)
├── PartsModule ─────────────→ (TypeORM: Part)
├── EpisodesModule ──────────→ (TypeORM: Episode)
│
├── CommentModule ───────────→ (TypeORM: Comment)
│   └── CommentGateway (WebSocket)
├── CommentReactionModule ───→ (TypeORM: CommentReaction)
├── RatingModule ────────────→ (TypeORM: Rating)
│   └── RatingGateway (WebSocket)
├── ReportModule ────────────→ (TypeORM: Report)
│   └── ReportGateway (WebSocket)
├── FavoritesModule ─────────→ (TypeORM: Favorite)
├── PlaylistsModule ─────────→ (TypeORM: Playlist)
├── PlaylistFilmModule ──────→ (TypeORM: PlaylistFilm)
├── NotificationsModule ─────→ (TypeORM: Notification)
│
├── SearchModule ────────────→ Elasticsearch
├── FileModule ──────────────→ Cloudinary + Bull Queue
│   └── FileProcessor (Bull worker)
├── VideoModule ─────────────→ Mux
│
├── SubscriptionsModule ─────→ (TypeORM: Subscription)
├── SubscriptionPlansModule ─→ (TypeORM: SubscriptionPlan)
├── PaymentsModule ──────────→ VNPay
├── EmailModule ─────────────→ Nodemailer
├── ChatbotModule ───────────→ Gemini AI
│
├── MarkdownsModule ─────────→ (TypeORM: Markdown)
├── CoWatchingModule ────────→ (TypeORM: RoomCoWatching) + Redis
└── DatabasesModule ─────────→ (Seed data)
```

---

## 2. Chi tiết từng module

### 2.1 AuthModule
- **Path**: `src/modules/auth/`
- **Controller**: `AuthController` — login, register, refreshToken, account, logout
- **Service**: `AuthService` — validateUser, login (tạo JWT), register, refreshToken, logout
- **Strategies**: `JwtStrategy` (passport-jwt), `LocalStrategy` (passport-local, usernameField=email)
- **Guard**: `JwtAuthGuard` (global), `LocalAuthGuard` (chỉ login)
- **Dependencies**: UsersModule, JwtModule, PassportModule
- **Điểm đặc biệt**: Refresh token lưu trong httpOnly cookie + DB column `users.refreshToken`. Token rotation khi refresh.

### 2.2 UsersModule
- **Path**: `src/modules/users/`
- **Controller**: `UsersController` — CRUD + phân trang
- **Service**: `UsersService` — create, findAll, findOne, update, remove (soft delete)
- **Entity**: `User`
- **DTO**: CreateUserDto, UpdateUserDto, QueryUserDto
- **Điểm đặc biệt**: Password hash với bcryptjs trước khi lưu.

### 2.3 FilmsModule
- **Path**: `src/modules/films/`
- **Controller**: `FilmsController` — CRUD, filter (by-country, by-genre, by-type), view tracking, VIP list, chart
- **Service**: `FilmsService` — business logic phim
- **Entities**: `Film`, `FilmGenre`, `FilmImage`
- **WebSocket**: `WatchGateway` — đồng bộ co-watching
- **Cron Job**: `SyncViewsJob` — sync view count từ Redis → PostgreSQL mỗi 2 phút
- **Điểm đặc biệt**: View tracking dùng Redis guard key (3-min cooldown/user/film) + pending counter.

### 2.4 DirectorModule, ActorModule, ProducerModule
- **Path**: `src/modules/directors/`, `src/modules/actor/`, `src/modules/producers/`
- **Pattern giống nhau**: CRUD + pagination, slug tự động từ fullName
- **Entities**: `Director`, `Actor`, `Producer`
- **Điểm đặc biệt**: Avatar upload qua Cloudinary (gọi FileModule).

### 2.5 FilmDirectorModule, FilmActorModule, FilmProducerModule
- **Path**: `src/modules/film_director/`, `src/modules/film_actor/`, `src/modules/film_producer/`
- **Model**: Many-to-many join tables giữa Film ↔ Director/Actor/Producer
- **FilmActor**: Có thêm cột `characterName` (tên nhân vật)

### 2.6 PartsModule, EpisodesModule
- **Path**: `src/modules/parts/`, `src/modules/episodes/`
- **Entities**: `Part` (mùa/phần), `Episode` (tập)
- **Relation**: Film 1→N Part 1→N Episode
- **Điểm đặc biệt**: Episode có `videoUrl` (Mux playback URL), `duration`.

### 2.7 CommentModule
- **Path**: `src/modules/comment/`
- **Controller**: `CommentsController` — CRUD + reply + hide/unhide
- **Service**: `CommentsService`
- **Entity**: `Comment` (có `parentId` để hỗ trợ reply lồng 1 cấp)
- **WebSocket**: `CommentGateway` — broadcast realtime comment mới/sửa/xóa/ẩn
- **Điểm đặc biệt**: Admin sockets map để gửi notification riêng.

### 2.8 CommentReactionModule
- **Path**: `src/modules/comment-reaction/`
- **Entity**: `CommentReaction` — type (like, love, haha, wow, sad, angry), userId, commentId

### 2.9 RatingModule
- **Path**: `src/modules/rating/`
- **Entity**: `Rating` — score (1-5), userId, filmId
- **WebSocket**: `RatingGateway` — broadcast khi có rating mới/sửa/xóa

### 2.10 ReportModule
- **Path**: `src/modules/report/`
- **Entity**: `Report` — reason, description, status (pending/resolved)
- **WebSocket**: `ReportGateway` — gửi notification tới admin khi có report mới

### 2.11 FavoritesModule
- **Path**: `src/modules/favorites/`
- **Entity**: `Favorite` — userId, filmId (unique constraint)

### 2.12 PlaylistsModule, PlaylistFilmModule
- **Path**: `src/modules/playlists/`, `src/modules/playlist-film/`
- **Entities**: `Playlist` (name, description, isPublic, userId), `PlaylistFilm` (playlistId, filmId)

### 2.13 NotificationsModule
- **Path**: `src/modules/notifications/`
- **Entity**: `Notification` — type, content, isRead, userId

### 2.14 SearchModule
- **Path**: `src/modules/search/`
- **Controller**: `SearchController` — search films/actors/directors/producers, sync indices
- **Service**: `SearchService` — Elasticsearch query, bulk sync
- **Dependencies**: Elasticsearch client (`@elastic/elasticsearch`)

### 2.15 FileModule
- **Path**: `src/modules/file/`
- **Controller**: `FileController` — upload (trực tiếp + qua queue)
- **Service**: `FileService` — upload lên Cloudinary
- **Processor**: `FileProcessor` — Bull worker xử lý upload async (5 concurrent)
- **Dependencies**: Cloudinary SDK, Bull queue (`file-upload`)

### 2.16 VideoModule
- **Path**: `src/modules/video/`
- **Controller**: `VideoController` — Mux upload URL, asset management
- **Service**: `VideoService` — Mux SDK wrapper (direct upload, get asset, delete, webhook)
- **Dependencies**: Mux SDK (`@mux/mux-node`)

### 2.17 PaymentsModule
- **Path**: `src/modules/payments/`
- **Controller**: `PaymentsController` — create VNPay URL, verify, query, refund
- **Service**: `PaymentsService` — VNPay integration (SHA512 HMAC signing, API calls)
- **Entity**: `Payment`
- **Dependencies**: axios, crypto (built-in), VNPay constants

### 2.18 SubscriptionsModule, SubscriptionPlansModule
- **Path**: `src/modules/subscriptions/`, `src/modules/subscription-plans/`
- **Entities**: `Subscription` (userId, planId, startDate, endDate, status), `SubscriptionPlan` (name, price, durationDays, features)
- **Business logic**: Khi thanh toán thành công → tạo subscription → cập nhật user role (VIP)

### 2.19 EmailModule
- **Path**: `src/modules/email/`
- **Controller**: `EmailController` — test endpoints
- **Service**: `EmailService` — gửi email qua Nodemailer
- **Templates**: Handlebars files trong `src/modules/email/templates/` (welcome, billing)
- **Dependencies**: `@nestjs-modules/mailer`, `handlebars`

### 2.20 ChatbotModule
- **Path**: `src/modules/chatbot/`
- **Controller**: `ChatbotController`
- **Service**: `ChatbotService` — phân tích câu hỏi người dùng, query database, gửi context cho Gemini AI, trả lời
- **Dependencies**: `@google/generative-ai` (Gemini)

### 2.21 CoWatchingModule
- **Path**: `src/modules/co-watching/`
- **Controller**: `CoWatchingController` — tạo phòng, join phòng
- **Entity**: `RoomCoWatching`
- **Dependencies**: Redis (lưu state phòng), `WatchGateway` (WebSocket sync)

### 2.22 MarkdownsModule
- **Path**: `src/modules/markdowns/`
- **Entity**: `Markdown` — type (terms, privacy, about...), content (HTML/Markdown)

### 2.23 RedisModule
- **Path**: `src/modules/redis/`
- **Decorator**: `@Global()` — có thể inject ở bất kỳ module nào
- **Service**: `RedisService` — wrapper quanh `ioredis` client
- **Cấu hình**: host, port, password, db từ env

### 2.24 RolesModule, PermissionsModule, RolePermissionModule
- **Path**: `src/modules/roles/`, `src/modules/permissions/`, `src/modules/role_permission/`
- **Pattern**: CRUD cho role và permission + mapping

### 2.25 AllCodesModule
- **Path**: `src/modules/all-codes/`
- **Entity**: `AllCode` — master lookup table
- **Controller**: `AllCodesController` — GET all codes (filter by type)

### 2.26 DatabasesModule
- **Path**: `src/databases/`
- **Chức năng**: Khởi tạo seed data khi app start
- **Service**: `DatabasesService.onModuleInit()` — check bảng trống → insert JSON seed

---

## 3. Quy tắc khi tạo module mới

1. Tuân theo cấu trúc thư mục chuẩn: `entities/`, `dto/`, controller, service, module.
2. Entity phải được thêm vào `entities` array trong `app.module.ts` TypeORM config.
3. Module phải được import vào `app.module.ts`.
4. Nếu cần auth: thêm `@Public()` cho route public, `@SkipCheckPermission()` nếu không cần permission check.
5. Response service trả về `{ EC: 0, EM: "Success", ...data }`.
6. Nếu có realtime: tạo Gateway trong thư mục `socket/`.
