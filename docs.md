# setup prisma

`npm i -D prisma` và `@prisma/client` => `npx prisma init` => tạo schema => `npx prisma generate` và `npx prisma db push`

sync data bằng webhook => deploy ngrok => `ngrok http --domain=pretty-mouse-strangely.ngrok-free.app 3000`

` https://clerk.com/docs/webhooks/sync-data`

vào webhook của clerk => add endpoind => url `https://pretty-mouse-strangely.ngrok-free.app/api/webhooks` => chọn các event liên quan đến user => add env whsec_lKDVxBMqCxTSlNaOBgl64KZdNg/Gu+Uk

# 1 vài cái bug fix sau

cập nhật stock và đã bán khi order done => fix

luồng xử lí cart => add to cart -> save to cart vẫn lưu giá gốc => sag bên trang checkout => update lại db trong cart nhờ hàm `updateCheckoutProductstWithLatest`

=> update code

==> chạy pull => thêm env => npx prisma generate => npx prisma db push => ts-node -r tsconfig-paths/register src/migration-scripts/seed-countries.ts

```ts
import { db } from "@/lib/db";
import countries from "../data/countries.json";
export async function seedCountries() {
  try {
    for (const country of countries) {
      await db.country.upsert({
        where: {
          name: country.name,
        },
        create: {
          name: country.name,
          code: country.code,
        },
        update: {
          name: country.name,
          code: country.code,
        },
      });
    }
  } catch (error) {}
}

seedCountries();
```

```json
// ts config .json

{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "module": "CommonJS",
    "moduleResolution": "Node",
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/public/*": ["./public/*"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

cart lưu giá gốc => lúc sang trang checkout thì có hàm check để lấy thông tin sản phẩm và lưu lại giá trị của cart items với giá đã có flashsale => trong hàm này trả ra thông tin item có flashsale sẵn rồi =>
