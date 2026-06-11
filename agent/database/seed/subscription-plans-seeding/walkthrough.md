# Walkthrough - Cài đặt Dữ liệu mẫu khởi tạo cho Gói dịch vụ (Subscription Plans)

> **Ngày hoàn thành**: 2026-06-11
> **Trạng thái**: ✅ Hoàn thành

---

## 1. Phát hiện và Phân tích các Module cần Seed dữ liệu
Khi duyệt qua tất cả các Entity định nghĩa bảng Database, chúng tôi phát hiện 2 vấn đề thiếu dữ liệu khởi tạo ảnh hưởng đến vận hành:
1. **Thiếu mã đơn vị thời gian (Duration Type Codes) trong AllCode**:
   - `SubscriptionPlan` có khóa ngoại `durationTypeCode` liên kết tới bảng `AllCode` (`keyMap`).
   - Logic thanh toán trong `payments.service.ts` xử lý thời hạn dựa trên các giá trị: `'MONTH'`, `'YEAR'`, và `'DAY'`.
   - Tuy nhiên, trong danh sách seed dữ liệu AllCode ban đầu (`allcodes.json`), các mã này hoàn toàn bị thiếu, dẫn đến việc không thể chèn được gói dịch vụ hoặc dữ liệu liên kết bị `null`.
2. **Bảng Gói dịch vụ (`SubscriptionPlan`) rỗng**:
   - Nếu khởi chạy lần đầu mà không có gói dịch vụ nào được định nghĩa sẵn, tính năng đăng ký VIP/Premium và VNPay Checkout trên ứng dụng sẽ không hoạt động (vì người dùng không có gói nào để chọn mua).

---

## 2. Các thay đổi đã triển khai

### Bổ sung Đơn vị thời gian vào `AllCode`
Đã cập nhật thêm 3 mã đơn vị thời gian chuẩn vào [allcodes.json](file:///home/quan/project/movie_project/ChillFlix_Backend/src/databases/seed-data/allcodes.json):
- `MONTH` (Tháng)
- `YEAR` (Năm)
- `DAY` (Ngày)
Tất cả thuộc nhóm `DURATION_TYPE`.

### Tạo Dữ liệu mẫu Gói dịch vụ
Tạo file [subscription-plans.json](file:///home/quan/project/movie_project/ChillFlix_Backend/src/databases/seed-data/subscription-plans.json) chứa 3 gói cước cở bản cho nền tảng ChillFlix:
1. **Gói 1 Tháng VIP**: 99,000 VND (thời hạn 1 Month).
2. **Gói 6 Tháng VIP**: 499,000 VND (thời hạn 6 Months).
3. **Gói 1 Năm Premium**: 899,000 VND (thời hạn 1 Year).

### Cấu hình Tự động Seed tại Startup
- **`databases.module.ts`**: Đã import `SubscriptionPlan` và khai báo trong `TypeOrmModule.forFeature`.
- **`databases.service.ts`**: Inject repo và thêm logic tự động kiểm tra số lượng gói cước, nếu bằng `0` sẽ tự động load file JSON cấy dữ liệu cước vào Database.

---

## 3. Xác thực (Verification)
- Kiểm tra biên dịch dự án: `npm run build` thành công tốt đẹp.
- Bảo đảm tính đồng bộ toàn vẹn tham chiếu khóa ngoại giữa `subscriptionPlans` và `AllCode`.
