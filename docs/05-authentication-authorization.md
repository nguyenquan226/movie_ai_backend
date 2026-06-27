# 05 — Authentication & Authorization

> **Mô tả**: Auth flow (JWT access + refresh token), Local Strategy, Guards, Permission system, Decorators.

---

## 1. Tổng quan

Hệ thống auth gồm 2 lớp:
1. **Authentication** — Xác thực danh tính (là ai?)
2. **Authorization** — Phân quyền truy cập (được làm gì?)

---

## 2. Authentication Flow

### 2.1 Đăng nhập

```
POST /api/v1/auth/login
Body: { email, password }
         │
         ▼
┌─────────────────────┐
│ LocalAuthGuard      │  ← passport-local (usernameField: 'email')
│ → LocalStrategy     │
│ → AuthService       │
│   .validateUser()   │  ← Tìm user theo email, so sánh password (bcrypt)
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ AuthService.login() │
│ 1. Tạo accessToken  │  ← JWT (ACCESS_TOKEN_SECRET, ACCESS_TOKEN_expiresIn)
│ 2. Tạo refreshToken │  ← JWT (REFRESH_TOKEN_SECRET, REFRESH_TOKEN_expiresIn)
│ 3. Lưu refreshToken │  ← users.refreshToken trong DB
│ 4. Set cookie       │  ← httpOnly cookie 'refresh_token'
│ 5. Return {         │
│      EC: 0,         │
│      accessToken,   │
│      user           │
│    }                │
└─────────────────────┘
```

### 2.2 Refresh Token

```
POST /api/v1/auth/refresh-token
Cookie: refresh_token=<token>
         │
         ▼
┌────────────────────────────────┐
│ AuthService.refreshToken()     │
│ 1. Verify refresh token (JWT) │
│ 2. Tìm user theo id trong     │
│    token payload               │
│ 3. So sánh với                 │
│    user.refreshToken trong DB  │  ← Token rotation
│ 4. Tạo cặp token mới          │
│ 5. Cập nhật refreshToken      │
│    trong DB                    │
│ 6. Return accessToken mới      │
└────────────────────────────────┘
```

### 2.3 Đăng xuất

```
POST /api/v1/auth/logout
Header: Authorization: Bearer <accessToken>
         │
         ▼
┌────────────────────────────────┐
│ AuthService.logout()           │
│ 1. Xóa user.refreshToken       │
│    trong DB (= null)           │
│ 2. Clear cookie 'refresh_token'│
└────────────────────────────────┘
```

### 2.4 Đăng ký

```
POST /api/v1/auth/register
Body: { email, password, fullName, ... }
         │
         ▼
┌────────────────────────────────┐
│ AuthService.register()         │
│ 1. Validate email uniqueness   │
│ 2. Hash password (bcryptjs)    │
│ 3. Tạo user (role mặc định:    │
│    USER/R3)                    │
│ 4. Gửi email welcome           │
│ 5. Return user info            │
└────────────────────────────────┘
```

---

## 3. JWT Token Payload

Access token payload:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "roleId": 1,
  "roleName": "Admin",
  "permissions": [
    { "apiPath": "/api/v1/films", "method": "GET", "name": "Xem phim" },
    { "apiPath": "/api/v1/films", "method": "POST", "name": "Tạo phim" }
  ],
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## 4. Guards

### 4.1 JwtAuthGuard (Global)

- **Class**: `src/modules/auth/jwt-auth.guard.ts`
- **Extends**: `AuthGuard('jwt')` từ `@nestjs/passport`
- **Đăng ký**: Global trong `main.ts` (`app.useGlobalGuards(new JwtAuthGuard(reflector))`)
- **Hoạt động**:

```
Request
  │
  ▼
canActivate()
  │
  ├── Check @Public() decorator → ✅ Pass (không cần token)
  │
  └── Gọi super.canActivate() → passport-jwt strategy
        │
        ▼
      JwtStrategy.validate(payload)
        │
        ▼
      handleRequest(err, user, info, context)
        │
        ├── err hoặc !user → throw UnauthorizedException
        │
        ├── Check @SkipCheckPermission() → pass
        │
        ├── Check permission:
        │   ┌─────────────────────────────────────┐
        │   │ Tìm trong user.permissions:         │
        │   │   apiPath === request.route.path    │
        │   │   AND method === request.method     │
        │   │                                     │
        │   │ Nếu endpoint /api/v1/auth/* → pass  │
        │   │                                     │
        │   │ Nếu không tìm thấy                   │
        │   │   → throw ForbiddenException       │
        │   └─────────────────────────────────────┘
        │
        └── return user → gán vào req.user
```

