import React from "react";

const PnlCard = ({ pnl }) => {
  return (
    <div className="flex items-center justify-between gap-2 px-2 py-2 border border-gray-300 rounded-lg shadow-lg hover:bg-gray-100 dark:shadow-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 ">
      <p className="text-gray-700 dark:text-gray-400 font-mono">PnL</p>
      <h5
        className={`text-lg font-semibold font-mono tracking-tight ${
          pnl >= 0 ? "text-green-500" : "text-red-500"
        }`}
      >
        {pnl?.toFixed(2)}
      </h5>
    </div>
  );
};

export default PnlCard;
