import { useState, useEffect, useMemo } from "react";
import { getSocket } from "../utils/socket";
import { toastPromise } from "../utils/toast.promise";

const headers = [
  "Strike",
  "Time",
  "Type",
  "Bid",
  "Ltp",
  "Ask",
  "Qty",
  "TotalQty",
  "TotalValue",
];
const Table = ({ dataRows, type, onTotalValueChange, factor }) => {
  const [selectedStrikes, setSelectedStrikes] = useState([]);
  const [quantities, setQuantities] = useState({}); // { strike: totalQty }
  const [inputValues, setInputValues] = useState({}); // { strike: currentInput }

  useEffect(() => {
    const key = `qty_log_${type}`;
    const log = JSON.parse(localStorage.getItem(key) || "[]");

    // Reduce log into latest totalQty per strike
    const latestQuantities = {};
    log.forEach((entry) => {
      latestQuantities[entry.strike] = entry.totalQty;
    });

    setQuantities(latestQuantities); // 🧠 initialize from log
  }, []);

  const CheckboxClickHandler = (strike) => {
    setSelectedStrikes((prev) =>
      prev.includes(strike)
        ? prev.filter((s) => s !== strike)
        : [...prev, strike]
    );
  };

  const handleQtySubmit = (strike, value, bid, ask, time) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;

    const prevQty = quantities[strike] || 0; // ✅ use latest quantity
    const newQty = prevQty + parsed;
    const avg = (parseFloat(bid) + parseFloat(ask)) / 2;
    const currentValue =
      parsed >= 0 ? (parsed * ask).toFixed(2) : (parsed * bid).toFixed(2);
    const totalValue = newQty * avg;

    const entry = {
      time,
      strike,
      addedQty: parsed,
      totalQty: newQty,
      currentValue,
      totalValue: +totalValue.toFixed(2),
    };

    // ✅ Update localStorage outside setQuantities
    const key = `qty_log_${type}`;
    const prevLog = JSON.parse(localStorage.getItem(key) || "[]");
    prevLog.push(entry);
    localStorage.setItem(key, JSON.stringify(prevLog));

    // ✅ Then update state
    setQuantities((prev) => ({ ...prev, [strike]: newQty }));
    setInputValues((prev) => ({ ...prev, [strike]: "" }));
  };

  const handleInputKeyDown = (e, strike, bid, ask, time) => {
    if (e.key === "Enter") {
      e.preventDefault();

      handleQtySubmit(strike, inputValues[strike], bid, ask, time);
    }
  };

  const handleInputChange = (e, strike) => {
    setInputValues((prev) => ({ ...prev, [strike]: e.target.value }));
  };

  const handleRemoveStrikes = () => {
    if (selectedStrikes.length === 0) return;

    const socket = getSocket(); // Always use the same instance

    if (!socket) return toast.error("⚠️ No socket connection!");

    const removePromise = new Promise((resolve, reject) => {
      socket.emit("remove", {
        type,
        remove: selectedStrikes,
      });

      socket.once("removed", ({ type: removedType }) => {
        if (removedType === type) resolve();
        else reject("Type mismatch on server");
      });

      setTimeout(() => reject("No response from server"), 4000);
    });
    const message = {
      loading: `Removing ${type} strikes...`,
      success: `${type.toUpperCase()} strikes removed successfully!`,
      error: `Failed to remove ${type} strikes.`,
    };
    toastPromise(removePromise, message);
    setSelectedStrikes([]);
  };

  const totalRow = dataRows.reduce(
    (acc, ele) => {
      const strike = ele.Strike_Price;
      const qty = quantities[strike] || 0;
      const bid = parseFloat(ele.Bid);
      const ask = parseFloat(ele.Ask);
      const avg = (bid + ask) / 2;
      const value = qty * avg;

      acc.totalQty += qty;
      acc.totalValue += value;

      return acc;
    },
    { totalQty: 0, totalValue: 0 }
  );
  useEffect(() => {
    onTotalValueChange(totalRow.totalValue);
  }, [totalRow.totalValue]);

  const sortedDataRows = useMemo(() => {
    return [...dataRows].sort((a, b) => a.Strike_Price - b.Strike_Price);
  }, [dataRows]);

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-h-[37vh] mt-2 scrollbar-custom ">
      <table className="w-full table-fixed  text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 max-h-[50%]">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
          <tr>
            <th className="w-12">
              {selectedStrikes.length > 0 && (
                <button
                  onClick={handleRemoveStrikes}
                  className="px-5 cursor-pointer"
                >
                  <svg
                    className="w-6 h-6 text-red-800 dark:text-red-500"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
                    />
                  </svg>
                </button>
              )}
            </th>
            {headers?.map((header, index) => (
              <th key={index} scope="col" className="px-6 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedDataRows?.map((ele, ind) => {
            const strike = ele.Strike_Price;
            const totalQty = quantities[strike] || 0;
            const avg = (parseFloat(ele.Bid) + parseFloat(ele.Ask)) / 2;
            const totalValue = (avg * totalQty).toFixed(2);
            return (
              <tr key={ele.Strike_Price} className="animate-fade-in-row">
                <th scope="row" className="px-6">
                  <input
                    id="checkbox"
                    type="checkbox"
                    tabIndex={-1}
                    onChange={() => CheckboxClickHandler(ele.Strike_Price)}
                    checked={selectedStrikes.includes(ele.Strike_Price)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                  />
                </th>
                <th
                  scope="row"
                  className="px-6 py-0.25 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                >
                  {ele.Strike_Price}
                </th>
                <td className="px-6 py-.25">{ele.Time}</td>
                <td className="px-6 py-.25">{type}</td>
                <td className="px-6 py-.25">{ele.Bid}</td>
                <td className="px-6 py-.25 bg-gray-200 text-black font-semibold  dark:text-gray-200 dark:bg-gray-700">
                  <span className="">
                    {avg >= factor ? factor : avg.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-.25">{ele.Ask}</td>
                <td className="px-6 py-.25">
                  <input
                    type="number"
                    value={inputValues[strike] || ""}
                    onChange={(e) => handleInputChange(e, strike)}
                    onKeyDown={(e) =>
                      handleInputKeyDown(e, strike, ele.Bid, ele.Ask, ele.Time)
                    }
                    className="w-20 px-2 py-1 my-0.25 rounded bg-gray-100 dark:bg-gray-600"
                    placeholder="+/- qty"
                  />
                </td>
                <td className="px-6 py-.25">{totalQty}</td>
                <td className="px-6 py-.25">
                  {isNaN(totalValue) ? 0 : totalValue}
                </td>
              </tr>
            );
          })}
          <tr className="bg-gray-50 dark:bg-gray-950 dark:text-gray-300 font-bold sticky bottom-0 left-0 right-0">
            <td colSpan="8" className="px-6 py-2 text-right">
              TOTAL
            </td>
            <td className="px-6 py-2">{totalRow.totalQty}</td>
            <td className="px-6 py-2">{totalRow.totalValue.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Table;
