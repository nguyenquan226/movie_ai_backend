# 03 — Database

> **Mô tả**: Database schema, 30 entity, pattern AllCode, TypeORM config, seed data, sync strategy.

---

## 1. Cấu hình TypeORM

**File config**: `src/app.module.ts` (inline `TypeOrmModule.forRootAsync`)

```typescript
{
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: parseInt(configService.get('DB_PORT') || '5432'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME'),
  entities: [ /* 30 entity */ ],
  synchronize: true,   // ⚠️ Tự động sync schema → DB (KHÔNG dùng migration)
}
```

- **Driver**: PostgreSQL (qua `pg`)
- **Sync strategy**: `synchronize: true` — schema tự động đồng bộ từ entity khi app khởi động. **Không có migration directory**.
- **Logger**: Đã comment out `logging: true`.

---

## 2. Danh sách Entity (30 entity)

### 2.1 Nhóm Người Dùng & Phân Quyền (Users & Auth)

| Entity | File | Table | Mô tả |
|--------|------|-------|-------|
| `User` | `modules/users/entities/user.entity.ts` | `user` | Người dùng: email, password (bcrypt), fullName, avatar, gender, role, refreshToken |
| `Role` | `modules/roles/entities/role.entity.ts` | `role` | Vai trò: ADMIN(1), MODERATOR(2), USER(3) |
| `Permission` | `modules/permissions/entities/permission.entity.ts` | `permission` | Quyền: apiPath, method, name, module |
| `RolePermission` | `modules/role_permission/entities/role_permission.entity.ts` | `role_permission` | Liên kết Role ↔ Permission (many-to-many) |

### 2.2 Nhóm Phim (Film Core)

| Entity | File | Table | Mô tả |
|--------|------|-------|-------|
| `Film` | `modules/films/entities/film.entity.ts` | `film` | Phim: title, slug, description, trailerUrl, releaseYear, country, genre, type, rank, language, status, isVip, view, imdbRating |
| `FilmGenre` | `modules/films/entities/film_genre.entity.ts` | `film_genre` | Liên kết Film ↔ AllCode (genre) (many-to-many) |
| `FilmImage` | `modules/films/entities/film_image.entity.ts` | `film_image` | Ảnh phim: type (poster, banner, thumbnail), url |

### 2.3 Nhóm Người (Cast & Crew)

| Entity | File | Table | Mô tả |
|--------|------|-------|-------|
| `Director` | `modules/directors/entities/director.entity.ts` | `director` | Đạo diễn: fullName, slug, avatar, bio, birthDate, country |
| `Actor` | `modules/actor/entities/actor.entity.ts` | `actor` | Diễn viên: fullName, slug, avatar, bio, birthDate, country |
| `Producer` | `modules/producers/entities/producer.entity.ts` | `producer` | Nhà sản xuất: fullName, slug, avatar, bio |
| `FilmDirector` | `modules/film_director/entities/film_director.entity.ts` | `film_director` | Liên kết Film ↔ Director |
| `FilmActor` | `modules/film_actor/entities/film_actor.entity.ts` | `film_actor` | Liên kết Film ↔ Actor (kèm characterName) |
| `FilmProducer` | `modules/film_producer/entities/film_producer.entity.ts` | `film_producer` | Liên kết Film ↔ Producer |

### 2.4 Nhóm Nội Dung Phim (Parts & Episodes)

| Entity | File | Table | Mô tả |
|--------|------|-------|-------|
| `Part` | `modules/parts/entities/part.entity.ts` | `part` | Phần/mùa của phim bộ: partNumber, title |
| `Episode` | `modules/episodes/entities/episode.entity.ts` | `episode` | Tập phim: episodeNumber, title, videoUrl, duration |

### 2.5 Nhóm Tương Tác (Social)

