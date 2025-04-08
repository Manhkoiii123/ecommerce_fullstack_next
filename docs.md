# setup prisma

`npm i -D prisma` và `@prisma/client` => `npx prisma init` => tạo schema => `npx prisma generate` và `npx prisma db push`

sync data bằng webhook => deploy ngrok => `ngrok http --domain=pretty-mouse-strangely.ngrok-free.app 3000`

` https://clerk.com/docs/webhooks/sync-data`

vào webhook của clerk => add endpoind => url `https://pretty-mouse-strangely.ngrok-free.app/api/webhooks` => chọn các event liên quan đến user => add env whsec_lKDVxBMqCxTSlNaOBgl64KZdNg/Gu+Uk

# 1 vài cái bug fix sau

cập nhật stock và đã bán khi order done => fix
