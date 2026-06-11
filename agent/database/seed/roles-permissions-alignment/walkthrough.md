# Walkthrough - Điều chỉnh & Tối ưu hóa Vai trò & Quyền hạn (Roles & Permissions)

> **Ngày hoàn thành**: 2026-06-11
> **Trạng thái**: ✅ Hoàn thành

---

## 1. Phát hiện sự lệch khớp (Mismatches) ban đầu
Khi tiến hành phân tích chi tiết dữ liệu mẫu giữa `roles.json`, `role-permissions.json` và `users.json`, chúng tôi phát hiện các vấn đề lớn:
1. **Sai lệch ID hằng số vai trò**:
   - Trong `src/constants/allcode.constant.ts` định nghĩa: `ADMIN_ROLE = 1`, `MODERATOR_ROLE = 2`, `USER_ROLE = 3`.
   - Tuy nhiên, trong code insert seed ban đầu của `databases.service.ts` lại gán cứng `ROLE_ADMIN` = 2, `ROLE_USER` = 5. Do đó khi parser trích xuất dữ liệu, danh sách user mẫu bị gán các ID vai trò lỗi (`2` và `5`), gây mâu thuẫn hệ thống.
2. **Thiếu ánh xạ quyền**:
   - `role-permissions.json` chỉ chứa 83 quyền thuộc phiên bản phân quyền cũ.
   - Bản quyền chuẩn mới (`permissions.json`) lại có tới **170 quyền**. Hậu quả là có 87 quyền mới (bao gồm các quyền quản trị như: USERS, ROLES, PERMISSIONS, SUBSCRIPTIONS...) chưa được ánh xạ cho bất cứ vai trò nào, kể cả ADMIN.
3. **Sai lệch thông tin người tạo (`createdBy: 15`)**:
   - Trong dữ liệu vai trò cũ, tất cả các role đều được gán `createdBy: 15`.
   - Tuy nhiên, trong danh sách người dùng mẫu, ID số `15` lại tương ứng với tài khoản `"user14@gmail.com"` (Huỳnh Quốc Huy - một người dùng thông thường có `roleId: 3`), chứ không phải tài khoản quản trị. 
   - Tài khoản Admin thực sự có quyền tối cao và được chèn đầu tiên là `"admin@gmail.com"` sẽ nhận ID tự tăng là `1`.

---

## 2. Các thay đổi đã triển khai

### Sửa chữa & Chuẩn hóa
- **`users.json`**: Cập nhật lại toàn bộ 24 users mẫu về đúng ID chuẩn: Admin có `roleId: 1`, User thường có `roleId: 3`.
- **`roles.json`**: Chuẩn hóa thành 6 vai trò bao gồm cả các vai trò mới được đề xuất. Chuyển đổi toàn bộ `createdBy: 15` thành `createdBy: 1` để quy thuộc quyền sở hữu các vai trò này về tài khoản Admin tối cao (`admin@gmail.com`).
- **`role-permissions.json`**: Tự động sinh lại bộ ánh xạ đầy đủ cho **170 quyền** nhân với các vai trò mới (tổng cộng 737 dòng ánh xạ).

### Đề xuất và Bổ sung các Vai trò mới
Để tối ưu hóa phân quyền cho một nền tảng phim như **ChillFlix**, chúng tôi đã mở rộng lên thành **6 vai trò** với phân cấp quyền cụ thể:

| Vai trò | ID | Mô tả | Cơ chế phân quyền (Rules) |
|---------|----|-------|--------------------------|
| **`ROLE_ADMIN`** | 1 | Quản trị viên hệ thống | Sở hữu **170/170 quyền** (toàn bộ các route quản trị hệ thống, users, roles, billing). |
| **`ROLE_MOD`** | 2 | Người kiểm duyệt nội dung | Sở hữu **134 quyền** (toàn quyền quản lý phim, tập phim, bình luận, đánh giá. Không có quyền xem/sửa cấu hình hệ thống, hóa đơn/gói cước). |
| **`ROLE_USER`** | 3 | Người dùng cơ bản | Sở hữu **99 quyền** (chỉ có quyền `GET` xem phim/diễn viên, và toàn quyền tạo/sửa/xóa các nội dung cá nhân của họ: comment, rating, playlist, profile). |
| **`ROLE_VIP`** | 4 | Người dùng gói Premium/VIP | Thừa hưởng đầy đủ quyền của `ROLE_USER`. |
| **`ROLE_CONTENT_CREATOR`**| 5 | Nhà sáng tạo nội dung | Sở hữu **134 quyền** (thừa hưởng từ user thường, cộng thêm quyền tạo/sửa/xóa/sync diễn viên, phim, tập phim, markdown và upload file). |
| **`ROLE_SUPPORT`** | 6 | Nhân viên hỗ trợ | Sở hữu **101 quyền** (thừa hưởng từ user thường, cộng thêm quyền xóa bình luận/rating xấu của người khác, xem danh sách tài khoản người dùng để hỗ trợ). |

### Phân bổ User Mẫu để Kiểm thử (Testing Allocation)
Chúng tôi đã điều chỉnh `users.json` để chia đều các tài khoản mẫu cho các vai trò khác nhau giúp bạn dễ dàng test phân quyền:
- `admin@gmail.com` -> `roleId: 1` (`ROLE_ADMIN`)
- `user@gmail.com` -> `roleId: 3` (`ROLE_USER`)
- `user2@gmail.com` -> `roleId: 4` (`ROLE_VIP`)
- `user3@gmail.com` -> `roleId: 5` (`ROLE_CONTENT_CREATOR`)
- `user4@gmail.com` -> `roleId: 6` (`ROLE_SUPPORT`)

---

## 3. Xác thực (Verification)
- Đã chạy phân tích kiểm tra ánh xạ ID vai trò. Không còn ID vai trò lạ hay bị lệch giữa các bảng.
- Đã chuyển đổi chính xác `createdBy` của các Role về Admin có ID `1`.
- Kiểm tra biên dịch dự án: `npm run build` thành công, không phát sinh bất kỳ lỗi cú pháp hay import nào.
