# Auto-Cancel Unpaid Orders Feature

## Overview

This feature automatically cancels orders that haven't been paid for more than 3 days, helping to manage inventory and prevent abandoned orders from blocking stock.

## Features

### 1. Automatic Order Cancellation

- **Trigger**: Orders unpaid for 3+ days are automatically cancelled
- **Actions**:
  - Updates order status to "Cancelled"
  - Updates payment status to "Cancelled"
  - Updates all order groups to "Cancelled"
  - Logs cancellation details

### 2. Orders at Risk Monitoring

- **Warning Period**: Orders unpaid for 2+ days are flagged as "at risk"
- **Risk Levels**:
  - **Medium Risk**: 2 days unpaid
  - **High Risk**: 2+ days unpaid
  - **Critical Risk**: 3+ days unpaid (will be cancelled today)

### 3. Manual Control

- **Auto-Cancel All**: Admin/Seller can manually trigger cancellation of all at-risk orders
- **Manual Cancellation**: Individual orders can be cancelled manually with reason

## API Endpoints

### 1. Auto-Cancel Orders

```bash
POST /api/auto-cancel-orders
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "cancelled": 5,
  "message": "Successfully cancelled 5 unpaid orders",
  "cancelledOrders": [...]
}
```

### 2. Get Orders at Risk

```bash
GET /api/auto-cancel-orders?storeUrl={storeUrl}
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "atRiskOrders": [...],
  "count": 3
}
```

### 3. Cron Endpoint (for automated execution)

```bash
POST /api/cron/auto-cancel-orders
Authorization: Bearer {CRON_SECRET}
```

## Dashboard Integration

### Orders at Risk Component

The dashboard now includes an "Orders at Risk" section that shows:

- Number of orders at risk
- Customer details
- Order amounts
- Days since order creation
- Time until automatic cancellation
- Risk level indicators

### Auto-Cancel Button

- **Location**: Top-right of Orders at Risk section
- **Function**: Cancels all orders that meet the 3-day criteria
- **Permission**: Admin and Seller only

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```env
CRON_SECRET=your_secure_cron_secret_here
```

### 2. Cron Job Setup

Set up a cron job to run every hour (or as needed):

#### Using crontab:

```bash
# Run every hour
0 * * * * curl -X POST https://yourdomain.com/api/cron/auto-cancel-orders \
  -H "Authorization: Bearer your_cron_secret_here"
```

#### Using external services:

- **Vercel Cron**: Add to `vercel.json`
- **GitHub Actions**: Create workflow
- **AWS EventBridge**: Set up rule
- **Google Cloud Scheduler**: Create job

### 3. Vercel Cron Example

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-cancel-orders",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Database Schema Requirements

The feature works with the existing Prisma schema:

- `Order` model with `paymentStatus` and `orderStatus` fields
- `OrderGroup` model with `status` field
- Proper relationships between orders and order groups

## Security Features

### 1. Authentication

- All endpoints require valid user authentication
- Admin/Seller role verification for sensitive operations

### 2. Cron Security

- Protected by `CRON_SECRET` environment variable
- Bearer token authentication required for cron endpoint

### 3. Permission Checks

- Only Admin and Seller users can access auto-cancel features
- Store-specific filtering for sellers

## Monitoring and Logging

### 1. Console Logs

- Auto-cancel job start/completion timestamps
- Number of orders processed
- Error details for failed operations

### 2. Dashboard Metrics

- Real-time count of orders at risk
- Visual indicators for risk levels
- Historical cancellation data

## Customization Options

### 1. Timing Adjustments

Modify the cancellation threshold in `src/queries/store.ts`:

```typescript
// Change from 3 days to custom value
const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // Change this number
```

### 2. Risk Level Thresholds

Adjust risk level calculations in `OrdersAtRisk` component:

```typescript
const getRiskLevel = (daysUnpaid: number) => {
  if (daysUnpaid >= 4) return { level: "Critical", color: "destructive" };
  if (daysUnpaid >= 3) return { level: "High", color: "destructive" };
  return { level: "Medium", color: "secondary" };
};
```

### 3. Notification System

Add email/SMS notifications for orders at risk:

- Customer reminders
- Admin alerts
- Store owner notifications

## Troubleshooting

### Common Issues

1. **Orders not being cancelled**

   - Check cron job is running
   - Verify `CRON_SECRET` is set correctly
   - Check database permissions

2. **Permission errors**

   - Ensure user has Admin or Seller role
   - Verify authentication token is valid

3. **Performance issues**
   - Monitor database query performance
   - Consider adding database indexes
   - Implement pagination for large order sets

### Debug Mode

Enable detailed logging by setting:

```env
DEBUG_AUTO_CANCEL=true
```

## Best Practices

1. **Regular Monitoring**: Check dashboard daily for orders at risk
2. **Customer Communication**: Send payment reminders before auto-cancellation
3. **Inventory Management**: Ensure cancelled orders don't affect stock levels
4. **Backup Procedures**: Keep logs of all cancellations for audit purposes
5. **Testing**: Test the feature in development environment first

## Support

For issues or questions:

1. Check console logs for error details
2. Verify environment variables are set correctly
3. Ensure database schema matches requirements
4. Test with small order sets first
