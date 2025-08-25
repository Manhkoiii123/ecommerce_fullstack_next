# Hệ Thống Notification Ecommerce

## Tổng Quan

Hệ thống notification được xây dựng để cung cấp thông báo real-time cho cả khách hàng và chủ shop khi có các hoạt động liên quan đến đơn hàng, thanh toán và thay đổi trạng thái.

## Tính Năng Chính

### 1. Notification Tự Động

- **Đặt hàng mới**: Thông báo cho cả khách hàng và chủ shop
- **Thay đổi trạng thái đơn hàng**: Cập nhật real-time khi đơn hàng thay đổi trạng thái
- **Thanh toán**: Thông báo khi thanh toán thành công/thất bại
- **Giao hàng**: Thông báo khi hàng được gửi và giao

### 2. Loại Notification

- `NEW_ORDER`: Đơn hàng mới
- `ORDER_STATUS_CHANGE`: Thay đổi trạng thái đơn hàng
- `PAYMENT_RECEIVED`: Thanh toán thành công
- `PAYMENT_FAILED`: Thanh toán thất bại
- `ORDER_SHIPPED`: Đơn hàng đã gửi
- `ORDER_DELIVERED`: Đơn hàng đã giao
- `ORDER_CANCELLED`: Đơn hàng bị hủy
- `REVIEW_RECEIVED`: Nhận đánh giá mới
- `LOW_STOCK`: Hết hàng
- `SYSTEM_UPDATE`: Cập nhật hệ thống

### 3. Đối Tượng Nhận Notification

- **Khách hàng**: Nhận thông báo về đơn hàng của họ
- **Chủ shop**: Nhận thông báo về hoạt động của shop

## Cấu Trúc Database

### Model Notification

```prisma
model Notification {
  id          String           @id @default(uuid())
  type        NotificationType
  title       String
  message     String           @db.Text
  status      NotificationStatus @default(UNREAD)
  data        Json?            // Dữ liệu bổ sung

  storeId     String?          // Liên kết với store
  userId      String?          // Liên kết với user
  orderId     String?          // Liên kết với order

  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}
```

## API Endpoints

### 1. Lấy Notification của Store

```http
GET /api/notifications/store/{storeId}
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "notifications": [...],
  "unreadCount": 5,
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25
  }
}
```

### 2. Lấy Notification của User

```http
GET /api/notifications/user
Authorization: Bearer {token}
```

### 3. Đánh Dấu Notification Đã Đọc

```http
PATCH /api/notifications/{id}/mark-read
Authorization: Bearer {token}
```

## Cách Sử Dụng

### 1. Tích Hợp vào Dashboard Seller

Thêm component `NotificationBell` vào header của dashboard:

```tsx
import { NotificationBell } from "@/components/dashboard/shared/notification-bell";

// Trong header component
<NotificationBell storeId={storeId} initialUnreadCount={unreadCount} />;
```

### 2. Tích Hợp vào Profile User

Thêm component `NotificationBell` vào header của profile:

```tsx
import { NotificationBell } from "@/components/dashboard/shared/notification-bell";

// Trong profile header
<NotificationBell userId={userId} initialUnreadCount={unreadCount} />;
```

### 3. Tạo Notification Tự Động

Sử dụng các function từ `@/lib/notifications`:

```tsx
import {
  createNewOrderNotification,
  createOrderStatusChangeNotification,
  createPaymentNotification,
} from "@/lib/notifications";

// Khi đặt hàng mới
await createNewOrderNotification(orderId, storeId, userId);

// Khi thay đổi trạng thái
await createOrderStatusChangeNotification(
  orderId,
  storeId,
  userId,
  newStatus,
  oldStatus
);

// Khi thanh toán
await createPaymentNotification(
  orderId,
  storeId,
  userId,
  paymentStatus,
  amount,
  paymentMethod
);
```

## Trang Notification

### 1. Seller Dashboard

- **Route**: `/dashboard/seller/notifications`
- **Tính năng**: Xem tất cả notification của shop, lọc theo loại, tìm kiếm

### 2. User Profile

- **Route**: `/profile/notifications`
- **Tính năng**: Xem notification cá nhân, theo dõi đơn hàng

## Tùy Chỉnh

### 1. Thêm Loại Notification Mới

1. Cập nhật enum `NotificationType` trong schema
2. Thêm case xử lý trong các function notification
3. Cập nhật UI components

### 2. Tùy Chỉnh Message

Chỉnh sửa message trong các function notification:

```tsx
// Trong createNewOrderNotification
const storeNotificationData: CreateNotificationData = {
  type: "NEW_ORDER",
  title: "Đơn hàng mới! 🎉", // Tùy chỉnh title
  message: `${customerName} đã đặt đơn hàng mới...`, // Tù chỉnh message
  // ...
};
```

### 3. Thêm Dữ Liệu Bổ Sung

Sử dụng field `data` để lưu thông tin bổ sung:

```tsx
data: {
  orderId,
  customerName,
  orderTotal,
  itemCount,
  // Thêm dữ liệu khác...
}
```

## Bảo Mật

- Tất cả API endpoints đều yêu cầu authentication
- User chỉ có thể truy cập notification của mình
- Seller chỉ có thể truy cập notification của shop của họ
- Validation dữ liệu đầu vào

## Performance

- Sử dụng pagination cho danh sách notification
- Index database cho các trường thường query
- Lazy loading notification khi cần thiết
- Debounce cho search input

## Troubleshooting

### 1. Notification không được tạo

- Kiểm tra database connection
- Verify các tham số truyền vào function
- Check console logs cho error

### 2. API trả về 401/403

- Kiểm tra authentication token
- Verify user có quyền truy cập
- Check user role và store ownership

### 3. UI không cập nhật

- Kiểm tra state management
- Verify API response format
- Check component re-render logic

## Tương Lai

- [ ] Push notification cho mobile
- [ ] Email notification
- [ ] SMS notification
- [ ] Webhook integration
- [ ] Notification templates
- [ ] Bulk operations
- [ ] Notification analytics
