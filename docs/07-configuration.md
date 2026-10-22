# 07 — Cấu Hình (Configuration)

> **Mô tả**: Toàn bộ biến môi trường (.env), file config nội bộ (Bull, Multer), constants.

---

## 1. Biến môi trường (.env)

### 1.1 Database (PostgreSQL)

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `DB_HOST` | PostgreSQL host | - |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | PostgreSQL username | - |
| `DB_PASSWORD` | PostgreSQL password | - |
| `DB_NAME` | PostgreSQL database name | - |

### 1.2 Docker Compose (services)

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `POSTGRES_USER` | Docker PostgreSQL user | `postgres` |
| `POSTGRES_PASSWORD` | Docker PostgreSQL password | **required** |
| `POSTGRES_DB` | Docker PostgreSQL database | `movie_database` |

### 1.3 Ứng dụng

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `APP_PORT` | Port chạy NestJS app | `3000` |
| `SHOULD_INIT` | Bật seed data khi khởi động | - |
| `INIT_PASSWORD` | Password cho admin user trong seed | - |
| `INNIT_ROLE` | (legacy, có typo) Tạo role mặc định | - |
| `FRONTEND_URL` | URL frontend (dùng cho CORS, email links) | - |
| `CORS_ORIGINS` | Comma-separated HTTP and WebSocket CORS allowlist; empty disables cross-origin access | - |

### 1.4 JWT Tokens

| Biến | Mô tả |
|------|-------|
| `ACCESS_TOKEN_SECRET` | Secret ký access token |
| `ACCESS_TOKEN_expiresIn` | Thời hạn access token (vd: `15m`, `1h`) |
| `REFRESH_TOKEN_SECRET` | Secret ký refresh token |
| `REFRESH_TOKEN_expiresIn` | Thời hạn refresh token (vd: `7d`) |

### 1.5 Cloudinary

| Biến | Mô tả |
|------|-------|
| `CLOUDINARY_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### 1.6 VNPay

| Biến | Mô tả |
|------|-------|
| `VNP_TMN_CODE` | Mã merchant VNPay |
| `VNP_HASH_SECRET` | Secret key tạo chữ ký SHA512 |
| `VNP_URL` | URL thanh toán VNPay |
| `VNP_API` | URL API VNPay (truy vấn, hoàn tiền) |
| `VNP_RETURN_URL` | URL redirect sau thanh toán |

### 1.7 Nodemailer (Email)

| Biến | Mô tả |
|------|-------|
| `EMAIL_HOST` | SMTP host (vd: `smtp.gmail.com`) |
| `EMAIL_AUTH_USER` | Email đăng nhập SMTP |
| `EMAIL_AUTH_PASS` | Mật khẩu ứng dụng SMTP |
| `EMAIL_PREVIEW` | Email preview (dev) |
| `COMPANY_NAME` | Tên công ty (trong template) |
| `COMPANY_ADDRESS` | Địa chỉ công ty (trong template) |
| `SUPPORT_EMAIL` | Email hỗ trợ (trong template) |
| `SUPPORT_PHONE` | SĐT hỗ trợ (trong template) |

### 1.8 Gemini AI

| Biến | Mô tả |
|------|-------|
| `GEMINI_API_KEY` | Google Gemini API key |

### 1.9 Elasticsearch

| Biến | Mô tả |
|------|-------|
| `ELASTICSEARCH_NODE` | Elasticsearch node URL |
| `ELASTICSEARCH_USERNAME` | ES username (nếu có) |
| `ELASTICSEARCH_PASSWORD` | ES password (nếu có) |

### 1.10 Redis

| Biến | Mô tả |
|------|-------|
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `REDIS_PASSWORD` | Redis password |
| `REDIS_DB` | Redis database number |

### 1.11 Mux Video (không có trong .env.example)

| Biến | Mô tả |
|------|-------|
| `MUX_TOKEN_ID` | Mux access token ID |
| `MUX_TOKEN_SECRET` | Mux access token secret |

---

## 2. File config nội bộ

### 2.1 Bull Config (`src/config/bull.config.ts`)

```typescript
@Injectable()
class BullConfigService implements BullOptionsFactory {
  constructor(private readonly redisService: RedisService) {}

  createBullOptions(): BullModuleOptions {
    return {
      redis: this.redisService.getClient(),  // Dùng chung Redis client
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    };
  }
}
```

### 2.2 Multer Config (`src/config/multer.config.ts`)

```typescript
export const multerConfig = {
  storage: memoryStorage(),  // KHÔNG ghi ra disk → xử lý trong memory
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Only jpeg, png, gif allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
};
```

---

## 3. Constants

### 3.1 AllCode Constants (`src/constants/allcode.constant.ts`)

```typescript
// Role
export const ADMIN = 1;
export const MODERATOR = 2;
export const USER = 3;

// Gender
export const MALE = 'MALE';
export const FEMALE = 'FEMALE';
export const OTHER = 'OTHER';
```

### 3.2 VNPay Constants (`src/constants/vnpay.constant.ts`)

```typescript
// Response codes
VNPAY_RESPONSE_CODE = {
  '00': 'Giao dịch thành công',
  '01': 'Giao dịch chưa hoàn tất',
  '02': 'Giao dịch bị từ chối',
  '07': 'Giao dịch bị nghi ngờ gian lận',
  '09': 'Giao dịch bị hủy',
  // ...
};
```

---

## 4. TypeScript Config

### 4.1 tsconfig.json

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2023",
    "outDir": "./dist",
    "rootDir": "./",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictNullChecks": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### 4.2 nest-cli.json

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "deleteOutDir": true,
  "compilerOptions": {
    "assets": ["modules/email/templates/**/*"]
  }
}
```

---

## 5. CORS Config (trong main.ts)

```typescript
app.enableCors({
  origin: true,           // Cho phép tất cả origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  credentials: true,      // Cho phép gửi cookie
});
```

---

## 6. Validation Pipe Config (trong main.ts)

```typescript
new ValidationPipe({
  transform: true,              // Tự động transform input thành DTO class
  whitelist: true,              // Chỉ chấp nhận field đã khai báo trong DTO
  forbidNonWhitelisted: true,   // Throw error nếu có field không khai báo
})
```

---

## 7. Cách thêm biến môi trường mới

1. Thêm key vào `.env.example` (có comment mô tả).
2. Thêm key vào `.env` với giá trị thực tế.
3. Trong code: `this.configService.get<string>('KEY_NAME')`.
4. KHÔNG hardcode giá trị mặc định nhạy cảm trong code.
