# Phân tích & Đề xuất lựa chọn ID: Auto-Increment Number vs UUID

Tài liệu này đánh giá cấu trúc khóa chính (Primary Key - PK) hiện tại của dự án ChillFlix, phân tích ưu nhược điểm của việc sử dụng số tự tăng (Auto-Increment) so với khóa dạng UUID (Universally Unique Identifier) cho từng thực thể (Entity) cụ thể.

---

## 1. So sánh tổng quan giữa Auto-Increment và UUID

| Tiêu chí | Khóa Tự tăng (Auto-Increment Number) | Khóa UUID (Universally Unique Identifier) |
|---|---|---|
| **Kiểu dữ liệu** | `INT` / `BIGINT` (4 hoặc 8 bytes) | `UUID` / `VARCHAR(36)` (16 bytes) |
| **Bảo mật** | ❌ **Thấp** (Dễ bị tấn công vét cạn - ID Enumeration. Ví dụ: đổi `/api/users/1` thành `/api/users/2` để quét dữ liệu). |  **Cao** (Chuỗi ngẫu nhiên không đoán trước được, bảo mật tuyệt đối các đường dẫn tài nguyên công khai). |
| **Hiệu năng Ghi (Insert)** |  **Nhanh** (Dữ liệu chèn tuần tự vào cuối index B-Tree, không gây phân mảnh ổ đĩa). | ❌ **Chậm hơn** (Chèn ngẫu nhiên dẫn đến việc sắp xếp lại index liên tục - Page Splits). |
| **Phân tán & Đồng bộ** | ❌ **Khó** (Dễ bị trùng lặp ID khi đồng bộ giữa nhiều database hoặc microservices). |  **Rất tốt** (Có thể sinh ID duy nhất độc lập ở phía Client/Server mà không lo bị trùng lặp). |
| **Thân thiện URL** |  **Ngắn gọn** (Ví dụ: `chillflix.com/movies/12`) | ❌ **Dài dòng** (Ví dụ: `chillflix.com/movies/4f7e28a9-9e8c-4c7b-b5d1-b58ef1284d72`) |

---

## 2. Phân tích chi tiết từng Module trong ChillFlix

Dựa trên chức năng nghiệp vụ của ChillFlix (Nền tảng xem phim trực tuyến), dưới đây là phân tích và khuyến nghị cho từng nhóm bảng:

### Nhóm A: Bắt buộc/Khuyến nghị cao nên dùng **UUID**

Các bảng liên quan đến thông tin nhạy cảm của người dùng hoặc giao dịch tài chính tuyệt đối không được dùng số tự tăng công khai:

1. **User (Bảng: `users`)**
   - *Hiện tại*: `userId: number` (Tự tăng)
   - *Đề xuất*: **UUID**
   - *Lý do*: Tránh lộ tổng số lượng người dùng của hệ thống và ngăn chặn tin tặc quét thông tin người dùng qua API `/api/v1/users/:id`.

2. **Payment (Bảng: `payments`)**
   - *Hiện tại*: `paymentId: number` (Tự tăng)
   - *Đề xuất*: **UUID**
   - *Lý do*: Mã hóa đơn, mã thanh toán cần phải là duy nhất và không thể đoán trước để tránh giả mạo hóa đơn hoặc rò rỉ thông tin doanh thu giao dịch thanh toán.

3. **Subscription (Bảng: `subscriptions`)**
   - *Hiện tại*: `subscriptionId: number` (Tự tăng)
   - *Đề xuất*: **UUID**
   - *Lý do*: Thông tin đăng ký gói cước VIP của người dùng cần được bảo mật và truy cập thông qua UUID.

4. **Playlist (Bảng: `playlists`)**
   - *Hiện tại*: `playlistId: number` (Tự tăng)
   - *Đề xuất*: **UUID**
   - *Lý do*: Danh sách phát phim cá nhân của người dùng (có thể để chế độ ẩn hoặc chia sẻ liên kết). Dùng UUID giúp người khác không thể dò tìm danh sách phát của người dùng khác bằng cách tăng dần số ID trên URL.

---

### Nhóm B: Khuyến nghị dùng **Auto-Increment Number** (Nhưng ẩn trên URL bằng **Slug**)

