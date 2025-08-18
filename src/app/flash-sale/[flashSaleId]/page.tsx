import { getFlashSale } from "@/queries/flash-sale";
import { notFound } from "next/navigation";
import FlashSalePage from "@/components/store/flash-sale/flash-sale-page";

interface FlashSalePageProps {
  params: {
    flashSaleId: string;
  };
}

export default async function FlashSalePageRoute({
  params,
}: FlashSalePageProps) {
  const flashSale = await getFlashSale(params.flashSaleId);

  if (!flashSale) {
    notFound();
  }

  return <FlashSalePage flashSale={flashSale} />;
}
