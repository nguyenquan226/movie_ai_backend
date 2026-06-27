# 02 — Tổng Quan API

> **Mô tả**: API versioning, response convention (EC/EM), danh sách toàn bộ controller và endpoint chính.

---

## 1. API Prefix & Versioning

- **Global prefix**: `api`
- **Versioning type**: URI
- **Default versions**: `v1`, `v2`
- **URL pattern**: `http://{host}:{port}/api/v1/{resource}`

```
GET  /api/v1/films          → FilmsController (v1)
GET  /api/v2/films          → FilmsController (v2) — nếu có override
GET  /api/v1/auth/login     → AuthController
```

---

## 2. Response Convention (EC/EM)

Tất cả response tuân theo format thống nhất:

```json
{
  "statusCode": 200,
  "message": "",
  "EC": 0,
  "EM": "Success",
  "data": { ... }
}
```

| Field | Type | Mô tả |
|-------|------|-------|
| `statusCode` | number | HTTP status code |
| `message` | string | Message từ `@ResponseMessage()` decorator |
| `EC` | number | Error code (0 = success, != 0 = error) |
| `EM` | string | Error message (mô tả lỗi) |
| `data` | any | Payload dữ liệu (không chứa EC, EM) |

**Cơ chế**:
- Service trả về `{ EC: 0, EM: "Success", ...data }`.
- `TransformInterceptor` (global) detect object có `EC` + `EM`, unwrap và đặt vào envelope.
- Nếu service không trả về EC/EM, toàn bộ response được bọc trong `data`.

---

## 3. Danh sách Controller & Endpoint

### 3.1 Auth (`/api/v1/auth`)
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/api/v1/auth/login` | Đăng nhập (email + password) | Public |
| `POST` | `/api/v1/auth/register` | Đăng ký tài khoản | Public |
| `POST` | `/api/v1/auth/refresh-token` | Làm mới access token | Public (dùng refresh token cookie) |
| `GET` | `/api/v1/auth/account` | Lấy thông tin user hiện tại | JWT |
| `POST` | `/api/v1/auth/logout` | Đăng xuất | JWT |

### 3.2 Users (`/api/v1/users`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/users` | Danh sách user (phân trang) |
| `GET` | `/api/v1/users/:id` | Chi tiết user |
| `POST` | `/api/v1/users` | Tạo user mới |
| `PATCH` | `/api/v1/users/:id` | Cập nhật user |
| `DELETE` | `/api/v1/users/:id` | Xóa user (soft delete) |

### 3.3 Films (`/api/v1/films`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/films` | Danh sách phim (phân trang, filter, sort) |
| `GET` | `/api/v1/films/:id` | Chi tiết phim |
| `GET` | `/api/v1/films/slug/:slug` | Chi tiết phim theo slug |
| `POST` | `/api/v1/films` | Tạo phim mới |
| `PATCH` | `/api/v1/films/:id` | Cập nhật phim |
| `DELETE` | `/api/v1/films/:id` | Xóa phim (soft delete) |
| `GET` | `/api/v1/films/by-country/:keyMap` | Phim theo quốc gia |
| `GET` | `/api/v1/films/by-genre/:keyMap` | Phim theo thể loại |
| `GET` | `/api/v1/films/by-type/:keyMap` | Phim theo loại (phim lẻ, phim bộ) |
| `GET` | `/api/v1/films/vip` | Danh sách phim VIP |
| `GET` | `/api/v1/films/chart` | Dữ liệu biểu đồ thống kê |
| `POST` | `/api/v1/films/:id/view` | Tăng lượt xem (có rate limiting Redis) |

### 3.4 Directors (`/api/v1/directors`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/directors` | Danh sách đạo diễn |
| `GET` | `/api/v1/directors/:id` | Chi tiết đạo diễn |
| `POST` | `/api/v1/directors` | Tạo đạo diễn |
| `PATCH` | `/api/v1/directors/:id` | Cập nhật |
| `DELETE` | `/api/v1/directors/:id` | Xóa |

### 3.5 Actors (`/api/v1/actors`)
Tương tự Directors: CRUD + pagination.

### 3.6 Producers (`/api/v1/producers`)
Tương tự Directors: CRUD + pagination.

### 3.7 Parts & Episodes (`/api/v1/parts`, `/api/v1/episodes`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET/POST` | `/api/v1/parts` | CRUD Part (mùa/phần của phim bộ) |
| `GET/POST/PATCH/DELETE` | `/api/v1/parts/:id` | CRUD Part chi tiết |
| `GET/POST` | `/api/v1/episodes` | CRUD Episode (tập phim) |
| `GET/PATCH/DELETE` | `/api/v1/episodes/:id` | CRUD Episode chi tiết |

### 3.8 Comments (`/api/v1/comments`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/comments` | Danh sách comment (theo phim) |
| `POST` | `/api/v1/comments` | Tạo comment |
| `POST` | `/api/v1/comments/reply` | Trả lời comment |
| `PATCH` | `/api/v1/comments/:id` | Sửa comment |
| `PATCH` | `/api/v1/comments/:id/hide` | Ẩn/hiện comment (admin) |
| `DELETE` | `/api/v1/comments/:id` | Xóa comment |

### 3.9 Comment Reactions (`/api/v1/comment-reactions`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/comment-reactions` | Danh sách reaction |
| `POST` | `/api/v1/comment-reactions` | Thêm reaction (like, love, ...) |
| `DELETE` | `/api/v1/comment-reactions/:id` | Xóa reaction |

### 3.10 Ratings (`/api/v1/ratings`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/ratings` | Danh sách đánh giá |
| `POST` | `/api/v1/ratings` | Tạo đánh giá (1-5 sao) |
| `PATCH` | `/api/v1/ratings/:id` | Cập nhật |
| `DELETE` | `/api/v1/ratings/:id` | Xóa |
| `PATCH` | `/api/v1/ratings/:id/hide` | Ẩn/hiện (admin) |

