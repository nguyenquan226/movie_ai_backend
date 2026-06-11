# Tối ưu hóa khóa chính: Di chuyển User Primary Key sang UUID (Approved)

Kế hoạch này triển khai thay đổi kiểu khóa chính (Primary Key) của `User` từ số tự tăng sang chuỗi UUID (`string`), đồng thời cập nhật tất cả các thực thể liên quan và các hàm xử lý API của các modules liên quan để đảm bảo tính đồng bộ và bảo mật của hệ thống.

---

## Proposed Changes

### 1. Entities

#### [MODIFY] [user.entity.ts](file:///home/quan/project/movie_project/ChillFlix_Backend/src/modules/users/entities/user.entity.ts)
- Thay đổi khóa chính `userId` sang kiểu UUID:
  ```typescript
  @PrimaryGeneratedColumn('uuid')
  userId: string;
  ```

#### [MODIFY] [playlist.entity.ts](file:///home/quan/project/movie_project/ChillFlix_Backend/src/modules/playlists/entities/playlist.entity.ts)
- Cập nhật kiểu cột `userId`:
  ```typescript
  @Column({ name: 'userId' })
  userId: string;
  ```

#### [MODIFY] [subscription.entity.ts](file:///home/quan/project/movie_project/ChillFlix_Backend/src/modules/subscriptions/entities/subscription.entity.ts)
- Cập nhật kiểu cột `userId`:
  ```typescript
  @Column({ name: 'user_id' })
  userId: string;
  ```

#### [MODIFY] [favorite.entity.ts](file:///home/quan/project/movie_project/ChillFlix_Backend/src/modules/favorites/entities/favorite.entity.ts)
- Cập nhật kiểu cột `userId`:
  ```typescript
  @Column({ name: 'user_id' })
  userId: string;
  ```

#### [MODIFY] [payment.entity.ts](file:///home/quan/project/movie_project/ChillFlix_Backend/src/modules/payments/entities/payment.entity.ts)
- Cập nhật kiểu cột `userId`:
  ```typescript
  @Column({ name: 'user_id' })
  userId: string;
  ```

---

### 2. DTOs & Interfaces

#### [MODIFY] [user.interface.ts](file:///home/quan/project/movie_project/ChillFlix_Backend/src/modules/users/interface/user.interface.ts)
- Đổi kiểu `userId` sang `string`.

#### [MODIFY] [update-profile.dto.ts](file:///home/quan/project/movie_project/ChillFlix_Backend/src/modules/users/dto/update-profile.dto.ts)
- Đổi kiểu `userId` sang `string` và đổi validator thành `@IsUUID()`.

#### [MODIFY] [update-user.dto.ts](file:///home/quan/project/movie_project/ChillFlix_Backend/src/modules/users/dto/update-user.dto.ts)
- Đổi kiểu `userId` sang `string` và dùng `@IsUUID()`.

---

### 3. Services & Controllers

#### [MODIFY] [users.service.ts](file:///home/quan/project/movie_project/ChillFlix_Backend/src/modules/users/users.service.ts)
- Chuyển đổi tham số các hàm `findOne(id: string)`, `remove(id: string, user: IUser)`.

#### [MODIFY] [users.controller.ts](file:///home/quan/project/movie_project/ChillFlix_Backend/src/modules/users/users.controller.ts)
- Bỏ toán tử chuyển đổi kiểu số `+id`.

#### [MODIFY] [subscriptions.service.ts](file:///home/quan/project/movie_project/ChillFlix_Backend/src/modules/subscriptions/subscriptions.service.ts)
- Thay đổi tham số `findOne(id: string)`.

#### [MODIFY] [subscriptions.controller.ts](file:///home/quan/project/movie_project/ChillFlix_Backend/src/modules/subscriptions/subscriptions.controller.ts)
- Bỏ toán tử chuyển đổi kiểu số `+id` khi gọi `subscriptionsService`.

---

## Verification Plan

### Automated Tests
- `npm run build`