| Entity | File | Table | Mô tả |
|--------|------|-------|-------|
| `Comment` | `modules/comment/entities/comment.entity.ts` | `comment` | Bình luận: content, parentId (reply), isHidden |
| `CommentReaction` | `modules/comment-reaction/entities/comment-reaction.entity.ts` | `comment_reaction` | Reaction: type (like, love, ...) |
| `Rating` | `modules/rating/entities/rating.entity.ts` | `rating` | Đánh giá: score (1-5), isHidden |
| `Report` | `modules/report/entities/report.entity.ts` | `report` | Báo cáo vi phạm: reason, description, status |
| `Favorite` | `modules/favorites/entities/favorite.entity.ts` | `favorite` | Phim yêu thích của user |
| `Playlist` | `modules/playlists/entities/playlist.entity.ts` | `playlist` | Playlist của user: name, description, isPublic |
| `PlaylistFilm` | `modules/playlist-film/entities/playlist-film.entity.ts` | `playlist_film` | Liên kết Playlist ↔ Film |
| `Notification` | `modules/notifications/entities/notification.entity.ts` | `notification` | Thông báo: type, content, isRead |

### 2.6 Nhóm Thanh Toán & Subscription

| Entity | File | Table | Mô tả |
|--------|------|-------|-------|
| `SubscriptionPlan` | `modules/subscription-plans/entities/subscription-plan.entity.ts` | `subscription_plan` | Gói: name, price, duration (days), features |
| `Subscription` | `modules/subscriptions/entities/subscription.entity.ts` | `subscription` | Đăng ký của user: startDate, endDate, status |
| `Payment` | `modules/payments/entities/payment.entity.ts` | `payment` | Giao dịch: amount, status, transactionId, gateway (VNPay) |

### 2.7 Nhóm Khác

| Entity | File | Table | Mô tả |
|--------|------|-------|-------|
| `AllCode` | `modules/all-codes/entities/all-code.entity.ts` | `all_code` | Master lookup table: type, keyMap, valueEn, valueVi |
| `Markdown` | `modules/markdowns/entities/markdown.entity.ts` | `markdown` | Nội dung markdown: type, content |
| `RoomCoWatching` | `modules/co-watching/entities/co-watching.entity.ts` | `room_co_watching` | Phòng co-watching: roomCode, filmId, currentTime |

---

## 3. Pattern AllCode (Master Lookup Table)

Thay vì tạo bảng enum riêng cho từng loại (genre, country, status...), dự án dùng **một bảng duy nhất** `all_code`:

```
Table: all_code
┌────┬──────────┬──────────┬───────────┬───────────┐
│ id │ type     │ keyMap   │ valueEn   │ valueVi   │
├────┼──────────┼──────────┼───────────┼───────────┤
│ 1  │ ROLE     │ R1       │ Admin     │ Quản trị  │
│ 2  │ ROLE     │ R2       │ Moderator │ Điều hành │
│ 3  │ ROLE     │ R3       │ User      │ Người dùng│
│ 4  │ GENRE    │ G1       │ Action    │ Hành động │
│ 5  │ GENRE    │ G2       │ Comedy    │ Hài       │
│ 6  │ COUNTRY  │ C1       │ USA       │ Mỹ        │
│ 7  │ FILM_TYPE│ FT1      │ Movie     │ Phim lẻ   │
│ 8  │ RANK     │ RA1      │ PG-13     │ PG-13     │
│ ... │ ...      │ ...      │ ...       │ ...       │
└────┴──────────┴──────────┴───────────┴───────────┘
```

**Các loại `type` trong AllCode**:
- `ROLE` — Vai trò người dùng (R1=Admin, R2=Moderator, R3=User)
- `GENRE` — Thể loại phim
- `COUNTRY` — Quốc gia
- `FILM_TYPE` — Loại phim (phim lẻ, phim bộ)
- `RANK` — Xếp hạng độ tuổi (PG-13, R, ...)
- `VERSION` — Ngôn ngữ (phụ đề, thuyết minh, lồng tiếng)
- `GENDER` — Giới tính
- `USER_STATUS` — Trạng thái user
- `PUBLIC_STATUS` — Trạng thái công khai

