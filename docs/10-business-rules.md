# 10 — Business Rules

> **Mô tả**: Các quy tắc nghiệp vụ quan trọng: phân quyền, subscription/payment, soft delete, view counting, comment hierarchy, upload flow.

---

## 1. Phân quyền (Role-Based Access Control)

### 1.1 Hệ thống Role

| Role | keyMap | Mô tả |
|------|--------|-------|
| Admin | R1 | Quản trị hệ thống — toàn quyền |
| Moderator | R2 | Quản lý nội dung — quyền giới hạn |
| User | R3 | Người dùng cơ bản |

### 1.2 Cơ chế Permission Check

1. Permission được gán cho Role qua bảng `role_permission`.
2. Khi user login, permissions được nhúng vào JWT payload.
3. Mỗi request HTTP, `JwtAuthGuard` kiểm tra:
   - Endpoint `/api/v1/auth/*` → tự động pass
   - Có `@SkipCheckPermission()` → pass nếu đã auth
   - Tìm trong `user.permissions`: `apiPath` match với `request.route.path` **và** `method` match
   - Không tìm thấy → `403 Forbidden`

### 1.3 Quy tắc phân quyền

- **Admin (R1)**: Có tất cả permission.
- **Moderator (R2)**: Xem danh sách/quản lý content (films, comments, ratings), không quản lý users, không quản lý roles, không quản lý payments.
- **User (R3)**: Xem films, tạo comment/rating/favorite/playlist, xem lịch sử, quản lý profile cá nhân.

### 1.4 Các decorator kiểm soát truy cập

```typescript
@Public()                  // Route công khai, không cần token
@SkipCheckPermission()     // Cần token nhưng không check permission chi tiết
// Mặc định                 // Cần token + permission match apiPath + method
```

---

## 2. Subscription & Payment

### 2.1 Luồng đăng ký gói

```
1. User chọn gói subscription (Basic/Premium/VIP)
2. Tạo Payment record với status 'pending'
3. Tạo VNPay payment URL
4. User thanh toán trên VNPay
5. VNPay redirect về VNP_RETURN_URL
6. Backend verify giao dịch:
   - Xác thực chữ ký SHA512
   - Nếu success:
     a. Cập nhật Payment.status = 'completed'
     b. Tạo Subscription (startDate = now, endDate = now + plan.durationDays)
     c. Cập nhật user role (nếu là gói VIP)
     d. Gửi email billing
   - Nếu failed:
     a. Cập nhật Payment.status = 'failed'
```

### 2.2 Subscription Plan

| Field | Mô tả |
|-------|-------|
| `name` | Tên gói (Basic, Premium, VIP) |
| `price` | Giá (VND) |
| `durationDays` | Thời hạn (30, 90, 365 ngày) |
| `features` | Các tính năng (JSON hoặc text) |

### 2.3 Quy tắc

- Một user có thể có nhiều subscription (lịch sử), nhưng chỉ một subscription active tại một thời điểm.
- Subscription hết hạn (`endDate < now`) → user mất quyền VIP.
- Gia hạn subscription: tạo subscription mới, không extend subscription cũ.

---

## 3. Soft Delete

### 3.1 Entity áp dụng

Hầu hết entity chính: `User`, `Film`, `Comment`, `Rating`, `Director`, `Actor`, `Producer`, `Playlist`, `Episode`, `Part`.

### 3.2 Cơ chế

```typescript
// Entity columns
@Column({ default: false })
isDeleted: boolean;

@Column({ nullable: true })
deletedAt: Date;

@Column({ nullable: true })
deletedBy: string;  // userId của người xóa
```

- **KHÔNG xóa vật lý** row khỏi database.
- Thay vào đó set `isDeleted = true`, `deletedAt = now()`, `deletedBy = currentUser.id`.
- Query mặc định của TypeORM **vẫn trả về** record đã soft-delete — cần filter thủ công `where: { isDeleted: false }`.

### 3.3 Lưu ý

- Không có TypeORM soft-delete subscriber tự động — filter thủ công trong từng service.
- Các entity liên quan cũng cần soft-delete cascade thủ công.

---

## 4. View Counting (Đếm lượt xem)

### 4.1 Vấn đề

- Mỗi lần user xem phim → update `film.view = film.view + 1` trong PostgreSQL.
- Với lượng user lớn, hàng ngàn UPDATE/giây gây áp lực PostgreSQL.

### 4.2 Giải pháp: Redis Buffer

