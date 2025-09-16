import SellerChatContainer from "@/components/dashboard/seller/chat/chat-container";
import { getStoreByUrl } from "@/queries/product";
import { notFound } from "next/navigation";

interface SellerChatPageProps {
  params: {
    storeUrl: string;
  };
}

export default async function SellerChatPage({ params }: SellerChatPageProps) {
  const store = await getStoreByUrl(params.storeUrl);

  if (!store) {
    notFound();
  }

  return (
    <div className="h-[calc(100vh-120px)] bg-white rounded-lg shadow-sm">
      <SellerChatContainer storeId={store.id} />
    </div>
  );
}