### 4.2 LocalAuthGuard

- **Class**: `AuthGuard('local')` standard
- **Dùng cho**: Chỉ route `/api/v1/auth/login`
- **Hoạt động**: Gọi `LocalStrategy.validate(username, password)` → `AuthService.validateUser()`

---

## 5. Custom Decorators

| Decorator | File | Mục đích |
|-----------|------|----------|
| `@Public()` | `decorators/customize.ts` | Bỏ qua JWT authentication cho route |
| `@SkipCheckPermission()` | `decorators/customize.ts` | Bỏ qua permission check (vẫn cần token) |
| `@User()` | `decorators/customize.ts` | Custom parameter decorator lấy `req.user` |
| `@ResponseMessage('msg')` | `decorators/customize.ts` | Set metadata cho response message (dùng trong TransformInterceptor) |
| `@Permission(name, module)` | `decorators/permission.decorator.ts` | Metadata decorator (dùng để document/seed permission, không dùng trong guard) |

**Cách dùng**:
```typescript
@Public()
@Post('login')
async login() { ... }

@SkipCheckPermission()
@Get('account')
async account(@User() user) { ... }

@ResponseMessage('Tạo phim thành công')
@Post('films')
async create() { ... }

@Permission('Xem danh sách phim', 'Films')
@Get('films')
async findAll() { ... }
```

---

## 6. Permission System

### 6.1 Cấu trúc dữ liệu

```
Table: permission
┌────┬──────────────────────┬────────┬─────────────────────┬──────────┐
│ id │ apiPath              │ method │ name                │ module   │
├────┼──────────────────────┼────────┼─────────────────────┼──────────┤
│ 1  │ /api/v1/films        │ GET    │ Xem danh sách phim  │ Films    │
│ 2  │ /api/v1/films        │ POST   │ Tạo phim mới        │ Films    │
│ 3  │ /api/v1/films/:id    │ PATCH  │ Cập nhật phim       │ Films    │
│ 4  │ /api/v1/films/:id    │ DELETE │ Xóa phim            │ Films    │
│ 5  │ /api/v1/users        │ GET    │ Xem danh sách user  │ Users    │
│ ...│ ...                  │ ...    │ ...                 │ ...      │
└────┴──────────────────────┴────────┴─────────────────────┴──────────┘

Table: role_permission
┌────┬─────────┬───────────────┐
│ id │ roleId  │ permissionId  │
├────┼─────────┼───────────────┤
│ 1  │ 1(Admin)│ 1             │
│ 2  │ 1(Admin)│ 2             │
│ 3  │ 2(Mod)  │ 1             │  ← Moderator chỉ có quyền GET films
│ ...│ ...     │ ...           │
└────┴─────────┴───────────────┘
```

### 6.2 Cách hoạt động

1. Khi user đăng nhập, `JwtStrategy.validate()` query permissions từ DB qua `RolePermission` join.
2. Permission được nhúng vào JWT payload dưới dạng array.
3. `JwtAuthGuard.handleRequest()` so sánh `req.route.path` + `req.method` với permissions array.
4. Nếu không match → `403 Forbidden`.

### 6.3 Role mặc định

| Role | keyMap | Mô tả |
|------|--------|-------|
| Admin | R1 | Toàn quyền (tất cả permission) |
| Moderator | R2 | Quyền giới hạn (xem + quản lý content) |
| User | R3 | Quyền cơ bản (xem, comment, rating, favorite) |

---

## 7. Cấu hình JWT

| Biến môi trường | Mục đích |
|-----------------|----------|
| `ACCESS_TOKEN_SECRET` | Secret key ký access token |
| `ACCESS_TOKEN_expiresIn` | Thời hạn access token (vd: `15m`, `1h`, `7d`) |
| `REFRESH_TOKEN_SECRET` | Secret key ký refresh token |
| `REFRESH_TOKEN_expiresIn` | Thời hạn refresh token (vd: `7d`, `30d`) |

---

## 8. Lưu ý bảo mật

1. **Refresh token rotation** — mỗi lần refresh, token cũ bị vô hiệu (thay thế trong DB).
2. **httpOnly cookie** — refresh token không thể truy cập từ JavaScript.
3. **Bcrypt hash** — password được hash với salt rounds mặc định của bcryptjs.
4. **Không có rate limiting** cho login — nên thêm ở production.
5. **Permission trong JWT** — nếu permission thay đổi, user cần logout + login lại để có permission mới.
