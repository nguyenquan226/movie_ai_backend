# ChillFlix Backend — Tài Liệu Dự Án

> **Mục lục tổng quan** — file này liệt kê tất cả các file tài liệu của dự án, mô tả ngắn gọn nội dung từng file và đường dẫn tương đối.

---

## Danh sách file tài liệu

| # | File | Mô tả |
|---|------|-------|
| 00 | `00-index.md` | Mục lục tổng quan (file này) |
| 01 | `01-architecture.md` | Kiến trúc tổng thể: cây thư mục, pattern NestJS, luồng request, middleware/guard/interceptor |
| 02 | `02-api-overview.md` | Tổng quan API: versioning, response convention (EC/EM), danh sách toàn bộ controller và endpoint |
| 03 | `03-database.md` | Database: 30 entity, pattern AllCode, TypeORM config, seed data, sync strategy |
| 04 | `04-modules.md` | Chi tiết 36 module: chức năng, service, controller, entity liên quan, dependency |
| 05 | `05-authentication-authorization.md` | Auth: JWT (access + refresh token), Local Strategy, Guards, Permission system, Decorators |
| 06 | `06-third-party-integrations.md` | Tích hợp bên thứ ba: Cloudinary, Mux Video, VNPay, Elasticsearch, Gemini AI, Nodemailer, Bull, Puppeteer |
| 07 | `07-configuration.md` | Cấu hình: toàn bộ biến môi trường (.env), file config (Bull, Multer), constants |
| 08 | `08-infrastructure.md` | Hạ tầng: Docker Compose (PostgreSQL, Redis, Elasticsearch), queue Bull, cron job, Makefile |
| 09 | `09-websocket-realtime.md` | WebSocket: 4 Gateway (Watch, Comment, Rating, Report), cơ chế broadcast, quản lý room |
| 10 | `10-business-rules.md` | Business rules: phân quyền, subscription/payment, soft delete, view counting, comment hierarchy, upload flow |
| 11 | `11-setup-development.md` | Hướng dẫn setup môi trường dev: cài đặt, biến môi trường, Docker services, seed data, chạy app |

---

## Cách sử dụng

1. **Developer mới**: đọc theo thứ tự `11 → 01 → 02 → 05` để nắm cách chạy + kiến trúc + API + auth.
2. **Làm việc với database**: đọc `03` và `10` (phần AllCode).
3. **Tích hợp bên thứ ba**: đọc `06`.
4. **Làm việc với realtime**: đọc `09`.
5. **Triển khai / DevOps**: đọc `08` và `07`.

Tất cả file đều được viết dưới dạng Markdown, tối ưu cho cả người đọc và AI (DeepSeek, Claude) parse.
