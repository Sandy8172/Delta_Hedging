import React from "react";

const Factor_DeltaCard = ({ delta, factor }) => {
  //   console.log(delta, fector);

  return (
    <div className="max-w-sm  items-center justify-between gap-2 px-1 border border-gray-300 rounded-lg shadow-lg dark:shadow-gray-800 hover:bg-gray-100  dark:border-gray-700 dark:hover:bg-gray-700 ">
      <section className="flex justify-between items-center gap-1 border-b-1 border-gray-500">
        <p className="text-gray-700 dark:text-gray-400 font-mono">Factor</p>
        <h5
          className={`text-md font-semibold font-mono tracking-tight dark:text-white text-black`}
        >
          {factor}
        </h5>
      </section>
      <section className="flex justify-between items-center ">
        <p className="text-gray-700 dark:text-gray-400 font-mono">PSR</p>
        <h5
          className={`text-md font-semibold font-mono tracking-tight ${
            delta >= 0.2
              ? "text-green-500"
              : delta <= -0.2
              ? "text-red-500"
              : "dark:text-white text-black"
          }`}
        >
          {delta}
        </h5>
      </section>
    </div>
  );
};

export default Factor_DeltaCard;
