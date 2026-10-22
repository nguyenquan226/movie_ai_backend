# 08 — Hạ Tầng (Infrastructure)

> **Mô tả**: Docker Compose services, Bull queue, cron job (Schedule), Makefile commands.

## 0. App image and CI

`Dockerfile` builds the Nest app in multiple stages and keeps only production dependencies and `dist/` in the runtime image. GitHub Actions runs lint, build, unit tests, and HTTP end-to-end tests for pushes and pull requests. Required runtime configuration is supplied through environment variables; secrets do not belong in the image.

The `GET /api/v1/films` filter list uses a 60-second Redis cache keyed by filters, sort, page, and page size. Film create/update/delete invalidates the list keys. Redis errors fall back to PostgreSQL. The relation integration test seeds 1,000 films and captures `EXPLAIN (ANALYZE, BUFFERS)` for selected joins across films, genres, and actors. It runs against an isolated `*_test` database in CI.

`GET /api/v1/health` checks PostgreSQL and Redis. Request logs are structured JSON and carry `x-request-id`; Swagger UI is available at `/api/docs`.

Bull retries file uploads with exponential backoff. Each retry uses the same job ID as its Cloudinary public ID, preventing retries from creating a new asset for the same job. Soft-deleted users, roles, permissions, role-permission links, and the existing content entities now use TypeORM delete-date metadata so normal reads consistently exclude deleted records; role restore explicitly opts into deleted rows.

---

## 1. Docker Compose Services

**File**: `docker-compose.yml`

Tất cả service đều dùng `profiles` — không tự động chạy khi `docker compose up`, phải chỉ định profile.

### 1.1 PostgreSQL

```yaml
postgres:
  image: postgres:17
  container_name: postgres-db
  restart: unless-stopped
  profiles: [db]
  ports: ['5432:5432']
  volumes: [pgdata:/var/lib/postgresql/data]
  healthcheck:
    test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-postgres}']
```

**Khởi động**:
```bash
docker compose --profile db up -d
# hoặc
make db-up
```

### 1.2 Redis

```yaml
redis:
  image: redis:7.4-alpine
  container_name: redis-db
  restart: unless-stopped
  profiles: [cache]
  ports: ['6379:6379']
  volumes: [redisdata:/data]
  command: ['redis-server', '--appendonly', 'yes']  # Persist AOF
  healthcheck:
    test: ['CMD', 'redis-cli', 'ping']
```

**Khởi động**:
```bash
docker compose --profile cache up -d
# hoặc
make redis-up
```

### 1.3 Elasticsearch

```yaml
elasticsearch:
  image: elasticsearch:8.15.0
  container_name: elasticsearch
  restart: unless-stopped
  profiles: [search]
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false    # KHÔNG bật bảo mật
    - ES_JAVA_OPTS=-Xms512m -Xmx512m  # Giới hạn heap 512MB
  ports: ['9200:9200', '9300:9300']
  volumes: [esdata:/usr/share/elasticsearch/data]
  mem_limit: 1g
```

**Khởi động**:
```bash
docker compose --profile search up -d
# hoặc
make es-up
```

### 1.4 Khởi động tất cả services cùng lúc

```bash
docker compose --profile db --profile cache --profile search up -d
# hoặc
make services-up
```

---

## 2. Bull Job Queue

### 2.1 Kiến trúc

```
App ──────→ Redis ──────→ Bull Queue ──────→ Processor (Worker)
             │                                    │
             │   ┌──────────────────────┐         │
             └───│ file-upload queue    │─────────┘
                 │ jobs: process-upload │   FileProcessor
                 │ concurrency: 5       │   (5 workers)
                 └──────────────────────┘
```

### 2.2 Cấu hình retry

| Setting | Giá trị | Mô tả |
|---------|---------|-------|
| `attempts` | 3 | Số lần retry tối đa |
| `backoff.type` | `exponential` | Chiến lược backoff |
| `backoff.delay` | 2000ms | Delay ban đầu, sau đó ×2 mỗi lần |
| `removeOnComplete` | 100 | Giữ 100 job thành công gần nhất |
| `removeOnFail` | 50 | Giữ 50 job thất bại gần nhất |

### 2.3 File Upload Queue

```
Queue: file-upload
Processor: FileProcessor (src/modules/file/file.processor.ts)
Concurrency: 5

Job data:
{
  buffer: Buffer,       // Nội dung file
  originalname: string, // Tên file gốc
  mimetype: string      // MIME type
}

Progress events:
  20% - File đã được ghi ra temp
  40% - Đang upload lên Cloudinary
  60% - Upload hoàn tất
  100% - Temp file đã được dọn dẹp

Kết quả:
{
  url: string,          // Cloudinary secure_url
  publicId: string      // Cloudinary public_id
}
```

---

## 3. Cron Job (Schedule)

