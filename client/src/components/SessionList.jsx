import React, { useState, useEffect } from "react";
import { getSocket } from "../utils/socket";
import { toastPromise } from "../utils/toast.promise";

const SessionList = ({ onClose }) => {
  const [sessions, setSessions] = useState({});

  const fetchSessions = () => {
    const socket = getSocket();
    socket.emit("get_sessions");
    socket.on("sessions_list", (data) => {
      setSessions(data);
    });
  };
  useEffect(() => {
    fetchSessions();
  }, []);

  const resumeSession = (sessionKey) => {
    const socket = getSocket();

    if (!socket || !sessionKey) {
      return toast.error("⚠️ No session or socket found.");
    }

    const resumePromise = new Promise((resolve, reject) => {
      socket.emit("resume_session", { sessionKey });

      socket.once("resumed_session", ({ success }) => {
        if (success) {
          resolve();
          onClose();
        } else reject("⚠️ Failed to resume session.");
      });

      setTimeout(() => reject("⏱️ Server took too long to respond."), 10000);
    });

    toastPromise(resumePromise, {
      loading: `Resuming "${sessions?.[sessionKey]?.name}"...`,
      success: "Session resumed successfully.",
      error: "Failed to resume session.",
    });
  };
  const deleteSession = (sessionKey) => {
    const socket = getSocket();
    if (!socket) return toast.error("⚠️ Socket not connected");

    const deletePromise = new Promise((resolve, reject) => {
      socket.emit("delete_session", { sessionKey });

      socket.once("session_deleted", ({ success, message }) => {
        if (success) {
          resolve(message);
          onClose();
        } else reject(message);
      });

      setTimeout(() => reject("Server did not respond in time"), 8000);
    });

    toastPromise(deletePromise, {
      loading: `Deleting session "${sessionKey}"...`,
      success: (msg) => `${msg}`,
      error: (msg) => `${msg}`,
    });
  };

  return (
    <div
      tabIndex="-1"
      className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg max-h-[50vh] overflow-y-auto bg-gray-600 p-2 rounded shadow-lg scrollbar-custom"
    >
      <div className="relative p-1 w-full max-w-lg max-h-full">
        <div className="relative bg-gray-50 rounded-lg shadow-sm dark:bg-gray-700">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Sessions List
            </h3>
            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer"
              onClick={() => onClose()}
            >
              <svg
                className="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>

          <div className="p-4 md:p-5 ">
            {Object.entries(sessions).map(([key, session]) => (
              <div key={key} className="mt-4">
                <span className="text-md font-normal text-gray-900 dark:text-white">
                  {session.name} - {session.savedAt}
                </span>
                <button
                  className="px-3 py-2 text-xs font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 ml-4 cursor-pointer"
                  onClick={() => resumeSession(key)}
                >
                  Resume
                </button>
                <button
                  className="px-3 py-2 text-xs font-medium text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 ml-4 cursor-pointer"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this session?"
                      )
                    ) {
                      deleteSession(key);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            {Object.entries(sessions).length === 0 && (
              <p className="dark:text-white">No sessions found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionList;
