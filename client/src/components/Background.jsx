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
        <div className="relative h-screen">
          <div className="absolute inset-0">
            <div className="relative h-full w-full bg-slate-950 [&>div]:absolute [&>div]:inset-0 [&>div]:bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] [&>div]:bg-[size:14px_24px] [&>div]:[mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]">
              <div></div>
            </div>
          </div>

          <div className="relative z-10 ">{children}</div>
        </div>

        // <div className="relative h-screen">
        //   <div className="absolute inset-0">
        //     <div className="absolute top-0 z-[-2] h-screen w-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]"></div>
        //   </div>

        //   <div className="relative z-10">
        //     {children}
        //   </div>
        // </div>

        // <div className="h-screen">
        //   <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>
        //   <div className="relative z-10">{children}</div>
        // </div>
      )}
    </>
  );
};

export default Background;