### 3.11 Reports (`/api/v1/reports`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/reports` | Danh sách báo cáo |
| `POST` | `/api/v1/reports` | Tạo báo cáo vi phạm |

### 3.12 Favorites (`/api/v1/favorites`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/favorites` | Danh sách yêu thích của user |
| `POST` | `/api/v1/favorites` | Thêm phim vào yêu thích |
| `DELETE` | `/api/v1/favorites/:id` | Xóa khỏi yêu thích |

### 3.13 Playlists (`/api/v1/playlists`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/playlists` | Danh sách playlist của user |
| `POST` | `/api/v1/playlists` | Tạo playlist |
| `PATCH` | `/api/v1/playlists/:id` | Cập nhật |
| `DELETE` | `/api/v1/playlists/:id` | Xóa |

### 3.14 Playlist Films (`/api/v1/playlist-films`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/playlist-films` | Danh sách phim trong playlist |
| `POST` | `/api/v1/playlist-films` | Thêm phim vào playlist |
| `DELETE` | `/api/v1/playlist-films/:id` | Xóa phim khỏi playlist |

### 3.15 Notifications (`/api/v1/notifications`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/notifications` | Danh sách thông báo của user |
| `PATCH` | `/api/v1/notifications/:id/read` | Đánh dấu đã đọc |

### 3.16 Search (`/api/v1/search`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/search/films` | Tìm kiếm phim (Elasticsearch) |
| `GET` | `/api/v1/search/actors` | Tìm kiếm diễn viên |
| `GET` | `/api/v1/search/directors` | Tìm kiếm đạo diễn |
| `GET` | `/api/v1/search/producers` | Tìm kiếm nhà sản xuất |
| `POST` | `/api/v1/search/sync` | Đồng bộ toàn bộ dữ liệu lên Elasticsearch |
| `POST` | `/api/v1/search/indices/create` | Tạo Elasticsearch index |
| `DELETE` | `/api/v1/search/indices/:index` | Xóa index |

### 3.17 Files (`/api/v1/files`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/v1/files/upload` | Upload ảnh (trực tiếp → Cloudinary) |
| `POST` | `/api/v1/files/upload-queue` | Upload ảnh qua Bull queue (async) |

### 3.18 Video (`/api/v1/video`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/v1/video/upload-url` | Lấy Mux direct upload URL |
| `GET` | `/api/v1/video/assets/:id` | Lấy thông tin asset từ Mux |
| `DELETE` | `/api/v1/video/assets/:id` | Xóa asset trên Mux |

### 3.19 Payments (`/api/v1/payments`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/v1/payments/create` | Tạo URL thanh toán VNPay |
| `GET` | `/api/v1/payments/verify` | Xác thực kết quả thanh toán (return URL) |
| `POST` | `/api/v1/payments/query` | Truy vấn giao dịch VNPay |
| `POST` | `/api/v1/payments/refund` | Hoàn tiền |
| `GET` | `/api/v1/payments` | Danh sách giao dịch |

### 3.20 Subscriptions & Plans (`/api/v1/subscriptions`, `/api/v1/subscription-plans`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/subscription-plans` | Danh sách gói subscription |
| `GET/POST/PATCH/DELETE` | `/api/v1/subscription-plans/:id` | CRUD gói |
| `GET` | `/api/v1/subscriptions` | Danh sách subscription của user |
| `POST` | `/api/v1/subscriptions` | Đăng ký gói |

### 3.21 Chatbot (`/api/v1/chatbot`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/v1/chatbot` | Gửi câu hỏi → Gemini AI trả lời |

### 3.22 Co-Watching (`/api/v1/co-watching`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/v1/co-watching/rooms` | Tạo phòng co-watching |
| `GET` | `/api/v1/co-watching/rooms/:id` | Lấy thông tin phòng |
| `POST` | `/api/v1/co-watching/rooms/:id/join` | Tham gia phòng |

### 3.23 Roles & Permissions (`/api/v1/roles`, `/api/v1/permissions`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET/POST/PATCH/DELETE` | `/api/v1/roles` | CRUD vai trò |
| `GET/POST/PATCH/DELETE` | `/api/v1/permissions` | CRUD quyền |

### 3.24 AllCodes (`/api/v1/all-codes`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/all-codes` | Lấy toàn bộ lookup data (theo type) |

### 3.25 Email (`/api/v1/email`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/v1/email/test` | Gửi email test |
| `POST` | `/api/v1/email/welcome` | Gửi email chào mừng |

### 3.26 Markdowns (`/api/v1/markdowns`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/v1/markdowns` | Lấy nội dung markdown |
| `POST` | `/api/v1/markdowns` | Tạo/cập nhật markdown |

---

## 4. Phân trang (Pagination)

Các endpoint GET list hỗ trợ phân trang qua query params:

```
GET /api/v1/films?page=1&limit=20&sort=createdAt&order=DESC
```

Sử dụng thư viện `nestjs-typeorm-paginate`.

Response format có phân trang:
```json
{
  "data": {
    "items": [...],
    "meta": {
      "totalItems": 100,
      "itemCount": 20,
      "itemsPerPage": 20,
      "totalPages": 5,
      "currentPage": 1
    }
  }
}
```

---

## 5. Filter & Query

Các endpoint films hỗ trợ filter:
- `GET /api/v1/films?genre=R1&country=R2&type=R3&year=2024`
- `GET /api/v1/films?search=keyword`
- `GET /api/v1/films?isVip=true`

Sử dụng thư viện `api-query-params` để parse query string thành điều kiện TypeORM.
