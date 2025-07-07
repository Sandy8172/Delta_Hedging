import React, { useEffect, useState } from "react";
import { getSocket } from "../utils/socket";
import toast from "react-hot-toast";
import { toastPromise } from "../utils/toast.promise";
import SessionList from "./SessionList";

const TopDrawer = ({ onClose }) => {
  const [selectedTime, setSelectedTime] = useState(1000);
  const [sessionName, setSessionName] = useState("");
  const [isSessionListOpen, setIsSessionListOpen] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("get_interval"); // 🔁 Ask for current interval

    socket.on("interval_updated", ({ interval }) => {
      setSelectedTime(interval);
    });

    return () => {
      socket.off("interval_updated");
    };
  }, []);

  const changeInterval = (newInterval) => {
    const socket = getSocket(); // Always use the same instance

    if (!socket) return toast.error("⚠️ No socket connection!");

    const updatePromise = new Promise((resolve, reject) => {
      socket.emit("update_interval", {
        interval: newInterval,
      });

      socket.once("interval_updated", ({ interval, status }) => {
        if (status === "successfull") {
          resolve();
          setSelectedTime(interval);
        } else reject("Somthing went wrong!");
      });

      setTimeout(() => reject("⚠️ No response from server"), 10000);
    });
    const message = {
      loading: `Changing interval to ${newInterval} ms...`,
      success: `Interval changed successfully to ${newInterval} ms.`,
      error: `Failed to set interval to ${newInterval} ms.`,
    };
    toastPromise(updatePromise, message);
  };

  const handleToggle = (e) => {
    const isFast = e.target.checked;
    const newInterval = isFast ? 500 : 1000;
    setSelectedTime(newInterval);
    changeInterval(newInterval);
  };

  const handleSessionNameChange = (e) => {
    setSessionName(e.target.value);
  };
  //   console.log(sessionName);

  const handleSaveSession = (e) => {
    e.preventDefault();
    if (!sessionName) return toast.error("Session name cannot be empty");
    const socket = getSocket();
    if (!socket) return toast.error("Socket not connected");

    const promise = new Promise((resolve, reject) => {
      socket.emit("save_session", { sessionName });
      socket.once("session_saved", ({ success }) => {
        if (success) {
          resolve();
          setSessionName("");
        } else reject("Failed to save session");
      });
    });

    toastPromise(promise, {
      loading: "Saving session...",
      success: "Session saved!",
      error: "Failed to save session",
    });
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 w-full p-4 transition-transform bg-gray-100 dark:bg-gray-800"
      tabIndex="-1"
    >
      <label className="inline-flex items-center cursor-pointer">
        <span className="mr-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          1000 ms
        </span>
        <input
          type="checkbox"
          className="sr-only peer"
          checked={selectedTime === 500}
          onChange={handleToggle}
        />
        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
        <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          500 ms
        </span>
      </label>

      <form
        onSubmit={handleSaveSession}
        className="mt-4 flex items-center justify-start gap-x-4"
      >
        <input
          type="text"
          placeholder="session name"
          required
          value={sessionName}
          onChange={handleSessionNameChange}
          className=" p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />

        <button
          className=" focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-2 py-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 cursor-pointer"
          type="submit"
        >
          save session
        </button>
      </form>
      <button
        onClick={() => setIsSessionListOpen(true)}
        className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-pink-500 to-orange-400 group-hover:from-pink-500 group-hover:to-orange-400 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-pink-200 dark:focus:ring-pink-800 mt-3 cursor-pointer"
      >
        <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
          Show Sessions
        </span>
      </button>
      <button
        className="absolute z-50 right-0 bottom-0 focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 cursor-pointer"
        onClick={onClose}
      >
        Close
      </button>
      {isSessionListOpen && (
        <SessionList onClose={() => setIsSessionListOpen(false)} />
      )}
    </div>
  );
};

export default TopDrawer;
