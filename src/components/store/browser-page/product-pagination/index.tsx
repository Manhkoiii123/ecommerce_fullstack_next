"use client";

import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface Props {
  page: number;
  totalPages: number;
}

export default function ProductPagination({ page, totalPages }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = 2;

  const handleChangePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const params = new URLSearchParams(searchParams!.toString());
      params.set("page", String(newPage));
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  // Render dấu ...
  const renderDot = (key: number) => (
    <span
      key={key}
      className="flex items-center justify-center px-3 py-2 mx-2 bg-white select-none"
    >
      ...
    </span>
  );

  const renderPagination = () => {
    let dotBefore = false;
    let dotAfter = false;

    return Array(totalPages)
      .fill(0)
      .map((_, index) => {
        const pageNumber = index + 1;

        // Logic ẩn bớt trang + hiển thị dấu ...
        if (
          page <= range * 2 + 1 &&
          pageNumber > page + range &&
          pageNumber < totalPages - range + 1
        ) {
          if (!dotAfter) {
            dotAfter = true;
            return renderDot(index);
          }
          return null;
        } else if (page > range * 2 + 1 && page < totalPages - 2 * range) {
          if (range < pageNumber && pageNumber < page - range) {
            if (!dotBefore) {
              dotBefore = true;
              return renderDot(index);
            }
            return null;
          }
          if (
            page + range < pageNumber &&
            pageNumber < totalPages - range + 1
          ) {
            if (!dotAfter) {
              dotAfter = true;
              return renderDot(index);
            }
            return null;
          }
        } else if (
          page > totalPages - 2 * range - 1 &&
          range < pageNumber &&
          pageNumber < page - range
        ) {
          if (!dotBefore) {
            dotBefore = true;
            return renderDot(index);
          }
          return null;
        }

        // ✅ Nút số trang
        return (
          <span
            key={index}
            onClick={() => handleChangePage(pageNumber)}
            className={cn(
              "flex items-center justify-center px-3 py-2 mx-2 bg-white cursor-pointer border transition-all rounded-sm",
              {
                "border-cyan-500 text-cyan-600 font-medium":
                  pageNumber === page,
                "border-transparent hover:border-gray-300": pageNumber !== page,
              }
            )}
          >
            {pageNumber}
          </span>
        );
      });
  };

  return (
    <div className="flex flex-wrap justify-center mt-6">
      {/* Prev button */}
      {page === 1 ? (
        <span className="flex items-center justify-center px-3 py-2 mx-2 border bg-white/60 cursor-not-allowed rounded-sm">
          Prev
        </span>
      ) : (
        <span
          onClick={() => handleChangePage(page - 1)}
          className="flex items-center justify-center px-3 py-2 mx-2 bg-white border cursor-pointer hover:border-gray-300 rounded-sm"
        >
          Prev
        </span>
      )}

      {/* Pagination numbers */}
      {renderPagination()}

      {/* Next button */}
      {page === totalPages ? (
        <span className="flex items-center justify-center px-3 py-2 mx-2 border bg-white/60 cursor-not-allowed rounded-sm">
          Next
        </span>
      ) : (
        <span
          onClick={() => handleChangePage(page + 1)}
          className="flex items-center justify-center px-3 py-2 mx-2 bg-white border cursor-pointer hover:border-gray-300 rounded-sm"
        >
          Next
        </span>
      )}
    </div>
  );
}
