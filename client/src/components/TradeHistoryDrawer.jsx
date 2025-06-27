import { Rnd } from "react-rnd";
const TradeHistoryDrawer = ({ onClose }) => {
  const callHistoryLogs = JSON.parse(
    localStorage.getItem(`qty_log_call`) || "[]"
  );
  const putHistoryLogs = JSON.parse(
    localStorage.getItem(`qty_log_put`) || "[]"
  );

  const clearTradeHistory = () => {
    localStorage.removeItem(`qty_log_call`);
    localStorage.removeItem(`qty_log_put`);
  };

  return (
    <Rnd
      default={{
        x: 100 + 50,
        y: 50 + 50,
        width: 780,
        height: 200,
      }}
      bounds="window"
      dragHandleClassName="drag-handle"
      style={{
        zIndex: 100, // Set the desired z-index
        position: "absolute", // Ensure the position is absolute for z-index to work
      }}
    >
      <div className="drag-handle h-auto p-6 pt-2 z-10 bg-gray-200 border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-900 cursor-pointer">
        <h1 className="mb-4 flex justify-center items-center gap-6 text-XL text-center font-extrabold text-gray-900 dark:text-white md:text-2xl lg:text-3xl">
          <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">
            Trade History
          </span>
        </h1>

        <svg
          className="w-6 h-6 text-gray-800 dark:text-white absolute right-1 top-1 bg-gray-300 dark:bg-gray-900 rounded-md dark:hover:bg-gray-700"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
          onClick={() => onClose()}
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18 17.94 6M18 18 6.06 6"
          />
        </svg>
        {(callHistoryLogs.length > 0 || putHistoryLogs.length > 0) && (
          <svg
            className="w-6 h-6 text-red-700 dark:text-red-600 absolute left-1 top-1 bg-gray-300 dark:bg-gray-900 rounded-md dark:hover:bg-gray-700"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            onClick={clearTradeHistory}
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
            />
          </svg>
        )}
        {callHistoryLogs.length === 0 && putHistoryLogs.length === 0 && (
          <h4 className="text-xl font-serif font-bold text-gray-500 text-center">
            History not found
          </h4>
        )}
        <div className="flex gap-10">
          {callHistoryLogs?.length > 0 && (
            <div className="relative overflow-x-auto scrollbar-custom max-h-[50vh]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r text-xl to-blue-600 font-bold from-red-400">
                Call Logs
              </span>
              
              <table className="w-full text-xs text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs sticky top-0 text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 ">
                  <tr>
                    <th scope="col" className="px-2 py-2 rounded-tl-xl">
                      Time
                    </th>
                    <th scope="col" className="px-2 py-2">
                      Strike
                    </th>
                    <th scope="col" className="px-2 py-2">
                      Qty
                    </th>
                    <th scope="col" className="px-2 py-2">
                      TQty
                    </th>
                    <th scope="col" className="px-2 py-2">
                      CurrValue
                    </th>
                    <th scope="col" className="px-2 py-2 rounded-tr-xl">
                      TValue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {callHistoryLogs?.map((row, ind) => {
                    return (
                      <tr key={ind} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                        <th
                          scope="row"
                          className="px-2 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          {row.time}
                        </th>
                        <td className="px-2 py-2"> {row.strike}</td>
                        <td className="px-2 py-2"> {row.addedQty}</td>
                        <td className="px-2 py-2"> {row.totalQty}</td>
                        <td className="px-2 py-2"> {row.currentValue}</td>
                        <td className="px-2 py-2"> {row.totalValue}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {putHistoryLogs?.length > 0 && (
            <div className="relative overflow-x-auto scrollbar-custom max-h-[50vh]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r text-xl to-emerald-600 font-bold from-sky-400">
                Put Logs
              </span>
              <table className="w-full text-xs text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-2 py-2  rounded-tl-xl">
                      Time
                    </th>
                    <th scope="col" className="px-2 py-2">
                      Strike
                    </th>
                    <th scope="col" className="px-2 py-2">
                      Qty
                    </th>
                    <th scope="col" className="px-2 py-2">
                      TQty
                    </th>
                    <th scope="col" className="px-2 py-2">
                      CurrValue
                    </th>
                    <th scope="col" className="px-2 py-2  rounded-tr-xl">
                      TValue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {putHistoryLogs?.map((row, ind) => {
                    return (
                      <tr key={ind} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                        <th
                          scope="row"
                          className="px-2 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          {row.time}
                        </th>
                        <td className="px-2 py-2"> {row.strike}</td>
                        <td className="px-2 py-2"> {row.addedQty}</td>
                        <td className="px-2 py-2"> {row.totalQty}</td>
                        <td className="px-2 py-2"> {row.currentValue}</td>
                        <td className="px-2 py-2"> {row.totalValue}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
};

export default TradeHistoryDrawer;
