const NumberCards = ({ currentTime, spot, delta }) => {
  return (
    <div className="max-w-sm flex items-center justify-between gap-2 px-2 py-1  border border-gray-300 rounded-lg shadow-lg dark:shadow-gray-800 hover:bg-gray-100  dark:border-gray-700 dark:hover:bg-gray-700 ">
      <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white font-mono">
        {spot}
      </h5>

      <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
        {currentTime}
      </p>
    </div>
  );
};

export default NumberCards;
