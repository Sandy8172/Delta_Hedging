import React from "react";

const NetValueCard = ({ netValue }) => {
  return (
    <div className="max-w-sm flex items-center justify-between gap-2 px-2 py-2 border border-gray-300 rounded-lg shadow-lg hover:bg-gray-100 dark:shadow-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 ">
      <h5
        className={`text-lg font-semibold font-mono tracking-tight dark:text-gray-200`}
      >
        {netValue?.toFixed(2)}
      </h5>
    </div>
  );
};

export default NetValueCard;
