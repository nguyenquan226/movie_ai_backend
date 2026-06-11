# Toi uu cau truc src/databases - Database Seeder Module

> **Ngay tao**: 2026-06-11
> **Trang thai**: Dang cho duyet

---

## Phan tich hien trang

### Cau truc hien tai

- databases.controller.ts: Controller rong, khong dung
- databases.module.ts: Module inject qua nhieu dependency
- databases.service.ts: 401 dong - chua data users hardcode inline
- sample.allcode.ts: FILE TRUNG LAP voi sampleData/sample.allcode.ts
- sampleData/sample.allcode.ts: 1818 dong
- sampleData/sample.permission.ts: 488 dong
- sampleData/role_permission.ts: 253 dong
- seeds/init_permisison.ts: 1022 dong - BAN CHUAN

### Van de hien tai

| Van de | Mo ta |
|---------|-------|
| Data hardcode trong service | ~250 dong user data nam truc tiep trong databases.service.ts |
| File trung lap | sample.allcode.ts ton tai o ca root va sampleData/ |
| Data dang TypeScript | Sample data viet duoi dang TS export, khong the tai su dung ngoai code |
| Role data hardcode | Data roles nam inline trong service thay vi tach rieng |
| Service qua tai | databases.service.ts vua chua logic seed vua chua data |
| Controller rong | databases.controller.ts khong co route nao |

---

## Cac quyet dinh da xac nhan

| Cau hoi | Quyet dinh | Ly do |
|----------|-----------|-------|
| Ban permissions nao? | seeds/init_permisison.ts (1022 dong) | User chon |
| Controller rong? | Xoa | Chi duoc reference trong databases.module.ts |
| resolveJsonModule? | Them vao tsconfig.json | Hien chua co trong config |

---

## Cau truc moi (de xuat)

- databases.module.ts: Module gon, bo controller
- databases.service.ts: Service gon ~80-100 dong, chi logic seed
- seed-data/allcodes.json: AllCode data
- seed-data/roles.json: Roles data
- seed-data/users.json: Users template (khong chua password hash)
- seed-data/permissions.json: Tu seeds/init_permisison.ts
- seed-data/role-permissions.json: RolePermission mapping
- helpers/seed-data.loader.ts: Generic helper doc JSON files

### Tai sao dung JSON thay vi TypeScript?

- De doc/chinh sua: JSON la format tieu chuan
- Tai su dung: Co the dung cho migration scripts, test fixtures, API mock
- Tach biet data vs logic
- Tooling ho tro tot: JSON Schema validate, auto-complete trong IDE
- Import don gian: NestJS/TypeScript ho tro import truc tiep voi resolveJsonModule

---

## Chi tiet thay doi

### 1. Config
- [MODIFY] tsconfig.json: Them resolveJsonModule: true

### 2. Tao JSON seed data files
- [NEW] src/databases/seed-data/allcodes.json
- [NEW] src/databases/seed-data/roles.json
- [NEW] src/databases/seed-data/users.json
- [NEW] src/databases/seed-data/permissions.json
- [NEW] src/databases/seed-data/role-permissions.json

### 3. Helper & Service
- [NEW] src/databases/helpers/seed-data.loader.ts
- [MODIFY] src/databases/databases.service.ts: Xoa inline data, import tu JSON
- [MODIFY] src/databases/databases.module.ts: Xoa DatabasesController

### 4. Xoa files thua
- [DELETE] src/databases/databases.controller.ts
- [DELETE] src/databases/sample.allcode.ts
- [DELETE] src/databases/sampleData/ (toan bo)
- [DELETE] src/databases/seeds/ (toan bo)

---

## Verification Plan

- npm run build (dam bao compile thanh cong)
- npm run start:dev (dam bao seeder chay dung khi startup)
- Kiem tra log output seed data
- Verify JSON files match data tu TS files cu
