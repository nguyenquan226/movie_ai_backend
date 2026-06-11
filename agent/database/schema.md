# ChillFlix Backend - Database Schema Catalog

Tài liệu này mô tả chi tiết cấu trúc Database Schema hiện có trong ứng dụng ChillFlix, bao gồm định nghĩa các bảng, kiểu dữ liệu, các ràng buộc và mối quan hệ khóa ngoại giữa các bảng.

## 1. Sơ đồ Quan hệ Khóa ngoại (Foreign Keys / Relationships)

Dưới đây là bảng tổng hợp các mối liên kết khóa ngoại giữa các thực thể:

| Bảng nguồn (Source Table) | Khóa ngoại (Foreign Key) | Bảng đích (Target Table) | Khóa chính đích (Target PK) | Loại quan hệ (Relation Type) |
|---|---|---|---|---|
| `actors` | `gender_code` | `allcodes` | `keyMap` | `ManyToOne` |
| `actors` | `nationality_code` | `allcodes` | `keyMap` | `ManyToOne` |
| `comment` | `episodeId` | `episodes` | `id` | `ManyToOne` |
| `comment` | `filmId` | `films` | `id` | `ManyToOne` |
| `comment` | `parentId` | `comment` | `id` | `ManyToOne` |
| `comment` | `partId` | `parts` | `id` | `ManyToOne` |
| `comment` | `userId` | `users` | `id` | `ManyToOne` |
| `comment-reaction` | `commentId` | `comment` | `id` | `ManyToOne` |
| `comment-reaction` | `userId` | `users` | `id` | `ManyToOne` |
| `directors` | `gender_code` | `allcodes` | `keyMap` | `ManyToOne` |
| `directors` | `nationality_code` | `allcodes` | `keyMap` | `ManyToOne` |
| `episodes` | `partId` | `parts` | `id` | `ManyToOne` |
| `favorites` | `film_id` | `films` | `filmId` | `ManyToOne` |
| `favorites` | `user_id` | `users` | `userId` | `ManyToOne` |
| `film_actors` | `actor_id` | `actors` | `actorId` | `ManyToOne` |
| `film_actors` | `film_id` | `films` | `filmId` | `ManyToOne` |
| `film_directors` | `director_id` | `directors` | `directorId` | `ManyToOne` |
| `film_directors` | `film_id` | `films` | `filmId` | `ManyToOne` |
| `film_genre` | `filmId` | `films` | `id` | `ManyToOne` |
| `film_genre` | `genreCode` | `allcodes` | `keyMap` | `ManyToOne` |
| `film_images` | `filmId` | `films` | `id` | `ManyToOne` |
| `film_producers` | `film_id` | `films` | `filmId` | `ManyToOne` |
| `film_producers` | `producer_id` | `producers` | `producerId` | `ManyToOne` |
| `films` | `ageCode` | `allcodes` | `keyMap` | `ManyToOne` |
| `films` | `countryCode` | `allcodes` | `keyMap` | `ManyToOne` |
| `films` | `createdById` | `users` | `id` | `ManyToOne` |
| `films` | `deletedById` | `users` | `id` | `ManyToOne` |
| `films` | `langCode` | `allcodes` | `keyMap` | `ManyToOne` |
| `films` | `publicStatusCode` | `allcodes` | `keyMap` | `ManyToOne` |
| `films` | `typeCode` | `allcodes` | `keyMap` | `ManyToOne` |
| `films` | `updatedById` | `users` | `id` | `ManyToOne` |
| `notifications` | `replierId` | `users` | `id` | `ManyToOne` |
| `notifications` | `userId` | `users` | `id` | `ManyToOne` |
| `parts` | `filmId` | `films` | `id` | `ManyToOne` |
| `payments` | `user_id` | `users` | `userId` | `ManyToOne` |
| `playlist-film` | `filmId` | `films` | `filmId` | `ManyToOne` |
| `playlist-film` | `playlistId` | `playlists` | `playlistId` | `ManyToOne` |
| `playlists` | `userId` | `users` | `userId` | `ManyToOne` |
| `rating` | `filmId` | `films` | `id` | `ManyToOne` |
| `rating` | `userId` | `users` | `id` | `ManyToOne` |
| `reports` | `reporterId` | `users` | `id` | `ManyToOne` |
| `reports` | `reviewedBy` | `users` | `id` | `ManyToOne` |
| `rolepermissions` | `permission_id` | `permissions` | `permissionId` | `ManyToOne` |
| `rolepermissions` | `role_id` | `roles` | `roleId` | `ManyToOne` |
| `rooms_co_watching` | `filmId` | `films` | `filmId` | `ManyToOne` |
| `rooms_co_watching` | `hostId` | `users` | `userId` | `ManyToOne` |
| `subscriptionPlans` | `durationType_code` | `allcodes` | `keyMap` | `ManyToOne` |
| `subscriptions` | `payment_id` | `payments` | `paymentId` | `OneToOne` |
| `subscriptions` | `plan_id` | `subscriptionPlans` | `planId` | `ManyToOne` |
| `subscriptions` | `user_id` | `users` | `userId` | `ManyToOne` |
| `users` | `gender_code` | `allcodes` | `keyMap` | `ManyToOne` |
| `users` | `role_id` | `roles` | `roleId` | `ManyToOne` |
| `users` | `status_code` | `allcodes` | `keyMap` | `ManyToOne` |

