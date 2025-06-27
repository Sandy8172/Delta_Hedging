import { useSelector } from "react-redux";
import { selectedColorTheme } from "../utils/themeSlice";

const Background = ({ children }) => {
  const colorTheme = useSelector(selectedColorTheme);

  return (
    <>
      {colorTheme === "light" ? (
        <div className="relative h-screen">
          <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] [&>div]:absolute [&>div]:inset-0 [&>div]:bg-[radial-gradient(circle_500px_at_50%_200px,#C9EBFF,transparent)]">
            <div></div>
          </div>
          <div className="relative z-10 ">{children}</div>
        </div>
      ) : (
        <div className="h-screen">
          <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>
          <div className="relative z-10">{children}</div>
        </div>
      )}
    </>
  );
};

export default Background;
