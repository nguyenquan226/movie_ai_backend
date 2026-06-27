# 11 — Hướng Dẫn Setup Môi Trường Development

> **Mô tả**: Cài đặt, biến môi trường, Docker services, seed data, chạy app từ đầu.

---

## 1. Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu | Mục đích |
|---------|---------------------|----------|
| Node.js | 20+ | Runtime JavaScript |
| npm | 10+ | Package manager |
| Docker + Docker Compose | 24+ | Chạy PostgreSQL, Redis, Elasticsearch |
| Git | 2+ | Version control |

---

## 2. Clone & Cài đặt

```bash
# Clone repository
git clone <repo-url> ChillFlix_Backend
cd ChillFlix_Backend

# Cài đặt dependencies
npm install
# hoặc
make setup
```

---

## 3. Cấu hình biến môi trường

```bash
# Copy file mẫu
cp .env.example .env

# Sửa file .env với giá trị thực tế
nano .env
```

### Các biến bắt buộc để chạy được:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=mysecretpassword
DB_NAME=movie_database

# App
APP_PORT=8080

# JWT (tạo secret ngẫu nhiên)
ACCESS_TOKEN_SECRET=your-access-token-secret-key
ACCESS_TOKEN_expiresIn=1h
REFRESH_TOKEN_SECRET=your-refresh-token-secret-key
REFRESH_TOKEN_expiresIn=7d

# Docker Compose
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mysecretpassword
POSTGRES_DB=movie_database

# Seed
SHOULD_INIT=true
INIT_PASSWORD=Admin@123

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### Biến cho third-party (optional, chỉ cần khi dùng tính năng tương ứng):

```bash
# Cloudinary (upload ảnh)
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# VNPay (thanh toán)
VNP_TMN_CODE=your-tmn-code
VNP_HASH_SECRET=your-hash-secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_API=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNP_RETURN_URL=http://localhost:3000/payment/verify

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_AUTH_USER=your-email@gmail.com
EMAIL_AUTH_PASS=your-app-password

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## 4. Khởi động Docker Services

```bash
# Khởi động tất cả services
make services-up

# Hoặc từng service riêng lẻ:
docker compose --profile db up -d       # PostgreSQL
docker compose --profile cache up -d    # Redis
docker compose --profile search up -d   # Elasticsearch

# Kiểm tra services đã chạy
docker ps
```

**Ports sau khi khởi động**:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Elasticsearch: `localhost:9200`

---

## 5. Seed Database

```bash
# Đảm bảo SHOULD_INIT=true trong .env
# Khi chạy app lần đầu, seed data sẽ tự động được insert

# Hoặc chạy seed thủ công:
make seed
```

**Dữ liệu seed bao gồm**:
- AllCodes: toàn bộ lookup values (genre, country, role, status...)
- Roles: Admin (R1), Moderator (R2), User (R3)
- Permissions: Tất cả quyền API
- Role-Permissions: Admin có tất cả quyền
- Users: 1 admin user (password từ `INIT_PASSWORD` env)
- Subscription Plans: Các gói cơ bản

---

## 6. Chạy App

```bash
# Development mode (hot reload)
make dev
# hoặc
npm run start:dev

# Debug mode
make dev-debug
# hoặc
npm run start:debug

# Production mode
make build
make prod
# hoặc
npm run build
npm run start:prod
```

App chạy tại: `http://localhost:8080`

API base URL: `http://localhost:8080/api/v1`

---

## 7. Verify App Đã Chạy

```bash
# Health check
curl http://localhost:8080/

# Login với admin account
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@chillflix.com", "password": "Admin@123"}'

# Lấy danh sách all codes
curl http://localhost:8080/api/v1/all-codes
```

---

## 8. Cấu trúc thư mục cần biết

```
ChillFlix_Backend/
├── .env                          # Biến môi trường của bạn (đã sửa)
├── .env.example                  # Template tham khảo
├── Makefile                      # Các lệnh tiện ích
├── docker-compose.yml            # Docker services
├── src/
│   ├── main.ts                   # Entry point
│   ├── app.module.ts             # Root module
│   ├── databases/                # Seed data
│   │   └── seed-data/            # JSON seed files
│   └── modules/                  # 36 modules chức năng
└── docs_backend/                 # Tài liệu dự án (được generate)
```

---

## 9. Quy trình làm việc hàng ngày

```bash
# 1. Khởi động Docker services (nếu chưa chạy)
make services-up

# 2. Chạy app ở dev mode
make dev

# 3. Code...

# 4. Chạy tests
npm run test
npm run test:cov

# 5. Lint code
npm run lint

# 6. Format code
npm run format
```

---

## 10. Troubleshooting

### 10.1 Lỗi kết nối PostgreSQL

```bash
# Kiểm tra container đang chạy
docker ps | grep postgres

# Restart PostgreSQL
docker compose --profile db restart

# Kiểm tra log
docker logs postgres-db
```

### 10.2 Lỗi port đã được sử dụng

```bash
# Kiểm tra port đang dùng
sudo lsof -i :8080
sudo lsof -i :5432
sudo lsof -i :6379
sudo lsof -i :9200

# Kill process hoặc đổi port trong .env
```

### 10.3 Lỗi "Token is not valid"

- Kiểm tra `ACCESS_TOKEN_SECRET` trong `.env` đã được set.
- Token có thể đã hết hạn (`ACCESS_TOKEN_expiresIn`).
- Thử login lại để lấy token mới.

### 10.4 Seed data không chạy

- Kiểm tra `SHOULD_INIT=true` trong `.env`.
- Kiểm tra các bảng đã có data chưa (seed chỉ chạy khi bảng trống).
- Xem log console khi app start: `DatabasesService` sẽ log quá trình seed.

### 10.5 Elasticsearch không kết nối được

```bash
# Kiểm tra ES đã chạy chưa
curl http://localhost:9200

# Nếu chưa chạy
docker compose --profile search up -d

# Chờ ES khởi động (~30 giây)
# Kiểm tra health
curl http://localhost:9200/_cluster/health
```

---

## 11. Scripts hữu ích trong package.json

| Script | Mô tả |
|--------|-------|
| `npm run build` | Build TypeScript → JavaScript |
| `npm run start:dev` | Chạy dev với hot reload |
| `npm run start:debug` | Chạy dev với debugger |
| `npm run start:prod` | Chạy production |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |
| `npm run test` | Chạy unit tests |
| `npm run test:cov` | Tests với coverage |
| `npm run test:e2e` | Chạy e2e tests |
