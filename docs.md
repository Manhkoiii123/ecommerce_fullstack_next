# setup prisma

`npm i -D prisma` và `@prisma/client` => `npx prisma init` => tạo schema => `npx prisma generate` và `npx prisma db push`

sync data bằng webhook => deploy ngrok => `ngrok http --domain=pretty-mouse-strangely.ngrok-free.app 3000`

` https://clerk.com/docs/webhooks/sync-data`

vào webhook của clerk => add endpoind => url `https://pretty-mouse-strangely.ngrok-free.app/api/webhooks` => chọn các event liên quan đến user => add env whsec_lKDVxBMqCxTSlNaOBgl64KZdNg/Gu+Uk

# 1 vài cái bug fix sau

- nếu thêm vào giỏ hàng => đang ở VN => free
- sang bên trang /cart => chuyển sang nước khác thì phí ship có thể thay đổi => chỉnh lại giá ship

=> đề xuất => đổi luồng store cart => lưu cái id => vào trang cart => lấy ra thông tin => hiển thị
`const productData = await getProductPageData(productSlug, variantSlug);`