**Cách sử dụng**:
```typescript
// Entity Film
@ManyToOne(() => AllCode)
@JoinColumn({ name: 'country', referencedColumnName: 'keyMap' })
country: AllCode;

// Query join
queryBuilder
  .leftJoinAndSelect('film.country', 'country')
  .leftJoinAndSelect('film.genre', 'genre');
```

**Utility helper**: `src/common/utils/join-allcode.ts` — tự động join tất cả cột AllCode trong entity.

---

## 4. Primary Key Strategy

- **UUID**: Các entity mới/chính dùng `@PrimaryGeneratedColumn('uuid')` (User, Film, Comment, Rating...)
- **Numeric Auto-increment**: Một số entity cũ dùng `@PrimaryGeneratedColumn()` (AllCode, Role, Permission...)

---

## 5. Audit & Soft Delete Columns

Hầu hết entity kế thừa các cột chung:

```typescript
@CreateDateColumn() createdAt: Date;
@UpdateDateColumn() updatedAt: Date;
@Column({ nullable: true }) createdBy: string;
@Column({ nullable: true }) updatedBy: string;
@Column({ nullable: true }) deletedAt: Date;    // Soft delete
@Column({ nullable: true }) deletedBy: string;  // Ai xóa
@Column({ default: false }) isDeleted: boolean; // Cờ xóa (một số entity)
```

---

## 6. Seed Data

**Module**: `DatabasesModule` → `DatabasesService.onModuleInit()`

**Cơ chế**:
1. Khi app khởi động, check `SHOULD_INIT` env (hiện tại hardcode `false`).
2. Nếu `true`, kiểm tra từng bảng có data chưa.
3. Nếu bảng trống → load JSON từ `src/databases/seed-data/` và insert.

**File seed data**:

| File | Nội dung |
|------|----------|
| `allcodes.json` | Toàn bộ lookup values (role, genre, country, rank, version, gender, status...) |
| `roles.json` | 3 roles: Admin, Moderator, User |
| `permissions.json` | Danh sách permission (apiPath, method, name, module) |
| `role-permissions.json` | Mapping Role ↔ Permission (Admin có tất cả, Moderator một phần) |
| `users.json` | 1 user admin (password hash từ `INIT_PASSWORD` env) |
| `subscription-plans.json` | Các gói subscription (Basic, Premium, VIP) |

---

## 7. Quan hệ Entity Diagram (Rút gọn)

```
User ──┬── Subscription ──── SubscriptionPlan
       ├── Payment
       ├── Comment ──── CommentReaction
       ├── Rating
       ├── Report
       ├── Favorite ──── Film
       ├── Playlist ──── PlaylistFilm ──── Film
       └── Notification

Film ──┬── FilmGenre ──── AllCode (type=GENRE)
       ├── FilmImage
       ├── FilmDirector ──── Director
       ├── FilmActor ──── Actor
       ├── FilmProducer ──── Producer
       ├── Part ──── Episode
       ├── Comment
       ├── Rating
       └── RoomCoWatching

Director, Actor, Producer → tham chiếu AllCode (country)

Role ──── RolePermission ──── Permission
User ──── Role

AllCode ← tham chiếu bởi Film (country, genre, type, rank, version...), User (gender, status)
```

---

## 8. Lưu ý khi làm việc với Database

1. **Không có migration** — mọi thay đổi entity sẽ tự sync khi restart app. Cẩn thận khi thay đổi schema trên production.
2. **Soft delete** — không xóa vật lý, chỉ set `isDeleted = true` hoặc `deletedAt = now()`. Dùng `{ withDeleted: true }` trong TypeORM để query cả record đã xóa.
3. **AllCode keyMap** — keyMap là unique identifier cho từng lookup value. Không thay đổi keyMap sau khi tạo vì các entity khác join qua keyMap.
4. **View counting** — lượt xem không update trực tiếp vào PostgreSQL mà buffer qua Redis, sync mỗi 2 phút qua cron job.