```
┌─────────────────────────────────────────────────────────┐
│ Khi user xem phim:                                      │
│                                                         │
│ 1. Check guard key:                                     │
│    EXISTS view:film:{filmId}:user:{userId}               │
│    → Nếu tồn tại: bỏ qua (đã đếm trong 3 phút)          │
│    → Nếu không: tiếp tục                                │
│                                                         │
│ 2. Set guard key với TTL 180s:                          │
│    SETEX view:film:{filmId}:user:{userId} 180 "1"       │
│                                                         │
│ 3. Increment pending counter:                           │
│    INCR view:film:{filmId}:pending                      │
│                                                         │
│ Mỗi 2 phút (cron job):                                  │
│                                                         │
│ 4. Quét tất cả key view:film:*:pending                  │
│ 5. Với mỗi key:                                         │
│    - GET value (số view mới)                            │
│    - UPDATE film SET view = view + value                │
│    - DEL key (reset counter)                            │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Lợi ích

- Giảm write PostgreSQL (batch update mỗi 2 phút thay vì mỗi view)
- Guard key chống spam (mỗi user chỉ tính 1 view mỗi 3 phút cho mỗi phim)
- Redis INCR là atomic operation, nhanh hơn PostgreSQL UPDATE

---

## 5. Comment Hierarchy

### 5.1 Cấu trúc

Comment dùng mô hình **1 cấp reply**:

```
Comment A (parentId = null)
├── Reply A1 (parentId = CommentA.id)
├── Reply A2 (parentId = CommentA.id)
Comment B (parentId = null)
├── Reply B1 (parentId = CommentB.id)
```

- Comment gốc: `parentId = null`
- Reply: `parentId = comment.id` (chỉ reply được comment gốc, không reply lồng nhiều cấp)

### 5.2 Quy tắc

- User có thể sửa comment của mình trong thời gian giới hạn (nếu có implement).
- Admin có thể ẩn (`isHidden = true`) bất kỳ comment nào.
- Khi comment bị ẩn, reply của nó vẫn hiển thị.
- Xóa comment gốc → tất cả reply cũng bị soft-delete.

---

## 6. Rating Rules

- Mỗi user chỉ được đánh giá **1 lần** cho mỗi phim (unique constraint `userId + filmId`).
- Điểm đánh giá: 1-5 (integer).
- User có thể sửa điểm đánh giá của mình.
- Admin có thể ẩn đánh giá (`isHidden = true`).
- Khi có rating mới → broadcast qua `RatingGateway` để cập nhật UI realtime.

---

## 7. File Upload Rules

### 7.1 Ảnh (Cloudinary)

- Chỉ chấp nhận: JPEG, PNG, GIF.
- Dung lượng tối đa: 5MB.
- Upload qua memory (không ghi disk).
- Hai chế độ upload:
  - **Trực tiếp**: Gọi `FileService.uploadFile()` → trả về URL ngay.
  - **Qua queue**: Gửi vào Bull queue `file-upload` → xử lý async (dùng cho upload nhiều file hoặc file lớn).

### 7.2 Video (Mux)

- Upload trực tiếp từ client lên Mux (không qua backend).
- Backend chỉ tạo upload URL + xử lý webhook.
- Video được Mux encode thành HLS adaptive bitrate.
- Playback URL lưu trong `Episode.videoUrl`.

---

## 8. Slug Generation

- Tự động sinh từ `title` (film) hoặc `fullName` (director, actor, producer).
- Dùng utility `src/common/utils/slug.util.ts`.
- Slug pattern: lowercase, thay dấu cách bằng `-`, loại bỏ ký tự đặc biệt.
- Slug là duy nhất trong cùng entity (dùng để SEO-friendly URL).

---

## 9. Search Indexing

- Elasticsearch index được tạo thủ công qua API `POST /api/v1/search/indices/create`.
- Dữ liệu được sync qua API `POST /api/v1/search/sync` (bulk insert toàn bộ).
- Khi có thay đổi (thêm/sửa/xóa film/actor/director/producer), cần sync lại ES.
- ES dùng cho full-text search (không phải primary database).

---

## 10. Co-Watching Rules

- Một user tạo phòng → nhận `roomCode`.
- User khác join phòng qua `roomCode`.
- Trạng thái phòng (currentTime, playing, partId, episodeId) được sync qua WebSocket.
- Room state lưu trong Redis để persistence khi server restart.
- Khi tất cả user rời phòng → phòng tự hủy sau timeout.

---

## 11. AllCode Lookup Rules

- Tất cả enum/dropdown values đều lưu trong bảng `all_code`.
- `keyMap` là unique identifier — **không thay đổi** sau khi tạo.
- `type` phân loại: `ROLE`, `GENRE`, `COUNTRY`, `FILM_TYPE`, `RANK`, `VERSION`, `GENDER`, `USER_STATUS`, `PUBLIC_STATUS`.
- Khi thêm giá trị mới:
  1. Tạo `keyMap` mới theo convention (vd: `G{nextId}` cho genre).
  2. Set `valueEn` và `valueVi`.
  3. Không cần thay đổi schema vì dùng chung bảng `all_code`.
