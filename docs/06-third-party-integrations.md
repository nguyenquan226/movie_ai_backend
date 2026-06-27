# 06 — Tích Hợp Bên Thứ Ba (Third-Party Integrations)

> **Mô tả**: Chi tiết tất cả tích hợp bên thứ ba: Cloudinary, Mux Video, VNPay, Elasticsearch, Gemini AI, Nodemailer, Bull, Puppeteer.

---

## 1. Cloudinary (Lưu trữ ảnh)

| Thuộc tính | Giá trị |
|-----------|---------|
| **Package** | `cloudinary` 2.7.0 |
| **Mục đích** | Upload và lưu trữ ảnh (avatar, poster, banner, thumbnail) |
| **Folder** | `chillflix-image/` |
| **Config keys** | `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |

### Cách sử dụng

**Upload trực tiếp** (FileService):
```typescript
// FileService.uploadFile(file: Express.Multer.File)
// → cloudinary.v2.uploader.upload_stream()
// → Trả về secure_url
```

**Upload qua queue** (FileProcessor):
```typescript
// 1. FileController nhận file → lưu vào Bull queue 'file-upload'
// 2. FileProcessor (5 concurrent workers):
//    - Ghi buffer ra file tạm trong uploads/
//    - Gọi cloudinary upload
//    - Xóa file tạm
//    - Track progress: 20% → 40% → 60% → 100%
```

### Multer config
```typescript
{
  storage: memoryStorage(),           // KHÔNG ghi ra disk
  fileFilter: imageFilter,           // Chỉ jpeg, png, gif
  limits: { fileSize: 5 * 1024 * 1024 }  // 5MB max
}
```

---

## 2. Mux Video (Streaming video)

| Thuộc tính | Giá trị |
|-----------|---------|
| **Package** | `@mux/mux-node` 12.8.0 |
| **Mục đích** | Upload video, mã hóa HLS, streaming, quản lý asset |
| **Config keys** | `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` |

### Các API sử dụng

| Endpoint backend | Mux API | Mục đích |
|-----------------|---------|----------|
| `POST /api/v1/video/upload-url` | `mux.video.uploads.create()` | Tạo URL upload trực tiếp (direct upload) |
| `GET /api/v1/video/assets/:id` | `mux.video.assets.retrieve()` | Lấy thông tin asset (status, playback URL) |
| `DELETE /api/v1/video/assets/:id` | `mux.video.assets.delete()` | Xóa asset |
| (Webhook handler) | Webhook signature verification | Xác thực webhook từ Mux (asset.ready, asset.errored) |

### Luồng upload video

```
Client                          Backend                         Mux
  │                                │                               │
  │ POST /api/v1/video/upload-url  │                               │
  │───────────────────────────────→│                               │
  │                                │ mux.video.uploads.create()    │
  │                                │──────────────────────────────→│
  │                                │ ← URL + upload ID             │
  │ ← { uploadUrl, assetId }      │                               │
  │                                │                               │
  │ Upload trực tiếp lên Mux URL   │ (không qua backend)           │
  │───────────────────────────────────────────────────────────────→│
  │                                │                               │
  │                                │ Webhook: asset.ready          │
  │                                │←──────────────────────────────│
  │                                │ Lưu playback URL vào Episode  │
```

---

## 3. VNPay (Cổng thanh toán)

| Thuộc tính | Giá trị |
|-----------|---------|
| **Package** | Custom implementation (axios + crypto) |
| **Mục đích** | Tạo URL thanh toán, xác thực kết quả, truy vấn, hoàn tiền |
| **Config keys** | `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`, `VNP_API`, `VNP_RETURN_URL` |

### Luồng thanh toán

```
1. Client POST /api/v1/payments/create { planId, amount }
2. Backend:
   - Tạo Payment record (status: pending)
   - Tạo VNPay URL với:
     - vnp_TmnCode
     - vnp_Amount (amount * 100)
     - vnp_TxnRef (payment.id)
     - vnp_OrderInfo
     - vnp_ReturnUrl
     - vnp_SecureHash (SHA512 HMAC của tất cả params)
3. Redirect user đến VNPay URL
4. User thanh toán trên VNPay
5. VNPay redirect về VNP_RETURN_URL với query params
6. Backend GET /api/v1/payments/verify:
   - Verify vnp_SecureHash
   - Check vnp_ResponseCode
   - Cập nhật Payment status (success/failed)
   - Nếu success → tạo Subscription → cập nhật user role
```

### VNPay Response Codes (constants)

| Code | Ý nghĩa |
|------|---------|
| `00` | Giao dịch thành công |
| `01` | Giao dịch chưa hoàn tất |
| `02` | Giao dịch bị từ chối |
| `07` | Giao dịch bị nghi ngờ gian lận |
| `09` | Giao dịch bị hủy |
| Xem `src/constants/vnpay.constant.ts` để có danh sách đầy đủ |

---

## 4. Elasticsearch (Tìm kiếm)

| Thuộc tính | Giá trị |
|-----------|---------|
| **Package** | `@elastic/elasticsearch` 8.19.1 |
| **Mục đích** | Full-text search cho films, actors, directors, producers |
| **Config keys** | `ELASTICSEARCH_NODE`, `ELASTICSEARCH_USERNAME`, `ELASTICSEARCH_PASSWORD` |

### Các index

| Index | Entity | Fields indexed |
|-------|--------|---------------|
| `films` | Film | title, slug, description, country, genre, actors, directors |
| `actors` | Actor | fullName, slug, bio |
| `directors` | Director | fullName, slug, bio |
| `producers` | Producer | fullName, slug, bio |

### API search

```
GET /api/v1/search/films?q=action
GET /api/v1/search/actors?q=tom
GET /api/v1/search/directors?q=nolan
GET /api/v1/search/producers?q=marvel
```

### Đồng bộ dữ liệu

```
POST /api/v1/search/sync      → Bulk sync toàn bộ dữ liệu từ PostgreSQL lên ES
POST /api/v1/search/indices/create  → Tạo index mappings
DELETE /api/v1/search/indices/:index → Xóa index
```

### Docker service

```yaml
elasticsearch:
  image: elasticsearch:8.15.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false  # ⚠️ Không bật security
    - ES_JAVA_OPTS=-Xms512m -Xmx512m
  ports: ['9200:9200', '9300:9300']
  mem_limit: 1g
  profiles: [search]  # Chỉ chạy khi: docker compose --profile search up