## 2. Chi tiết cấu trúc các Bảng (Tables Definition)

### Actor (Bảng: `actors`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `actor_id` | `number` | ✅ | ✅ | `None` |
| `actor_name` | `varchar` |  | ✅ | `None` |
| `slug` | `varchar` |  | ✅ | `None` |
| `shortBio` | `text` |  | ✅ | `None` |
| `gender_code` | `varchar` |  | ✅ | `None` |
| `birth_date` | `date` |  | ✅ | `None` |
| `nationality_code` | `varchar` |  | ✅ | `None` |
| `avatar_url` | `text` |  | ✅ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### AllCode (Bảng: `allcodes`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `id` | `number` | ✅ | ✅ | `None` |
| `keyMap` | `string` |  | ❌ | `None` |
| `type` | `string` |  | ❌ | `None` |
| `valueEn` | `string` |  | ✅ | `None` |
| `valueVi` | `string` |  | ❌ | `None` |
| `description` | `string` |  | ✅ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |

### Comment (Bảng: `comment`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `commentId` | `string` | ✅ | ✅ | `None` |
| `content` | `text` |  | ✅ | `None` |
| `isHidden` | `boolean` |  | ✅ | `false` |
| `totalLike` | `number` |  | ✅ | `0` |
| `totalDislike` | `number` |  | ✅ | `0` |
| `totalChildrenComment` | `number` |  | ✅ | `0` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### CommentReaction (Bảng: `comment-reaction`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `commentReactionId` | `string` | ✅ | ✅ | `None` |
| `type` | `enum` |  | ✅ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |

### Director (Bảng: `directors`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `director_id` | `number` | ✅ | ✅ | `None` |
| `director_name` | `varchar` |  | ✅ | `None` |
| `slug` | `varchar` |  | ✅ | `None` |
| `birth_date` | `date` |  | ✅ | `None` |
| `gender_code` | `varchar` |  | ✅ | `None` |
| `story` | `text` |  | ✅ | `None` |
| `avatarUrl` | `text` |  | ✅ | `None` |
| `nationality_code` | `varchar` |  | ✅ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### Episode (Bảng: `episodes`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `id` | `string` | ✅ | ✅ | `None` |
| `episodeNumber` | `int` |  | ✅ | `None` |
| `title` | `string` |  | ❌ | `None` |
| `slug` | `string` |  | ❌ | `None` |
| `duration` | `int` |  | ❌ | `None` |
| `videoUrl` | `string` |  | ❌ | `None` |
| `thumbUrl` | `string` |  | ❌ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `string` |  | ✅ | `None` |
| `updatedBy` | `string` |  | ✅ | `None` |
| `deletedBy` | `string` |  | ✅ | `None` |
| `partId` | `uuid` |  | ❌ | `None` |

### Favorite (Bảng: `favorites`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `favId` | `string` | ✅ | ✅ | `None` |
| `user_id` | `number` |  | ✅ | `None` |
| `film_id` | `string` |  | ✅ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |

### Film (Bảng: `films`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `filmId` | `string` | ✅ | ✅ | `None` |
| `originalTitle` | `string` |  | ❌ | `None` |
| `title` | `string` |  | ❌ | `None` |
| `description` | `text` |  | ❌ | `None` |
| `releaseDate` | `date` |  | ❌ | `None` |
| `year` | `string` |  | ❌ | `None` |
| `thumbUrl` | `string` |  | ❌ | `None` |
| `slug` | `string` |  | ❌ | `None` |
| `duration` | `int` |  | ✅ | `0` |
| `view` | `int` |  | ❌ | `0` |
| `isVip` | `boolean` |  | ❌ | `false` |
| `ageCode` | `string` |  | ❌ | `None` |
| `typeCode` | `string` |  | ❌ | `None` |
| `countryCode` | `string` |  | ❌ | `None` |
| `langCode` | `string` |  | ❌ | `None` |
| `publicStatusCode` | `string` |  | ❌ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdById` | `string` |  | ✅ | `None` |
| `updatedById` | `string` |  | ✅ | `None` |
| `deletedById` | `string` |  | ✅ | `None` |

### FilmActor (Bảng: `film_actors`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `film_actor_id` | `number` | ✅ | ✅ | `None` |
| `character_name` | `string` |  | ✅ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### FilmDirector (Bảng: `film_directors`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `film_director_id` | `number` | ✅ | ✅ | `None` |
| `is_main` | `boolean` |  | ✅ | `None` |
| `created_at` | `Date` |  | ✅ | `None` |
| `updated_at` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### FilmGenre (Bảng: `film_genre`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `id` | `string` | ✅ | ✅ | `None` |
| `filmId` | `uuid` |  | ✅ | `None` |
| `genreCode` | `string` |  | ❌ | `None` |

### FilmImage (Bảng: `film_images`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `id` | `string` | ✅ | ✅ | `None` |
| `filmId` | `uuid` |  | ✅ | `None` |
| `url` | `string` |  | ❌ | `None` |
| `type` | `enum` |  | ✅ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |

### FilmProducer (Bảng: `film_producers`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `film_producer_id` | `number` | ✅ | ✅ | `None` |
| `is_main` | `boolean` |  | ✅ | `None` |
| `created_at` | `Date` |  | ✅ | `None` |
| `updated_at` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### Markdown (Bảng: `markdowns`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `markdownId` | `number` | ✅ | ✅ | `None` |
| `markdownContent` | `text` |  | ✅ | `None` |
| `htmlContent` | `text` |  | ✅ | `None` |
| `shortDescription` | `text` |  | ✅ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### Notification (Bảng: `notifications`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `notificationId` | `number` | ✅ | ✅ | `None` |
| `type` | `varchar` |  | ✅ | `None` |
| `message` | `text` |  | ✅ | `None` |
| `result` | `json` |  | ✅ | `None` |
| `isRead` | `boolean` |  | ✅ | `false` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |

### Part (Bảng: `parts`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `id` | `string` | ✅ | ✅ | `None` |
| `title` | `string` |  | ✅ | `None` |
| `partNumber` | `int` |  | ❌ | `None` |
| `description` | `text` |  | ❌ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `string` |  | ✅ | `None` |
| `updatedBy` | `string` |  | ✅ | `None` |
| `deletedBy` | `string` |  | ✅ | `None` |
| `filmId` | `uuid` |  | ❌ | `None` |

### Payment (Bảng: `payments`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `paymentId` | `string` | ✅ | ✅ | `None` |
| `user_id` | `number` |  | ✅ | `None` |
| `plan_id` | `number` |  | ✅ | `None` |
| `amount` | `decimal` |  | ✅ | `None` |
| `type` | `'enum',` |  | ✅ | `None` |
| `type` | `'enum',` |  | ✅ | `None` |
| `vnpayTxnRef` | `string; // Mã giao dịch của VNPay` |  | ✅ | `None` |
| `vnpayResponseCode` | `string; // Mã phản hồi từ VNPay` |  | ✅ | `None` |
| `vnpayBankCode` | `string; // Mã ngân hàng` |  | ✅ | `None` |
| `vnpayTransactionNo` | `string; // Mã giao dịch` |  | ✅ | `None` |
| `vnpayOrderInfo` | `text` |  | ✅ | `None` |
| `vnpayPayDate` | `timestamp` |  | ✅ | `None` |
| `description` | `text` |  | ✅ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |

### Permission (Bảng: `permissions`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `permissionId` | `number` | ✅ | ✅ | `None` |
| `name` | `string` |  | ✅ | `None` |
| `apiPath` | `string` |  | ✅ | `None` |
| `method` | `string` |  | ✅ | `None` |
| `module` | `string` |  | ✅ | `None` |
| `isDeleted` | `boolean` |  | ✅ | `false` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### Playlist (Bảng: `playlists`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `playlistId` | `string` | ✅ | ✅ | `None` |
| `userId` | `number` |  | ✅ | `None` |
| `playlistName` | `string` |  | ✅ | `None` |
| `description` | `string` |  | ✅ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |

### PlaylistFilm (Bảng: `playlist-film`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `id` | `string` | ✅ | ✅ | `None` |
| `playlistId` | `string` |  | ✅ | `None` |
| `filmId` | `string` |  | ✅ | `None` |
| `position` | `int` |  | ✅ | `None` |
| `addedAt` | `Date` |  | ✅ | `None` |