Các bảng nội dung công khai, số lượng bản ghi lớn, cần hiệu năng tìm kiếm và liên kết join bảng nhanh:

1. **Film (Bảng: `films`)**
   - *Hiện tại*: `filmId: number` (Tự tăng) + cột `slug: string` (độc bản)
   - *Đề xuất*: **Auto-Increment** cho DB internal joins + **Slug** cho API/URL.
   - *Lý do*: Phim ảnh là thông tin công khai. Khi truy cập trang chi tiết phim trên UI, chúng ta sử dụng `/films/slug/inception-2010` thay vì ID số hay UUID. Việc giữ PK dạng số tự tăng trong DB giúp tăng tốc độ JOIN giữa bảng `films` với các bảng liên quan như `episodes`, `comments`, `genres`, `ratings` với chi phí lưu trữ thấp nhất.

2. **Actor, Director, Producer (Bảng: `actors`, `directors`, `producers`)**
   - *Hiện tại*: Tự tăng + `slug`
   - *Đề xuất*: **Auto-Increment** + **Slug**
   - *Lý do*: Tương tự như phim, người dùng tìm kiếm diễn viên qua tên hoặc slug trên URL. Sử dụng ID số giúp liên kết bảng trung gian `film_actors`, `film_directors` chạy nhanh hơn nhiều.

3. **Episode, Part (Bảng: `episodes`, `parts`)**
   - *Hiện tại*: Tự tăng
   - *Đề xuất*: **Auto-Increment**
   - *Lý do*: Các tập phim (Tập 1, Tập 2...) thuộc về một bộ phim cụ thể, số lượng rất nhiều và được truy xuất đi kèm phim chính. Dùng khóa tự tăng giúp sắp xếp thứ tự xem tự nhiên và tối ưu bộ nhớ cache index.

---

### Nhóm C: Dữ liệu cấu hình / Bảng trung gian (Giữ **Auto-Increment**)

1. **AllCode (Bảng: `allcodes`)**
   - *Hiện tại*: `id: number` (Tự tăng) + `keyMap` (độc bản)
   - *Đề xuất*: **Auto-Increment**
   - *Lý do*: Đây là bảng từ điển cố định (như thể loại phim, giới tính, trạng thái). Các bảng khác liên kết với nó bằng `keyMap` (chuỗi text như `G_ACTION`, `US_ACTIVE`) hoặc ID. Số lượng bản ghi cực nhỏ (vài chục dòng), không cần bảo mật ID.

2. **Role, Permission (Bảng: `roles`, `permissions`)**
   - *Hiện tại*: Tự tăng
   - *Đề xuất*: **Auto-Increment**
   - *Lý do*: Vai trò và danh sách quyền là tĩnh, chỉ được cấu hình bởi quản trị viên hệ thống.

3. **Bảng liên kết nhiều-nhiều (`film_genres`, `film_actors`, `role_permissions`...)**
   - *Hiện tại*: Tự tăng hoặc composite key.
   - *Đề xuất*: Không cần ID đơn lẻ, hoặc dùng **Auto-Increment** nếu TypeORM bắt buộc.

---

### Nhóm D: Tương tác người dùng (Cân nhắc **UUID** hoặc **Auto-Increment**)

1. **Comment, Rating (Bảng: `comment`, `rating`)**
   - *Hiện tại*: Tự tăng
   - *Đề xuất*: **Auto-Increment** (Nếu lượng comment/đánh giá cực lớn để tối ưu tốc độ chèn) hoặc **UUID** (Nếu lo ngại đối thủ cào dữ liệu bình luận hàng loạt qua API endpoint).

---

## 3. Cách chuyển đổi sang UUID trong TypeORM

Nếu quyết định áp dụng UUID cho Nhóm A (`User`, `Payment`, `Subscription`, `Playlist`), bạn chỉ cần cập nhật Entity trong TypeORM như sau:

```typescript
// Ví dụ chuyển đổi User sang UUID
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid') // Thay đổi từ default sang 'uuid'
  userId: string; // Chuyển kiểu dữ liệu sang string
  
  // ... các cột khác giữ nguyên
}
```

*Lưu ý*: Database PostgreSQL hoặc MySQL cần hỗ trợ kiểu dữ liệu UUID tự sinh. TypeORM sẽ tự động xử lý khi sinh migration.