```

---

## 5. Google Gemini AI (Chatbot)

| Thuộc tính | Giá trị |
|-----------|---------|
| **Package** | `@google/generative-ai` 0.24.1 |
| **Mục đích** | Phân tích câu hỏi người dùng, truy vấn database, trả lời tự nhiên |
| **Config keys** | `GEMINI_API_KEY` |

### Cách hoạt động

```
1. User POST /api/v1/chatbot { question: "Phim hành động nào hay nhất 2024?" }
2. ChatbotService:
   - Phân tích câu hỏi bằng Gemini
   - Xác định intent (tìm phim, gợi ý, thông tin...)
   - Query database tương ứng (films, actors, ...)
   - Gửi context (kết quả query) + câu hỏi cho Gemini
   - Gemini sinh câu trả lời tự nhiên
3. Return { answer, relatedFilms[], ... }
```

---

## 6. Nodemailer (Email)

| Thuộc tính | Giá trị |
|-----------|---------|
| **Package** | `@nestjs-modules/mailer` + `handlebars` |
| **Mục đích** | Gửi email welcome (đăng ký), billing (VIP upgrade) |
| **Config keys** | `EMAIL_HOST`, `EMAIL_AUTH_USER`, `EMAIL_AUTH_PASS`, `EMAIL_PREVIEW`, `COMPANY_NAME`, `COMPANY_ADDRESS`, `SUPPORT_EMAIL`, `SUPPORT_PHONE` |

### Templates

```
src/modules/email/templates/
├── welcome.hbs      # Email chào mừng khi đăng ký
└── billing.hbs      # Email hóa đơn khi nâng cấp VIP
```

### Gửi email

```typescript
// EmailService
await this.mailerService.sendMail({
  to: user.email,
  subject: 'Welcome to ChillFlix',
  template: 'welcome',
  context: { name: user.fullName, ... },
});
```

---

## 7. Redis (Cache & Queue Backend)

| Thuộc tính | Giá trị |
|-----------|---------|
| **Package** | `ioredis` 5.8.2 |
| **Mục đích** | Cache, Bull queue backend, co-watching state, view count buffer |
| **Config keys** | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` |

### RedisModule

- `@Global()` — inject được ở mọi module
- Cung cấp `RedisService` (wrapper `ioredis` client)
- Dùng chung connection cho Bull queue

### Các use case

| Use case | Key pattern | Mô tả |
|----------|-------------|-------|
| View buffer | `view:film:{filmId}:pending` | Đếm view tạm trước khi sync DB |
| View guard | `view:film:{filmId}:user:{userId}` | 3-min cooldown mỗi user/film |
| Co-watching state | `room:{roomId}:state` | Trạng thái phòng (currentTime, playing...) |
| Cache | (tùy biến) | Cache kết quả query |

---

## 8. Bull (Job Queue)

| Thuộc tính | Giá trị |
|-----------|---------|
| **Package** | `bull` 4.16.5 + `@nestjs/bull` |
| **Mục đích** | Xử lý tác vụ bất đồng bộ (file upload, view sync) |
| **Backend** | Redis |

### Cấu hình (BullConfigService)

```typescript
{
  defaultJobOptions: {
    attempts: 3,                    // Retry 3 lần
    backoff: { type: 'exponential', delay: 2000 },  // Exponential backoff
    removeOnComplete: 100,          // Giữ 100 job thành công gần nhất
    removeOnFail: 50,               // Giữ 50 job thất bại gần nhất
  }
}
```

### Các queue

| Queue | Processor | Mục đích |
|-------|-----------|----------|
| `file-upload` | `FileProcessor` | Upload ảnh lên Cloudinary (5 concurrent) |

---

## 9. Puppeteer

| Thuộc tính | Giá trị |
|-----------|---------|
| **Package** | `puppeteer` 24.31.0 |
| **Mục đích** | Có trong dependencies (có thể dùng cho SSR, scraping, hoặc generate PDF) |
| **Ghi chú** | Chưa thấy sử dụng trong code hiện tại |

---

## 10. Biến môi trường tổng hợp cho third-party

```bash
# Cloudinary
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# VNPay
VNP_TMN_CODE=
VNP_HASH_SECRET=
VNP_URL=
VNP_API=
VNP_RETURN_URL=

# Nodemailer
EMAIL_HOST=
EMAIL_AUTH_USER=
EMAIL_AUTH_PASS=
EMAIL_PREVIEW=
COMPANY_NAME=
COMPANY_ADDRESS=
SUPPORT_EMAIL=
SUPPORT_PHONE=

# Gemini AI
GEMINI_API_KEY=

# Elasticsearch
ELASTICSEARCH_NODE=
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# Redis
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
REDIS_DB=

# Mux (không trong .env.example, cần thêm thủ công)
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
```
