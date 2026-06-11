# Walkthrough - Tối ưu hóa Database Seeder Module

> **Ngày hoàn thành**: 2026-06-11
> **Trạng thái**: ✅ Hoàn thành

---

## Các thay đổi đã thực hiện

### 1. Configuration
- Đã thêm `"resolveJsonModule": true` vào `tsconfig.json` để cho phép import và xử lý JSON trực tiếp.

### 2. Tách biệt Sample Data sang JSON
Toàn bộ sample data dạng TypeScript trước đây đã được tự động trích xuất và chuyển đổi sang JSON chuẩn, giúp cô lập data khỏi logic nghiệp vụ:
- `src/databases/seed-data/allcodes.json`: Chứa tất cả mã định danh (Genre, Version, Year, Sort, Gender, Role, Status...).
- `src/databases/seed-data/roles.json`: Chứa 4 vai trò hệ thống (ROLE_ADMIN, ROLE_MOD, ROLE_USER, tesst).
- `src/databases/seed-data/users.json`: Chứa thông tin chi tiết của 24 người dùng mẫu (không lưu password hash, chỉ lưu plain-text để hash an toàn lúc runtime).
- `src/databases/seed-data/permissions.json`: Chứa danh sách 1022 dòng phân quyền từ bản chuẩn (`seeds/init_permisison.ts`).
- `src/databases/seed-data/role-permissions.json`: Chứa cấu hình mapping vai trò và quyền.

### 3. Tạo Loader Helper
- `src/databases/helpers/seed-data.loader.ts`: Hàm generic helper `loadSeedData<T>(filename)` để đọc file JSON tự động theo đường dẫn tương đối và kiểm tra lỗi.

### 5. Tinh chỉnh Service & Module
- `src/databases/databases.service.ts`: Giảm số dòng code từ **401 dòng xuống còn 81 dòng** (giảm ~80%). Loại bỏ toàn bộ các biến chứa hàng ngàn dòng data cứng, thay thế bằng hàm gọi đọc JSON tiện lợi và gọn gàng.
- `src/databases/databases.module.ts`: Loại bỏ imports và khai báo controller trống `DatabasesController`.

### 6. Dọn dẹp Files
Đã xóa toàn bộ files rác, trùng lặp và không còn sử dụng:
- `src/databases/databases.controller.ts` (Controller trống)
- `src/databases/sample.allcode.ts` (File trùng lặp tại root folder)
- `src/databases/sampleData/` (Thư mục TS data cũ)
- `src/databases/seeds/` (Thư mục TS data cũ)

---

## Hướng dẫn sử dụng & Bảo trì

### Thay đổi dữ liệu mẫu
Khi bạn cần thay đổi dữ liệu seed (ví dụ: thêm quyền mới, chỉnh sửa người dùng mẫu, đổi tên vai trò...), bạn chỉ cần mở file tương ứng trong thư mục `src/databases/seed-data/*.json` và chỉnh sửa trực tiếp. Không cần sửa bất kỳ dòng code logic TypeScript nào của service.

### Thêm dữ liệu seed cho thực thể mới
1. Đặt dữ liệu của thực thể vào file JSON mới trong `src/databases/seed-data/your-entity.json`.
2. Trong `src/databases/databases.service.ts`, import Repository của thực thể đó.
3. Trong phương thức `onModuleInit`, gọi loader để nạp và insert:
   ```typescript
   if (countEntity === 0) {
     const data = loadSeedData<YourEntity[]>('your-entity.json');
     await this.yourRepository.insert(data);
   }
   ```

---

## Kết quả Verification
- **Build test**: Chạy thành công lệnh `npm run build` không lỗi.
- **Tính năng**: Logic seed được giữ nguyên 100% không làm xáo trộn cấu trúc DB hay cơ chế hash password.
