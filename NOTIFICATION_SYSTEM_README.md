# Hệ thống Notification với Socket.io

## Tổng quan

Hệ thống notification realtime được xây dựng với Socket.io để gửi thông báo tức thì cho người dùng và chủ shop khi có sự kiện xảy ra trong hệ thống ecommerce.

## Tính năng

- **Realtime Notifications**: Thông báo tức thì qua WebSocket
- **Database Storage**: Lưu trữ notifications trong database
- **User & Store Notifications**: Hỗ trợ cả khách hàng và chủ shop
- **Multiple Notification Types**: Đặt hàng, thay đổi trạng thái, thanh toán
- **Read/Unread Status**: Quản lý trạng thái đã đọc/chưa đọc
- **Rich Metadata**: Lưu trữ thông tin bổ sung cho mỗi notification

## Cấu trúc Database

### Model Notification

```prisma
model Notification {
  id        String             @id @default(uuid())
  type      NotificationType
  title     String
  message   String             @db.Text
  status    NotificationStatus @default(UNREAD)
  metadata  Json?              // Thông tin bổ sung
  userId    String?            // ID người dùng
  storeId   String?            // ID cửa hàng
  orderId   String?            // ID đơn hàng liên quan
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
}
```

### Notification Types

- `ORDER_PLACED` - Đặt hàng thành công
- `ORDER_STATUS_CHANGED` - Thay đổi trạng thái đơn hàng
- `PAYMENT_STATUS_CHANGED` - Thay đổi trạng thái thanh toán
- `ORDER_SHIPPED` - Đơn hàng đã gửi
- `ORDER_DELIVERED` - Đơn hàng đã giao
- `ORDER_CANCELLED` - Đơn hàng bị hủy
- `PAYMENT_FAILED` - Thanh toán thất bại
- `PAYMENT_SUCCESS` - Thanh toán thành công

## Cài đặt và Chạy

### 1. Cài đặt dependencies

```bash
npm install socket.io socket.io-client date-fns
```

### 2. Chạy database migration

```bash
npx prisma db push
```

### 3. Chạy server với Socket.io

```bash
npm run dev:socket
```

## Sử dụng

### 1. Gửi Notification khi đặt hàng

```typescript
import { notificationService } from "@/lib/notification-service";

// Trong API route hoặc service xử lý đặt hàng
await notificationService.notifyOrderPlaced(orderId, userId, storeId, {
  total: orderTotal,
  itemsCount: orderItems.length,
  customerName: user.name,
});
```

### 2. Gửi Notification khi thay đổi trạng thái đơn hàng

```typescript
await notificationService.notifyOrderStatusChanged(
  orderId,
  userId,
  storeId,
  oldStatus,
  newStatus,
  {
    total: orderTotal,
    customerName: user.name,
  }
);
```

### 3. Gửi Notification khi thay đổi trạng thái thanh toán

```typescript
await notificationService.notifyPaymentStatusChanged(
  orderId,
  userId,
  storeId,
  oldStatus,
  newStatus,
  {
    amount: paymentAmount,
  }
);
```

### 4. Sử dụng Hook trong React Component

```typescript
import { useSocket } from "@/hooks/useSocket";
import { useUser } from "@clerk/nextjs";

function MyComponent() {
  const { user } = useUser();
  const { notifications, unreadCount, markAsRead } = useSocket();

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map((notification) => (
        <div key={notification.id}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <button onClick={() => markAsRead(notification.id)}>
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 5. Sử dụng NotificationBell Component

```typescript
import { NotificationBell } from "@/components/shared/notification-bell";

