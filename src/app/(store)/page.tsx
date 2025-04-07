import CategoriesHeader from "@/components/store/layout/categories-header/categories-header";
import Footer from "@/components/store/layout/footer/footer";
import Header from "@/components/store/layout/header/header";
import ProductList from "@/components/store/shared/product-list";
import { getProducts } from "@/queries/product";

export default async function Home() {
  const productsData = await getProducts();
  const { products } = productsData;
  return (
    <div>
      <Header />
      <CategoriesHeader />
      <div className="p-14">
        <ProductList products={products} title="Products" arrow={true} />
      </div>
      <Footer />
    </div>
  );
}
