import React from "react";

const NetValueCard = ({ netValue }) => {
  return (
    <div className="min-w-30 flex items-center justify-between gap-2 px-2 py-2 border border-gray-300 rounded-lg shadow-lg hover:bg-gray-100 dark:shadow-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
      <h5 className="text-lg font-semibold font-mono tracking-tight dark:text-gray-200 w-full text-center">
        {/* Optional: Format with fixed number of characters */}
        {netValue?.toFixed(2).padStart(8, " ")}
      </h5>
    </div>
  );
};

export default NetValueCard;
