import { Dispatch, FC, SetStateAction, useState } from "react";

interface ColorPaletteProps {
  extractedColors?: string[];
  colors?: { color: string }[];
  setColors: Dispatch<SetStateAction<{ color: string }[]>>;
}

const ColorPalette: FC<ColorPaletteProps> = ({
  colors,
  extractedColors,
  setColors,
}) => {
  const [activeColor, setActiveColor] = useState<string>("");

  const handleAddProductColor = (color: string) => {
    if (!color || !setColors) return;

    const currentColorsData = colors ?? [];

    const existingColor = currentColorsData.find((c) => color === c.color);
    if (existingColor) return;

    const newColors = currentColorsData.filter((c) => c.color !== "");
    setColors([...newColors, { color: color }]);
  };
  const Color = ({ color }: { color: string }) => {
    return (
      <div
        className="w-20 h-[80px] cursor-pointer transition-all duration-100 ease-linear relative hover:w-[120px] hover:duration-300"
        style={{ backgroundColor: color }}
        onMouseEnter={() => setActiveColor(color)}
        onClick={() => handleAddProductColor(color)}
      >
        <div className="w-full h-8 text-center text-xs font-semibold absolute -top-6 text-black">
          {color}
        </div>
      </div>
    );
  };

  return (
    <div className="pt-10 w-[320px] h-[160px] rounded-b-md overflow-hidden">
      <div className="w-[320px] h-[180px] rounded-md perspective-1000 relative">
        <div className="relative w-full flex items-center justify-center bg-white h-16 rounded-t-md">
          <div
            className="absolute w-16 h-16 grid place-items-center shadow-lg rounded-full -top-10"
            style={{ backgroundColor: activeColor || "#fff" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              fill={activeColor ? "#fff" : "#000"}
              viewBox="0 0 16 16"
              className="animate-spin"
            >
              <path d="M8 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5.5 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
              <path d="M16 8c0 3.15-1.866 2.585-3.567 2.07C11.42 9.763 10.465 9.473 10 10c-.603.683-.475 1.819-.351 2.92C9.826 14.495 9.996 16 8 16a8 8 0 1 1 8-8zm-8 7c.611 0 .654-.171.655-.176.078-.146.124-.464.07-1.119-.014-.168-.037-.37-.061-.591-.052-.464-.112-1.005-.118-1.462-.01-.707.083-1.61.704-2.314.369-.417.845-.578 1.272-.618.404-.038.812.026 1.16.104.343.077.702.186 1.025.284l.028.008c.346.105.658.199.953.266.653.148.904.083.991.024C14.717 9.38 15 9.161 15 8a7 7 0 1 0-7 7z" />
            </svg>
          </div>
        </div>
        <div className="w-full h-[180px] absolute bottom-0 !flex items-center justify-center">
          {extractedColors?.map((color, index) => (
            <Color key={index} color={color} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPalette;
