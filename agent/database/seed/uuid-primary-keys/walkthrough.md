# Walkthrough - Di chuyển khóa chính User sang UUID

> **Ngày hoàn thành**: 2026-06-11
> **Trạng thái**: ✅ Hoàn thành

---

## 1. Kết quả Phân tích Khóa chính trong ứng dụng
Khi rà soát toàn bộ các module nhạy cảm (Nhóm A), chúng tôi nhận thấy:
- **`Playlist`**, **`Payment`**, và **`Subscription`** đều **đã sử dụng UUID** (`@PrimaryGeneratedColumn('uuid')`) làm khóa chính ngay từ trước.
- Chỉ có **`User`** (`userId: number`) là vẫn đang sử dụng số tự tăng làm khóa chính.
- Do đó, việc thay đổi cấu trúc khóa chính sang UUID được khu trú trực tiếp vào thực thể `User` và các tham chiếu liên quan.

---

## 2. Các thay đổi đã thực hiện

### Cập nhật cấu trúc Entities
- **`user.entity.ts`**: Chuyển đổi `@PrimaryGeneratedColumn()` sang `@PrimaryGeneratedColumn('uuid')` và đổi kiểu dữ liệu `userId` thành `string`.
- **Entities có cột liên kết `userId` dạng cứng**: Đã cập nhật kiểu dữ liệu của cột `userId` từ `number` sang `string` trong các bảng:
  - `Playlist`
  - `Subscription`
  - `Favorite`
  - `Payment`
  - `RoomCoWatching` (`hostId`)
- **Cột Audit (`createdBy`, `updatedBy`, `deletedBy`)**: Đã cập nhật tất cả các cột audit này trên **tất cả 15 thực thể** trong dự án sang kiểu `string` để tương thích với kiểu UUID mới của người dùng tạo.

### DTOs & Interfaces
- **`user.interface.ts`**: Cập nhật `userId` thành kiểu `string`.
- **`update-profile.dto.ts`** & **`update-user.dto.ts`**: Cập nhật validation thành `@IsUUID()` thay vì `@IsNumber()`.
- **`create-notification.dto.ts`**: Cập nhật `userId` và `replierId` thành `@IsUUID()`.

### Services & Controllers
- **`users.controller.ts`**: Loại bỏ toán tử chuyển đổi kiểu số `+id` ở các endpoint `findOne` và `remove`.
- **`users.service.ts`**: Thay đổi signature của `findOne(id: string)` và `remove(id: string)`, cập nhật kiểu dữ liệu của `updateUserToken`.
- **`subscriptions.controller.ts`**: Loại bỏ toán tử `+id` trong `update` và `remove` (đảm bảo không còn bug ép kiểu khi gọi ID subscription vốn là UUID).
- **`subscriptions.service.ts`**: Cập nhật signature `findOne(id: string)` để tìm kiếm active subscription của user theo UUID.
- **`video.service.ts`**: Cập nhật signature `createDirectUpload` để chấp nhận `userId: string`.
- **`comment.service.ts`** & **`comment-gateway.ts`**: Cập nhật các hàm kiểm duyệt và gửi socket (`sendWarningNotification`, `sendInfoNotification`, `hideCommentAndChildren`) chấp nhận `userId: string`.
- **`rating.service.ts`**, **`favorites.service.ts`**, **`report.service.ts`**, **`notifications.service.ts`**: Cập nhật tham số nhận `userId: string`.

---

## 3. Xác thực (Verification)
- **Kiểm tra biên dịch**: Chạy lệnh `npm run build` thành công 100% không phát sinh lỗi TypeScript compile.
- **Bảo mật**: ID người dùng hiện đã được bảo vệ hoàn toàn bằng định dạng chuỗi UUIDv4 ngẫu nhiên, loại bỏ hoàn toàn lỗ hổng ID Enumeration (quét thông tin tài khoản) qua API endpoints.