Dùng `@nestjs/schedule` (`ScheduleModule.forRoot()` trong `AppModule`).

### 3.1 SyncViewsJob

- **File**: `src/modules/films/jobs/sync-view.job.ts`
- **Schedule**: `@Cron('*/2 * * * *')` — chạy mỗi 2 phút
- **Mục đích**: Đồng bộ lượt xem từ Redis → PostgreSQL

**Luồng**:
```
1. Mỗi 2 phút
2. Quét Redis keys: view:film:*:pending
3. Với mỗi key:
   - Lấy số view pending từ Redis
   - Update PostgreSQL: UPDATE film SET view = view + pending WHERE id = filmId
   - Xóa key Redis
4. Done
```

**Tại sao dùng Redis buffer**:
- Giảm tải write PostgreSQL (nếu mỗi view ghi 1 lần → hàng ngàn write/giây)
- Redis INCR là atomic, nhanh hơn PostgreSQL UPDATE
- 2 phút sync là chấp nhận được cho view count

---

## 4. Makefile Commands

**File**: `Makefile` (416 dòng)

### 4.1 Các nhóm lệnh

| Nhóm | Lệnh | Mô tả |
|------|------|-------|
| **Docker** | `make services-up` | Khởi động tất cả Docker services |
| | `make services-down` | Dừng tất cả Docker services |
| | `make db-up` | Khởi động PostgreSQL |
| | `make redis-up` | Khởi động Redis |
| | `make es-up` | Khởi động Elasticsearch |
| **Dev** | `make dev` | Chạy app ở chế độ development |
| | `make dev-debug` | Chạy dev với debugger |
| **Build** | `make build` | Build TypeScript → JavaScript |
| **Prod** | `make prod` | Chạy app ở chế độ production |
| **Test** | `make test` | Chạy unit tests |
| | `make test-cov` | Chạy tests với coverage report |
| | `make test-e2e` | Chạy e2e tests |
| **Lint** | `make lint` | Chạy ESLint |
| | `make format` | Chạy Prettier format |
| **Setup** | `make setup` | Cài đặt dependencies + copy .env |
| | `make fresh` | Xóa node_modules + cài lại + build lại |
| **DB** | `make db-reset` | Reset database (xóa + tạo lại schema) |
| | `make seed` | Chạy seed data thủ công |

### 4.2 Cách dùng phổ biến

```bash
# Lần đầu setup
make setup           # npm install + copy .env.example → .env
make services-up     # Khởi động PostgreSQL, Redis, ES
make dev             # Chạy app ở port 8080

# Hàng ngày
make dev             # Chạy app (services đã chạy sẵn)
make test            # Chạy tests
make lint            # Check code style

# Reset hoàn toàn
make fresh           # Cài lại dependencies
make services-down   # Dừng docker
make services-up     # Khởi động lại docker (data volume vẫn giữ)
```

---

## 5. Không có CI/CD

- **Không có** GitHub Actions, GitLab CI, Jenkins pipeline.
- **Không có** Dockerfile cho app (chỉ có docker-compose cho services).
- **Không có** deployment scripts.
- App được chạy trực tiếp qua `npm run start:prod` hoặc `make prod`.

---

## 6. Network Architecture (tổng quan)

```
                    ┌──────────┐
                    │  Client  │ (Browser / Mobile App)
                    └────┬─────┘
                         │
                    ┌────▼─────────────────────┐
                    │  NestJS App (port 8080)  │
                    │  ┌─────────────────────┐ │
                    │  │ HTTP REST API       │ │
                    │  │ WebSocket (Socket.IO)│ │
                    │  └─────────────────────┘ │
                    └──┬───┬───┬───┬───┬──────┘
                       │   │   │   │   │
          ┌────────────┘   │   │   │   └──────────────┐
          ▼                │   │   │                  ▼
   ┌──────────────┐        │   │   │         ┌──────────────┐
   │ PostgreSQL   │        │   │   │         │ Elasticsearch│
   │ (port 5432)  │        │   │   │         │ (port 9200)  │
   └──────────────┘        │   │   │         └──────────────┘
                           ▼   │   ▼
                    ┌──────────┐│┌──────────┐
                    │ Redis    │││ Bull      │
                    │(port 6379)│││ Queue     │
                    └──────────┘│└───────────┘
                                │
               ┌────────────────┼────────────────┐
               ▼                ▼                ▼
        ┌──────────┐   ┌──────────────┐  ┌──────────┐
        │Cloudinary│   │ Mux Video    │  │ VNPay    │
        │(Images)  │   │ (Streaming)  │  │ (Payment)│
        └──────────┘   └──────────────┘  └──────────┘
               │                │
               ▼                ▼
        ┌──────────┐   ┌──────────────┐
        │ Nodemailer│  │ Gemini AI    │
        │ (Email)   │   │ (Chatbot)   │
        └──────────┘   └──────────────┘
```
