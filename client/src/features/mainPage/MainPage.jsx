import { useEffect, useRef, useState, useMemo } from "react";
import DarkmodeToggle from "../../utils/DarkmodeToggle";
import Table from "../../components/Table";
import StrikesForm from "../../components/StrikesForm";
import SpotCard from "../../ui/SpotCard";
import Factor_DeltaCard from "../../ui/Factor_DeltaCard";
import PnlCard from "../../ui/PnlCard";
import {
  createSocketConnection,
  disconnectSocket,
  getSocket,
  clearClientId,
} from "../../utils/socket";
import { toastPromise } from "../../utils/toast.promise";
import TradeHistoryDrawer from "../../components/TradeHistoryDrawer";
import NetValueCard from "../../ui/NetValueCard";
import toast from "react-hot-toast";

const MainPage = () => {
  const [startTime, setStartTime] = useState("09:15:00");
  const [exchange, setExchange] = useState("");
  // const [isStreaming, setIsStreaming] = useState(false);
  const [data, setData] = useState({});
  const [availableStrikes, setAvailableStrikes] = useState({
    call: [],
    put: [],
  });
  const [streamStatus, setStreamStatus] = useState("idle"); // idle | active | paused

  const [isTradeHistoryOpen, setIsTradeHistoryOpen] = useState(false);
  const [callTotalValue, setCallTotalValue] = useState(0);
  const [putTotalValue, setPutTotalValue] = useState(0);

  const socketRef = useRef();

  useEffect(() => {
    const socket = createSocketConnection();
    socketRef.current = socket;

    socket.on("connect", () => {
      // console.log("Socket connected:", socket.id);

      // Get all available strikes
      socket.emit("get_strikes");
    });

    socket.on("status", ({ paused }) => {
      // console.log("Connection status:", paused ? "Paused" : "Active");
      if (paused) {
        setStreamStatus("paused");
      } else {
        setStreamStatus("active");
      }
    });

    socket.on("strikes_list", ({ call, put }) => {
      setAvailableStrikes({ call, put });
    });

    socket.on("tick", (payload) => {
      setData(payload);
      setStreamStatus("active");
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!exchange || !startTime) {
      toast.error("Please enter both exchange and start time.");
      return;
    }
    const subscribePromise = new Promise((resolve, reject) => {
      socketRef.current.emit("subscribe", { startTime, exchange });

      // You can use a timeout or a "tick" confirmation event to resolve
      socketRef.current.once("tick", () => {
        resolve(); // Resolve when data starts streaming
        setStreamStatus("active");
      });

      // Optional: Reject after some time if no response
      setTimeout(() => reject("No response from server"), 150000);
    });
    const message = {
      loading: "Subscribing...",
      success: <b>Subscribed successfully!</b>,
      error: <b>Subscription failed.</b>,
    };
    toastPromise(subscribePromise, message);
  };

  const handlePause = () => {
    const pausePromise = new Promise((resolve, reject) => {
      socketRef.current.emit("pause");
      // Optional: Wait for a confirmation event
      socketRef.current.once("paused", () => {
        setStreamStatus("paused");
        resolve();
      });
      setTimeout(() => reject("Pause timeout"), 4000);
    });

    const message = {
      loading: "Pausing...",
      success: "Paused successfully.",
      error: "Failed to pause.",
    };
    toastPromise(pausePromise, message);
  };

  // Resume handler
  const handleResume = () => {
    const resumePromise = new Promise((resolve, reject) => {
      socketRef.current.emit("resume");
      socketRef.current.once("resumed", () => {
        setStreamStatus("active");
        resolve();
      });
      setTimeout(() => reject("Resume timeout"), 4000);
    });
    const message = {
      loading: "Resuming...",
      success: "Resumed successfully.",
      error: "Failed to resume.",
    };
    toastPromise(resumePromise, message);
  };

  // Terminate handler
  const handleTerminate = () => {
    const terminatePromise = new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket) return resolve(); // already cleaned up

      socket.emit("terminate");
      clearClientId();

      socket.off(); // remove listeners
      socket.disconnect(); // close connection
      socketRef.current = null;
      setCallTotalValue(0);
      setPutTotalValue(0);

      // Reconnect with new clientId
      const newSocket = createSocketConnection();
      socketRef.current = newSocket;
      setStreamStatus("idle");
      setData({});

      newSocket.on("connect", () => {
        newSocket.emit("get_strikes");
      });

      newSocket.on("tick", (payload) => {
        setData(payload);
        setStreamStatus("active");
      });

      newSocket.on("strikes_list", ({ call, put }) => {
        setAvailableStrikes({ call, put });
      });

      resolve();
    });
    const message = {
      loading: "Terminating...",
      success: "Terminated connection.",
      error: "Failed to terminate.",
    };
    toastPromise(terminatePromise, message);
  };
  const delta =
    (callTotalValue - putTotalValue) / (callTotalValue + putTotalValue);

  const pnl = useMemo(() => {
    const callTotalCurrValue = JSON.parse(
      localStorage.getItem("qty_log_call") || "[]"
    ).reduce((acc, curr) => acc + +curr?.currentValue, 0);

    const putTotalCurrValue = JSON.parse(
      localStorage.getItem("qty_log_put") || "[]"
    ).reduce((acc, curr) => acc + +curr?.currentValue, 0);

    return (
      callTotalValue + putTotalValue - (callTotalCurrValue + putTotalCurrValue)
    );
  }, [callTotalValue, putTotalValue]);

  const netValue = useMemo(() => {
    const callTotalCurrValue = JSON.parse(
      localStorage.getItem("qty_log_call") || "[]"
    ).reduce((acc, curr) => acc + +curr?.currentValue, 0);

    const putTotalCurrValue = JSON.parse(
      localStorage.getItem("qty_log_put") || "[]"
    ).reduce((acc, curr) => acc + +curr?.currentValue, 0);

    return callTotalCurrValue + putTotalCurrValue;
  }, [callTotalValue, putTotalValue]);

  // tradehistory key down event F8------------

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F8") {
        e.preventDefault(); // Optional: prevent browser default behavior
        setIsTradeHistoryOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div>
      <div className="flex justify-start items-start p-3 flex-wrap gap-4">
        <form
          onSubmit={handleSubscribe}
          className="flex flex-wrap sm:flex-nowrap gap-3 items-center w-full sm:w-auto max-w-2xl"
        >
          <div className="flex gap-x-2 items-center relative z-0 w-full">
            <input
              type="time"
              step="1"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              name="floating_time"
              id="floating_time"
              className="block py-2 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer cursor-pointer"
              placeholder=" "
              required
            />
            <label
              htmlFor="floating_time"
              className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              Start Time
            </label>
            <select
              id="exchange"
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-1 py-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 cursor-pointer"
              required
            >
              <option value="" disabled>
                Exchange
              </option>
              <option value="NIFTY">Nifty</option>
              <option value="SENSEX">Sensex</option>
            </select>
            <button
              type="submit"
              disabled={streamStatus !== "idle"}
              className="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-500"
            >
              Start
            </button>
          </div>

          <button
            type="button"
            onClick={handlePause}
            disabled={streamStatus !== "active"}
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-500"
          >
            Paush
          </button>
          <button
            type="button"
            onClick={handleResume}
            disabled={streamStatus !== "paused"}
            className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5  dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-500"
          >
            Resume
          </button>

          <button
            type="button"
            onClick={handleTerminate}
            disabled={streamStatus === "idle"}
            className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-500"
          >
            Terminate
          </button>
        </form>

        {/* Spot Card */}
        {data?.spot && (
          <div className="w-42 flex-shrink-0 ml-auto">
            <SpotCard currentTime={data?.time} spot={data?.spot?.Close} />
          </div>
        )}

        {/* Delta Card */}
        {streamStatus !== "idle" && (
          <div className="w-32 flex-shrink-0">
            <Factor_DeltaCard
              delta={delta?.toFixed(2)}
              factor={data?.factor?.toFixed(2)}
            />
          </div>
        )}
        {/* PnL & NetValue */}
        {(streamStatus == "active" || streamStatus == "paused") && (
          <div className="flex gap-2 flex-shrink-0">
            <div className="w-36">
              <PnlCard pnl={pnl} />
            </div>
            <div className="w-36">
              <NetValueCard netValue={netValue} />
            </div>
          </div>
        )}

        {/* Dark Mode Toggle */}
        <div className="flex-shrink-0 ml-auto">
          <DarkmodeToggle />
        </div>
      </div>

      <section
        className={`max-h-[40vh] px-6 ${
          streamStatus !== "active" && streamStatus !== "paused"
            ? "animate-slide-out-left"
            : "animate-slide-in-left"
        }`}
      >
        <StrikesForm type="call" availableStrikes={availableStrikes.call} />
        {data?.call?.length > 0 && (
          <Table
            dataRows={data?.call}
            type="call"
            onTotalValueChange={(value) => setCallTotalValue(value)}
            factor={data?.factor?.toFixed(2)}
          />
        )}
      </section>

      <section
        className={`max-h-[40vh] mt-14 px-6 ${
          streamStatus !== "active" && streamStatus !== "paused"
            ? "animate-slide-out-left"
            : "animate-slide-in-left"
        }`}
      >
        <StrikesForm type="put" availableStrikes={availableStrikes.put} />
        {data?.put?.length && (
          <Table
            dataRows={data?.put}
            type="put"
            onTotalValueChange={(value) => setPutTotalValue(value)}
            factor={data?.factor?.toFixed(2)}
          />
        )}
      </section>
      {isTradeHistoryOpen && (
        <TradeHistoryDrawer onClose={() => setIsTradeHistoryOpen(false)} />
      )}
    </div>
  );
};

export default MainPage;