### Producer (Bảng: `producers`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `producer_id` | `number` | ✅ | ✅ | `None` |
| `producer_name` | `varchar` |  | ✅ | `None` |
| `slug` | `varchar` |  | ✅ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### Rating (Bảng: `rating`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `ratingId` | `string` | ✅ | ✅ | `None` |
| `ratingValue` | `float` |  | ✅ | `0` |
| `content` | `text` |  | ✅ | `None` |
| `isHidden` | `boolean` |  | ✅ | `false` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### Report (Bảng: `reports`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `reportId` | `string` | ✅ | ✅ | `None` |
| `type` | `'enum',` |  | ✅ | `None` |
| `targetId` | `varchar` |  | ✅ | `None` |
| `reason` | `varchar` |  | ✅ | `None` |
| `description` | `text` |  | ✅ | `None` |
| `type` | `'enum',` |  | ✅ | `None` |
| `reviewNote` | `text` |  | ✅ | `None` |
| `reviewedAt` | `timestamp` |  | ✅ | `None` |
| `createdAt` | `Date` |  | ✅ | `None` |

### Role (Bảng: `roles`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `roleId` | `number` | ✅ | ✅ | `None` |
| `roleName` | `string` |  | ✅ | `None` |
| `description` | `string` |  | ✅ | `None` |
| `isActive` | `boolean` |  | ✅ | `true` |
| `isDeleted` | `boolean` |  | ✅ | `false` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### RolePermission (Bảng: `rolepermissions`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `rolePermissionId` | `number` | ✅ | ✅ | `None` |
| `role_id` | `number` |  | ✅ | `None` |
| `permission_id` | `number` |  | ✅ | `None` |
| `isDeleted` | `boolean` |  | ✅ | `false` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### RoomCoWatching (Bảng: `rooms_co_watching`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `roomId` | `string` | ✅ | ✅ | `None` |
| `name` | `string` |  | ❌ | `None` |
| `hostId` | `number` |  | ❌ | `None` |
| `filmId` | `uuid` |  | ❌ | `None` |
| `partNumber` | `number` |  | ❌ | `None` |
| `episodeNumber` | `number` |  | ❌ | `None` |
| `thumbUrl` | `string` |  | ❌ | `None` |
| `isLive` | `boolean` |  | ✅ | `true` |
| `isPrivate` | `boolean` |  | ✅ | `false` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `duration` | `int` |  | ✅ | `0` |

### Search (Bảng: `searchs`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|

### Subscription (Bảng: `subscriptions`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `subscriptionId` | `string` | ✅ | ✅ | `None` |
| `user_id` | `number` |  | ✅ | `None` |
| `plan_id` | `number` |  | ✅ | `None` |
| `payment_id` | `uuid` |  | ✅ | `None` |
| `startDate` | `timestamp` |  | ✅ | `None` |
| `endDate` | `timestamp` |  | ✅ | `None` |
| `type` | `'enum',` |  | ✅ | `None` |
| `autoRenew` | `boolean` |  | ✅ | `false` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### SubscriptionPlan (Bảng: `subscriptionPlans`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `planId` | `number` | ✅ | ✅ | `None` |
| `planName` | `string` |  | ✅ | `None` |
| `planDuration` | `number` |  | ✅ | `None` |
| `durationType_code` | `string` |  | ✅ | `None` |
| `price` | `string` |  | ✅ | `None` |
| `isActive` | `boolean` |  | ✅ | `true` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |

### User (Bảng: `users`)

| Tên Cột (DB Column) | Kiểu Dữ Liệu (DB/TS Type) | Khóa chính (PK) | Cho phép Null | Giá trị mặc định (Default) |
|---|---|---|---|---|
| `userId` | `number` | ✅ | ✅ | `None` |
| `email` | `string` |  | ✅ | `None` |
| `fullName` | `string` |  | ✅ | `None` |
| `password` | `string` |  | ✅ | `None` |
| `phoneNumber` | `string` |  | ✅ | `None` |
| `avatarUrl` | `string` |  | ✅ | `None` |
| `gender_code` | `varchar` |  | ✅ | `None` |
| `age` | `number` |  | ✅ | `None` |
| `role_id` | `number` |  | ✅ | `None` |
| `birthDate` | `date` |  | ✅ | `None` |
| `isVip` | `boolean` |  | ✅ | `None` |
| `status_code` | `string` |  | ✅ | `None` |
| `vipExpireDate` | `Date` |  | ✅ | `None` |
| `refreshToken` | `string` |  | ✅ | `None` |
| `isDeleted` | `boolean` |  | ✅ | `false` |
| `createdAt` | `Date` |  | ✅ | `None` |
| `updatedAt` | `Date` |  | ✅ | `None` |
| `deletedAt` | `Date` |  | ✅ | `None` |
| `createdBy` | `number` |  | ✅ | `None` |
| `updatedBy` | `number` |  | ✅ | `None` |
| `deletedBy` | `number` |  | ✅ | `None` |