import Results, { ResultsSkeleton } from "@/components/live/Results";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="h-full p-8 max-w-screen-2xl mx-auto ">
      <Suspense fallback={<ResultsSkeleton />}>
        <Results />
      </Suspense>
    </div>
  );
}
