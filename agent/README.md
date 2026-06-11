# Agent Documentation

Thu muc nay chua tai lieu ke hoach va trien khai cho tung task do AI Agent thuc hien.

## Cau truc

Moi sub-folder dai dien cho mot task/yeu cau cu the:

    agent/
    +-- README.md
    +-- <task-name>/
        +-- implementation-plan.md    # Ke hoach trien khai chi tiet
        +-- walkthrough.md            # Tom tat nhung gi da lam (sau khi hoan thanh)
        +-- notes.md                  # Ghi chu them neu co

## Quy uoc dat ten folder

- Dung kebab-case (chu thuong, noi bang dau -)
- Mo ta ngan gon muc dich task
- Vi du: optimize-database-seeder, add-payment-module, fix-auth-flow

## Danh sach Tasks

| Task | Mo ta | Trang thai |
|------|-------|-----------|
| [optimize-database-seeder](./optimize-database-seeder/) | Toi uu cau truc src/databases, chuyen data sang JSON | ✅ Hoan thanh |
| [roles-permissions-alignment](./roles-permissions-alignment/) | Điều chỉnh vai trò & quyền mẫu chuẩn xác, tạo vai trò mới | ✅ Hoan thanh |
| [subscription-plans-seeding](./subscription-plans-seeding/) | Khởi tạo đơn vị thời gian cước và tạo gói dịch vụ mẫu | ✅ Hoan thanh |
| [uuid-primary-keys](./uuid-primary-keys/) | Chuyển đổi khóa chính User sang UUID và cập nhật các module liên quan | ✅ Hoan thanh |
