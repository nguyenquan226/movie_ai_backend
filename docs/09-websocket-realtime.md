# 09 — WebSocket & Realtime

> **Mô tả**: 4 WebSocket Gateway (Watch, Comment, Rating, Report), cơ chế broadcast, quản lý room, socket map.

---

## 1. Tổng quan

Dự án dùng **Socket.IO** (`@nestjs/websockets` + `@nestjs/platform-socket.io`) cho 4 chức năng realtime:

| Gateway | File | Namespace mặc định | Mục đích |
|---------|------|-------------------|----------|
| `WatchGateway` | `src/modules/films/socket/watch-gateway.ts` | `/` | Đồng bộ co-watching (play/pause/seek) |
| `CommentGateway` | `src/modules/comment/socket/comment-gateway.ts` | `/` | Realtime comment (new/reply/delete/hide/react) |
| `RatingGateway` | `src/modules/rating/socket/rating-gateway.ts` | `/` | Realtime rating (create/update/delete/hide) |
| `ReportGateway` | `src/modules/report/socket/report-gateway.ts` | `/` | Realtime report notification (admin-only) |

Tất cả gateway dùng chung default namespace (`/`). CORS uses the configured frontend origin allowlist. Clients authenticate with an access JWT in Socket.IO `auth.token` (preferred) or an Authorization bearer header; the adapter verifies signature, expiry, and logout blacklist before connecting. Query-string tokens are accepted for compatibility and should be avoided because URLs may be logged.

---

## 2. WatchGateway — Co-Watching Sync

### 2.1 Chức năng

Đồng bộ trạng thái xem phim giữa nhiều người dùng trong một phòng co-watching.

### 2.2 Events

| Event | Direction | Payload | Mô tả |
|-------|-----------|---------|-------|
| `join-room` | Client → Server | `{ roomId, filmId, userId }` | User tham gia phòng |
| `leave-room` | Client → Server | `{ roomId }` | User rời phòng |
| `sync-play` | Client → Server | `{ roomId, currentTime }` | Phát video |
| `sync-pause` | Client → Server | `{ roomId, currentTime }` | Tạm dừng video |
| `sync-seek` | Client → Server | `{ roomId, currentTime }` | Tua video |
| `sync-change-episode` | Client → Server | `{ roomId, partId, episodeId }` | Đổi tập/phần |
| `room-state-update` | Server → Client | `{ currentTime, playing, partId, episodeId }` | Cập nhật trạng thái phòng |
| `user-joined` | Server → Client | `{ userId, user }` | Thông báo user mới |
| `user-left` | Server → Client | `{ userId }` | Thông báo user rời |

### 2.3 Cơ chế

```
Client A                          Server                         Client B
  │                                │                                │
  │ join-room                      │                                │
  │───────────────────────────────→│                                │
  │                                │ socket.join(roomId)            │
  │                                │ broadcast user-joined          │
  │                                │───────────────────────────────→│
  │                                │                                │
  │ sync-play {currentTime: 120}   │                                │
  │───────────────────────────────→│                                │
  │                                │ broadcast room-state-update    │
  │                                │───────────────────────────────→│
  │                                │   {currentTime:120,playing:true}│
```

### 2.4 Quản lý state

- Room state lưu trong Redis: `room:{roomId}:state`
- Khi có event mới, state được cập nhật vào Redis + broadcast tới tất cả client trong room

---

## 3. CommentGateway — Realtime Comments

### 3.1 Events

| Event | Direction | Payload | Mô tả |
|-------|-----------|---------|-------|
| `comment-new` | Server → Client | `Comment` | Có comment mới |
| `comment-reply` | Server → Client | `Comment` | Có reply mới |
| `comment-updated` | Server → Client | `Comment` | Comment bị sửa |
| `comment-deleted` | Server → Client | `{ commentId }` | Comment bị xóa |
| `comment-hidden` | Server → Client | `{ commentId }` | Comment bị ẩn (admin) |
| `comment-reaction` | Server → Client | `{ commentId, reaction }` | Có reaction mới/xóa |
| `register-admin` | Client → Server | `{ userId }` | Admin đăng ký socket |
| `register-user` | Client → Server | `{ userId }` | User đăng ký socket |

### 3.2 Cơ chế broadcast

- Comment mới → broadcast tới **tất cả client** đang xem phim đó
- Admin actions (hide/delete) → broadcast tới **tất cả client**
- Reaction → broadcast tới **tất cả client** đang xem phim đó

### 3.3 Socket Maps

Gateway duy trì 2 in-memory Map:
```typescript
adminSockets: Map<string, Socket[]>    // userId → sockets (cho admin)
userSockets: Map<string, Socket[]>     // userId → sockets (cho user)
```

Dùng để gửi targeted notification tới admin cụ thể khi có sự kiện.

---

## 4. RatingGateway — Realtime Ratings

### 4.1 Events

| Event | Direction | Payload | Mô tả |
|-------|-----------|---------|-------|
| `rating-created` | Server → Client | `Rating` | Có đánh giá mới |
| `rating-updated` | Server → Client | `Rating` | Đánh giá bị sửa |
| `rating-deleted` | Server → Client | `{ ratingId }` | Đánh giá bị xóa |
| `rating-hidden` | Server → Client | `{ ratingId }` | Đánh giá bị ẩn (admin) |

### 4.2 Cơ chế

- Broadcast tới **tất cả client** đang kết nối
- Admin có thể ẩn rating không phù hợp

---

## 5. ReportGateway — Realtime Reports

### 5.1 Events

| Event | Direction | Payload | Mô tả |
|-------|-----------|---------|-------|
| `report-new` | Server → Admin | `Report` | Có báo cáo vi phạm mới |
| `register-admin` | Client → Server | `{ userId }` | Admin đăng ký socket |

### 5.2 Cơ chế

- Chỉ **broadcast tới admin sockets** (dùng `adminSockets` map)
- User thường không nhận được event report
- Khi admin xử lý report, broadcast kết quả

---

## 6. WebSocket Authentication

Hiện tại, WebSocket gateways **không có xác thực JWT** — đã comment out trong `JwtAuthGuard`:
```typescript
// if (context.getType() === 'ws') {
//   return true;  // Cho qua tất cả WebSocket connection
// }
```

Điều này có nghĩa WebSocket connection không bị chặn bởi global guard. Việc xác thực WebSocket (nếu cần) phải được thêm vào từng gateway riêng.

---

## 7. CORS Config cho WebSocket

Tất cả gateway dùng config mặc định:
```typescript
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
```

---

## 8. Cách thêm Gateway mới

1. Tạo class trong `src/modules/<module>/socket/`:
```typescript
@WebSocketGateway()
export class NewGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  afterInit(server: Server) { /* init logic */ }
  handleConnection(client: Socket) { /* connection logic */ }
  handleDisconnect(client: Socket) { /* disconnect logic */ }

  @SubscribeMessage('event-name')
  handleEvent(client: Socket, payload: any) { /* ... */ }
}
```

2. Đăng ký trong module:
```typescript
@Module({
  providers: [NewGateway],
})
export class SomeModule {}
```

3. Để broadcast từ service:
```typescript
// Inject gateway vào service
constructor(private readonly gateway: NewGateway) {}

// Broadcast
this.gateway.server.emit('event-name', payload);
// Hoặc targeted
this.gateway.server.to(roomId).emit('event-name', payload);
```
