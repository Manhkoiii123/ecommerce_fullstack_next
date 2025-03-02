import Footer from "@/components/store/layout/footer/footer";
import ProductList from "@/components/store/shared/product-list";
import { getProducts } from "@/queries/product";

export default async function Home() {
  const productsData = await getProducts();
  const { products } = productsData;
  return (
    <div className="p-5">
      <ProductList products={products} title="Products" arrow={true} />
    </div>
  );
}
