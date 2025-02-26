import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import Image from "next/image";

import NoImageImg from "../../../../public/assets/images/no_image_2.png";

import { cn, getDominantColors, getGridClassName } from "@/lib/utils";

import { Trash } from "lucide-react";
import ColorPalette from "@/components/dashboard/shared/color-pallette";

interface ImagesPreviewGridProps {
  images: { url: string }[];
  onRemove: (value: string) => void;
  colors?: { color: string }[];
  setColors: Dispatch<SetStateAction<{ color: string }[]>>;
}

const ImagesPreviewGrid: FC<ImagesPreviewGridProps> = ({
  images,
  onRemove,
  colors,
  setColors,
}) => {
  let imagesLength = images.length;

  const GridClassName = getGridClassName(imagesLength);

  const [colorPalettes, setColorPalettes] = useState<string[][]>([]);
  useEffect(() => {
    const fecthColors = async () => {
      const palettes = await Promise.all(
        images.map(async (img) => {
          try {
            const colors = await getDominantColors(img.url);
            return colors;
          } catch (error) {
            return [];
          }
        })
      );
      setColorPalettes(palettes);
    };

    if (imagesLength > 0) {
      fecthColors();
    }
  }, [images]);

  if (imagesLength === 0) {
    return (
      <div>
        <Image
          src={NoImageImg}
          alt="No images available"
          width={500}
          height={600}
          className="rounded-md"
        />
      </div>
    );
  } else {
    return (
      <div className="max-w-4xl">
        <div
          className={`grid h-[800px]  overflow-hidden bg-white rounded-md ${
            GridClassName || "grid-cols-2"
          }`}
        >
          {images.map((img, i) => (
            <div
              key={i}
              className={cn(
                "relative group h-full w-full border border-gray-300",
                `grid_${imagesLength}_image_${i + 1}`,
                {
                  "h-[266.66px]": images.length === 6,
                }
              )}
            >
              <Image
                src={img.url}
                alt=""
                width={800}
                height={800}
                className="w-full h-full object-cover object-top"
              />
              <div
                className={cn(
                  "absolute top-0 left-0 right-0 bottom-0 hidden group-hover:flex bg-white/55 cursor-pointer  items-center justify-center flex-col gap-y-3 transition-all duration-500",
                  {
                    "!pb-[40%]": imagesLength === 1,
                  }
                )}
              >
                <ColorPalette
                  colors={colors}
                  setColors={setColors}
                  extractedColors={colorPalettes[i]}
                />
                <button
                  className="Btn"
                  type="button"
                  onClick={() => onRemove(img.url)}
                >
                  <div className="sign">
                    <Trash size={18} />
                  </div>
                  <div className="text">Delete</div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

export default ImagesPreviewGrid;
