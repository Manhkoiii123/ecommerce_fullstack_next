# GoShop - Multi-Vendor E-Commerce Platform

<p align="center">
  <img src="public/assets/icons/logo.png" alt="GoShop Logo" width="200"/>
</p>

GoShop is a full-featured multi-vendor e-commerce marketplace built with Next.js 14, enabling multiple sellers to list and sell products while providing customers with a seamless shopping experience.

## 🚀 Features

### 🛒 Customer Features

- **Product Browsing** - Browse products by categories, subcategories, and offer tags
- **Advanced Search** - Full-text search powered by Elasticsearch
- **Product Details** - View detailed product information with multiple variants, sizes, colors, and images
- **Shopping Cart** - Add products to cart with quantity management and shipping fee calculations
- **Wishlist** - Save favorite products for later
- **Checkout** - Secure checkout with multiple payment options (Stripe, PayPal)
- **Order Tracking** - Track order status from pending to delivery
- **Reviews & Ratings** - Leave product reviews with images and ratings
- **User Profiles** - Manage addresses, payment methods, and order history
- **Real-time Chat** - Direct messaging with sellers via Socket.io
- **Flash Sales** - Special time-limited discounts on products
- **Coupons** - Apply discount coupons at checkout

### 🏪 Seller Features

- **Store Management** - Create and manage your own store with custom branding
- **Product Management** - Add, edit, and manage products with variants
- **Order Management** - View and process customer orders
- **Shipping Rates** - Configure shipping rates by country
- **Coupons** - Create store-specific discount coupons
- **Flash Sales** - Create time-limited flash sale events
- **Analytics Dashboard** - View sales statistics and performance metrics
- **Live Streaming** - Stream live to customers using LiveKit integration
- **Chat System** - Communicate with customers in real-time
- **Notifications** - Receive notifications for new orders and updates

### 👨‍💼 Admin Features

- **Dashboard Overview** - Comprehensive platform statistics
- **Store Management** - Approve, ban, or manage seller stores
- **Category Management** - Create and manage product categories and subcategories
- **Offer Tags** - Manage promotional tags (Flash Sale, Buy 1 Get 1, etc.)
- **User Management** - Manage platform users and roles

## 🛠️ Tech Stack

### Frontend

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts**: [Recharts](https://recharts.org/) + [Tremor](https://www.tremor.so/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Backend

- **Database**: MySQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Clerk](https://clerk.com/)
- **File Upload**: [UploadThing](https://uploadthing.com/) + [Cloudinary](https://cloudinary.com/)
- **Search**: [Elasticsearch](https://www.elastic.co/elasticsearch/)
- **Payments**: [Stripe](https://stripe.com/) + [PayPal](https://www.paypal.com/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Live Streaming**: [LiveKit](https://livekit.io/)
- **Webhooks**: [Svix](https://www.svix.com/)
- **Cron Jobs**: [node-cron](https://www.npmjs.com/package/node-cron)

## 📁 Project Structure

```
ecommerce/
├── prisma/                    # Database schema and migrations
│   └── schema.prisma          # Prisma schema definition
├── public/                    # Static assets
│   └── assets/                # Images, icons, and media files
├── src/
│   ├── actions/               # Server actions (follow, stream, etc.)
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages (sign-in, sign-up)
│   │   ├── (dashboard)/       # Dashboard layout (streaming)
│   │   ├── (store)/           # Main store pages
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Admin and seller dashboards
│   │   └── flash-sale/        # Flash sale pages
│   ├── cart-store/            # Cart state management (Zustand)
│   ├── components/            # React components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── store/             # Store frontend components
│   │   └── ui/                # Reusable UI components (shadcn)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions and configurations
│   ├── providers/             # React context providers
│   └── queries/               # Database queries and data fetching
├── docs/                      # Documentation
└── migration-scripts/         # Database migration scripts
```

## 🗃️ Database Models

The application uses the following main data models:

- **User** - Platform users with roles (USER, ADMIN, SELLER)
- **Store** - Seller stores with products and settings
- **Product** - Products with variants, sizes, colors, and specs
- **Category/SubCategory** - Product categorization
- **Order/OrderGroup/OrderItem** - Order management
- **Cart/CartItem** - Shopping cart
- **Review** - Product reviews with ratings
- **Wishlist** - User wishlists
- **Coupon** - Discount coupons
- **FlashSale** - Time-limited sales events
- **ShippingRate** - Country-specific shipping rates
- **Notification** - User and store notifications
- **Conversation/Message** - Chat system
- **Stream** - Live streaming configuration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MySQL database
- Elasticsearch instance (optional, for search)
- Accounts for: Clerk, Stripe, PayPal, UploadThing, Cloudinary, LiveKit

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ecommerce
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file with the following variables:

   ```env
   # Database
   DATABASE_URL="mysql://user:password@localhost:3306/ecommerce"

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

   # Stripe
   STRIPE_SECRET_KEY=
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   STRIPE_WEBHOOK_SECRET=

   # PayPal
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=
   PAYPAL_CLIENT_SECRET=

   # UploadThing
   UPLOADTHING_SECRET=
   UPLOADTHING_APP_ID=

   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=

   # Elasticsearch
   ELASTICSEARCH_URL=

   # LiveKit
   LIVEKIT_API_URL=
   LIVEKIT_API_KEY=
   LIVEKIT_API_SECRET=
   NEXT_PUBLIC_LIVEKIT_WS_URL=
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed countries (optional)**

   ```bash
   npm run seed
   ```

6. **Run the development server**

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |
| `npm run seed`  | Seed countries data      |
| `npm run cron`  | Run cron jobs            |

## 📱 Pages Overview

### Store Pages

- `/` - Home page with featured products and flash sales
- `/browse` - Product browsing with filters
- `/product/[slug]` - Product details page
- `/cart` - Shopping cart
- `/checkout` - Checkout process
- `/order/[orderId]` - Order confirmation
- `/profile` - User profile and settings
- `/store/[storeUrl]` - Individual store page
- `/flash-sale/[id]` - Flash sale details

### Dashboard Pages

- `/dashboard/admin` - Admin dashboard
- `/dashboard/seller/stores/[storeUrl]` - Seller store dashboard
- `/dashboard/seller/stores/[storeUrl]/products` - Product management
- `/dashboard/seller/stores/[storeUrl]/orders` - Order management
- `/dashboard/seller/stores/[storeUrl]/coupons` - Coupon management
- `/dashboard/seller/stores/[storeUrl]/flash-sales` - Flash sale management

## 🔒 Authentication & Authorization

The application uses Clerk for authentication with three user roles:

- **USER** - Regular customers
- **SELLER** - Store owners
- **ADMIN** - Platform administrators

## 💳 Payment Integration

Supports multiple payment methods:

- **Stripe** - Credit/debit card payments
- **PayPal** - PayPal checkout

## 🎥 Live Streaming

Sellers can stream live to their customers using LiveKit integration:

- Real-time video streaming
- Live chat during streams
- Follower-only chat options
- Stream key management

## 📧 Notifications

Real-time notification system for:

- New orders
- Order status updates
- Payment confirmations
- Low stock alerts
- Store approval status

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [Clerk](https://clerk.com/)
- [Stripe](https://stripe.com/)