function Header() {
  return (
    <header>
      <NotificationBell />
    </header>
  );
}
```

## API Endpoints

### GET /api/notifications

Lấy danh sách notifications của user hoặc store

**Query Parameters:**

- `type`: 'user' hoặc 'store'
- `limit`: Số lượng notifications (mặc định: 20)
- `offset`: Vị trí bắt đầu (mặc định: 0)

### POST /api/notifications

Đánh dấu notification đã đọc

**Body:**

```json
{
  "notificationId": "uuid",
  "markAll": false,
  "type": "user"
}
```

### POST /api/notifications/order-placed

Gửi notification khi đặt hàng

**Body:**

```json
{
  "orderId": "uuid",
  "userId": "uuid",
  "storeId": "uuid",
  "orderData": {
    "total": 100000,
    "itemsCount": 2,
    "customerName": "John Doe"
  }
}
```

### POST /api/notifications/order-status-changed

Gửi notification khi thay đổi trạng thái đơn hàng

**Body:**

```json
{
  "orderId": "uuid",
  "userId": "uuid",
  "storeId": "uuid",
  "oldStatus": "Pending",
  "newStatus": "Confirmed",
  "orderData": {
    "total": 100000,
    "customerName": "John Doe"
  }
}
```

### POST /api/notifications/payment-status-changed

Gửi notification khi thay đổi trạng thái thanh toán

**Body:**

```json
{
  "orderId": "uuid",
  "userId": "uuid",
  "storeId": "uuid",
  "oldStatus": "Pending",
  "newStatus": "Paid",
  "paymentData": {
    "amount": 100000
  }
}
```

## Cấu trúc Files

```
src/
├── lib/
│   ├── socket.ts                 # Socket.io manager
│   ├── notification-service.ts   # Notification service
│   └── socket-server.ts         # Socket server setup
├── hooks/
│   └── useSocket.ts             # React hook cho socket
├── components/
│   └── shared/
│       └── notification-bell.tsx # Component hiển thị notifications
├── app/
│   ├── api/
│   │   └── notifications/       # API routes cho notifications
│   ├── (store)/profile/
│   │   └── notifications/       # Trang notifications cho user
│   └── dashboard/seller/
│       └── notifications/       # Trang notifications cho seller
└── server.js                    # Server entry point với socket.io
```

## Tích hợp vào hệ thống hiện tại

### 1. Thêm NotificationBell vào Header

```typescript
// src/components/store/layout/header/header.tsx
import { NotificationBell } from "@/components/shared/notification-bell";

// Thêm vào header component
<NotificationBell />;
```

### 2. Gọi notification service trong checkout

```typescript
// Trong checkout process
import { notificationService } from "@/lib/notification-service";

// Sau khi tạo order thành công
await notificationService.notifyOrderPlaced(order.id, user.id, store.id, {
  total: order.total,
  itemsCount: order.items.length,
  customerName: user.name,
});
```

### 3. Gọi notification service khi cập nhật order status

```typescript
// Trong admin/seller dashboard
await notificationService.notifyOrderStatusChanged(
  order.id,
  order.userId,
  order.storeId,
  oldStatus,
  newStatus,
  {
    total: order.total,
    customerName: order.user.name,
  }
);
```

## Lưu ý

1. **Environment Variables**: Đảm bảo `NEXT_PUBLIC_APP_URL` được set đúng
2. **Database**: Chạy Prisma migration để tạo bảng notifications
3. **Socket.io**: Sử dụng `npm run dev:socket` thay vì `npm run dev`
4. **Authentication**: Sử dụng Clerk để xác thực user, đảm bảo user đã đăng nhập trước khi kết nối socket
5. **Error Handling**: Xử lý lỗi khi socket connection thất bại

## Troubleshooting

### Socket không kết nối

- Kiểm tra server có chạy với `npm run dev:socket` không
- Kiểm tra console browser có lỗi gì không
- Kiểm tra CORS settings

### Notifications không hiển thị

- Kiểm tra database có dữ liệu không
- Kiểm tra API endpoints có hoạt động không
- Kiểm tra user authentication

### Performance

- Sử dụng pagination cho notifications
- Cleanup old notifications định kỳ
- Optimize database queries với indexes
