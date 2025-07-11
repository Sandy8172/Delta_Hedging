// const path = require("path");
// const { loadCSVData } = require("../utils/csvLoader");
// const {
//   startStreaming,
//   stopStreaming,
//   groupOptionData,
// } = require("../services/dataStreamer");

// let datasets = {
//   call: [],
//   put: [],
//   spot: [],
// };

// (async () => {
//   datasets.call = await loadCSVData(path.join(__dirname, "../data/call.csv"));
//   datasets.put = await loadCSVData(path.join(__dirname, "../data/put.csv"));
//   datasets.spot = await loadCSVData(path.join(__dirname, "../data/spot.csv"));
// })();

// const clientState = new Map(); // socket.id -> state

// module.exports = function (socket) {
//   // logic for getting strikes list from server---------
//   socket.on("get_strikes", async () => {
//     const waitUntilLoaded = () => {
//       return new Promise((resolve) => {
//         const check = () => {
//           if (datasets.call.length && datasets.put.length) {
//             resolve();
//           } else {
//             setTimeout(check, 100); // check every 100ms
//           }
//         };
//         check();
//       });
//     };

//     await waitUntilLoaded();

//     const callStrikes = [
//       ...new Set(datasets.call.map((row) => row.Strike_Price)),
//     ];
//     const putStrikes = [
//       ...new Set(datasets.put.map((row) => row.Strike_Price)),
//     ];
//     socket.emit("strikes_list", {
//       call: callStrikes.sort((a, b) => a - b),
//       put: putStrikes.sort((a, b) => a - b),
//     });
//   });

//   // subscribe the socket to start spot data ------------

//   socket.on("subscribe", ({ startTime }) => {
//     console.log(`[${socket.id}] Subscribed at ${startTime}`);

//     const prev = clientState.get(socket.id) || {
//       call: { strikes: [], grouped: {} },
//       put: { strikes: [], grouped: {} },
//       startTime,
//       index: 0,
//       paused: false,
//     };

//     prev.startTime = startTime;
//     prev.index = 0;
//     prev.paused = false;

//     // Use existing strikes if present
//     prev.call.grouped = groupOptionData(
//       datasets.call,
//       prev.call.strikes,
//       startTime
//     );
//     prev.put.grouped = groupOptionData(
//       datasets.put,
//       prev.put.strikes,
//       startTime
//     );

//     clientState.set(socket.id, prev);
//     startStreaming(
//       socket,
//       clientState.get(socket.id),
//       datasets.spot,
//       clientState
//     );
//   });

//   // adding new strikes to existing group--------------

//   socket.on("update", ({ type, strikes }) => {
//     const state = clientState.get(socket.id);
//     if (!state) return;

//     console.log(`[${socket.id}] Updating ${type} strikes:`, strikes);

//     // Merge new strikes into existing
//     const existingStrikes = new Set(state[type].strikes);
//     strikes.forEach((s) => existingStrikes.add(s));

//     const mergedStrikes = Array.from(existingStrikes);
//     state[type].strikes = mergedStrikes;
//     state[type].grouped = groupOptionData(
//       datasets[type],
//       mergedStrikes,
//       state.startTime
//     );

//     clientState.set(socket.id, state);
//     socket.emit("updated", {
//       type,
//       strikes: mergedStrikes,
//     });
//   });

//   // removing strikes from existing group--------------

//   socket.on("remove", ({ type, remove }) => {
//     const state = clientState.get(socket.id);
//     if (!state) return;

//     const currentStrikes = new Set(state[type].strikes);
//     remove.forEach((strike) => currentStrikes.delete(strike));

//     const updatedStrikes = Array.from(currentStrikes);
//     state[type].strikes = updatedStrikes;
//     state[type].grouped = groupOptionData(
//       datasets[type],
//       updatedStrikes,
//       state.startTime
//     );

//     clientState.set(socket.id, state);

//     socket.emit("removed", {
//       type,
//       strikes: updatedStrikes,
//     });
//   });

//   // paushing data to client--------------

//   socket.on("pause", () => {
//     const state = clientState.get(socket.id);
//     if (!state) return;
//     state.paused = true;
//     clientState.set(socket.id, state);
//     // console.log(`[${socket.id}] Paused streaming.`);
//     socket.emit("paused", {
//       status: "paushed successfully",
//     });
//   });

//   // resuming data to client--------------

//   socket.on("resume", () => {
//     const state = clientState.get(socket.id);
//     if (!state) return;
//     state.paused = false;
//     clientState.set(socket.id, state);
//     // console.log(`[${socket.id}] Resumed streaming.`);
//     socket.emit("resumed", {
//       status: "resumed successfully",
//     });
//   });

//   // terminating streaming and removing client from state--------------

//   socket.on("terminate", () => {
//     stopStreaming(socket.id);
//     clientState.delete(socket.id);
//     console.log(`[${socket.id}] Terminated and removed.`);
//   });

//   // socket disconnect event--------------

//   socket.on("disconnect", () => {
//     console.log(`[SOCKET] Disconnected: ${socket.id}`);
//     stopStreaming(socket.id);
//     clientState.delete(socket.id);
//   });
// };

const path = require("path");
const { loadCSVData } = require("../utils/csvLoader");
const {
  startStreaming,
  stopStreaming,
  preGroupByTimeAndStrike,
  groupFromPreGrouped,
  timeToSeconds,
} = require("../services/dataStreamer");
const {
  saveSession,
  getAllSessions,
  deleteSession,
} = require("../utils/sessionStore");

let datasets = {
  call: [],
  put: [],
  spot: [],
};
let preGroupedCall = {};
let preGroupedPut = {};
let isDataReady = false;

(async () => {
  datasets.call = await loadCSVData(path.join(__dirname, "../data/call.csv"));
  datasets.put = await loadCSVData(path.join(__dirname, "../data/put.csv"));
  datasets.spot = await loadCSVData(path.join(__dirname, "../data/spot.csv"));

  // ✅ Only call after datasets are loaded
  preGroupedCall = preGroupByTimeAndStrike(datasets.call);
  preGroupedPut = preGroupByTimeAndStrike(datasets.put);

  isDataReady = true;
  console.log("📦 Datasets loaded & grouped");
})();

const clientState = new Map(); // socket.id -> state
const clientSocketMap = new Map(); // clientId -> socket.id

module.exports = function (socket) {
  const clientId = socket.handshake.query.clientId;
  // console.log(clientId);

  if (!clientId) {
    console.warn(`[${socket.id}] Missing clientId in handshake query.`);
    return;
  }

  clientSocketMap.set(clientId, socket);

  // logic for getting strikes list from server---------
  socket.on("get_strikes", async () => {
    const waitUntilLoaded = () => {
      return new Promise((resolve) => {
        const check = () => {
          if (datasets.call.length && datasets.put.length) {
            resolve();
          } else {
            setTimeout(check, 100); // check every 100ms
          }
        };
        check();
      });
    };

    await waitUntilLoaded();

    const callStrikes = [
      ...new Set(datasets.call.map((row) => row.Strike_Price)),
    ];
    const putStrikes = [
      ...new Set(datasets.put.map((row) => row.Strike_Price)),
    ];
    socket.emit("strikes_list", {
      call: callStrikes.sort((a, b) => a - b),
      put: putStrikes.sort((a, b) => a - b),
    });
  });

  // notify frontend that data is ready

  socket.on("check_data_ready", () => {
    const checkInterval = setInterval(() => {
      if (isDataReady) {
        socket.emit("data_ready", { ready: true });
        clearInterval(checkInterval);
      }
    }, 200); // Check every 200ms
  });

  // Resume stream on reconnect if state exists
  if (clientState.has(clientId)) {
    const existing = clientState.get(clientId);

    // ✅ Let frontend know if stream is paused or not
    socket.emit("status", {
      paused: existing.paused,
      callStrikes: existing.call?.strikes || [],
      putStrikes: existing.put?.strikes || [],
      startTime: existing.startTime,
    });

    stopStreaming(clientId);

    if (!existing.paused) {
      startStreaming(
        socket,
        existing,
        datasets.spot,
        preGroupedCall,
        preGroupedPut,
        clientState,
        clientId
      );
    }
  }

  // subscribe the socket to start spot data ------------

  socket.on("subscribe", ({ startTime, exchange }) => {
    console.log(`[${clientId}] Subscribed at ${startTime} for ${exchange}`);

    const prev = clientState.get(clientId) || {
      call: { strikes: [], grouped: {} },
      put: { strikes: [], grouped: {} },
      startTime,
      exchange,
      index: 0,
      paused: false,
      interval: 1000,
    };

    // Ensure strikes arrays are initialized
    if (!prev.call.strikes) prev.call.strikes = [];
    if (!prev.put.strikes) prev.put.strikes = [];

    prev.startTime = startTime;
    prev.exchange = exchange;
    prev.index = 0;
    prev.paused = false;
    prev.interval = prev.interval || 1000;

    // Use existing strikes if present
    prev.call.grouped = groupFromPreGrouped(
      preGroupedCall,
      prev.call.strikes,
      timeToSeconds(startTime)
    );
    prev.put.grouped = groupFromPreGrouped(
      preGroupedPut,
      prev.put.strikes,
      timeToSeconds(startTime)
    );

    clientState.set(clientId, prev);
    stopStreaming(clientId);
    startStreaming(
      socket,
      prev,
      datasets.spot,
      preGroupedCall,
      preGroupedPut,
      clientState,
      clientId
    );
  });

  // adding new strikes to existing group--------------

  socket.on("update", ({ type, strikes }) => {
    const state = clientState.get(clientId);
    if (!state) return;

    // console.log(`[${socket.id}] Updating ${type} strikes:`, strikes);

    // Merge new strikes into existing
    const existingStrikes = new Set(state[type].strikes);
    strikes.forEach((s) => existingStrikes.add(s));

    const mergedStrikes = Array.from(existingStrikes);
    state[type].strikes = mergedStrikes;
    state[type].grouped = groupFromPreGrouped(
      type === "call" ? preGroupedCall : preGroupedPut,
      mergedStrikes,
      timeToSeconds(state.startTime)
    );

    clientState.set(clientId, state);
    socket.emit("updated", {
      type,
      strikes: mergedStrikes,
    });
  });

  // removing strikes from existing group--------------

  socket.on("remove", ({ type, remove }) => {
    const state = clientState.get(clientId);
    if (!state) return;

    const currentStrikes = new Set(state[type].strikes);
    remove.forEach((strike) => currentStrikes.delete(strike));

    const updatedStrikes = Array.from(currentStrikes);
    state[type].strikes = updatedStrikes;
    state[type].grouped = groupFromPreGrouped(
      type === "call" ? preGroupedCall : preGroupedPut,
      updatedStrikes,
      timeToSeconds(state.startTime)
    );

    clientState.set(clientId, state);

    socket.emit("removed", {
      type,
      strikes: updatedStrikes,
    });
  });

  // paushing data to client--------------

  socket.on("pause", () => {
    const state = clientState.get(clientId);
    if (!state) return;
    state.paused = true;
    clientState.set(clientId, state);
    stopStreaming(clientId);
    console.log(`[${socket.id}] Paused streaming.`);
    socket.emit("paused", {
      status: "paushed successfully",
    });
  });

  // resuming data to client--------------

  socket.on("resume", () => {
    const state = clientState.get(clientId);
    if (!state) return;
    state.paused = false;
    clientState.set(clientId, state);
    console.log(`[${socket.id}] Resumed streaming.`);
    socket.emit("resumed", {
      status: "resumed successfully",
    });
    stopStreaming(clientId);
    // ✅ Actively resume streaming
    startStreaming(
      socket,
      state,
      datasets.spot,
      preGroupedCall,
      preGroupedPut,
      clientState,
      clientId
    );
  });

  // terminating streaming and removing client from state--------------

  socket.on("terminate", () => {
    stopStreaming(clientId);
    clientState.delete(clientId);
    console.log(`[${clientId}] Terminated and removed.`);
  });

  // dynamically update streaming interval
  socket.on("update_interval", ({ interval }) => {
    const state = clientState.get(clientId);
    if (!state) return;

    state.interval = Number(interval) || 1000; // fallback to 1000ms
    clientState.set(clientId, state);

    console.log(`[${clientId}] Updated interval to ${state.interval}ms`);

    // Restart streaming with new interval -------------
    stopStreaming(clientId);
    startStreaming(
      socket,
      state,
      datasets.spot,
      preGroupedCall,
      preGroupedPut,
      clientState,
      clientId
    );

    socket.emit("interval_updated", {
      status: "successfull",
      interval: state.interval,
    });
  });

  // expose current interval ----
  socket.on("get_interval", () => {
    const state = clientState.get(clientId);
    if (!state) return;

    socket.emit("interval_updated", {
      interval: state.interval || 1000,
      status: "interval fetched successfully",
    });
  });

  // saveing the session -----------------

  socket.on("save_session", ({ sessionName }) => {
    const state = clientState.get(clientId);
    if (!state) return socket.emit("session_saved", { success: false });

    saveSession(clientId, state, sessionName);
    socket.emit("session_saved", { success: true, state });
  });

  // getting the session -----------------

  socket.on("get_sessions", () => {
    const allSessions = getAllSessions();

    const filteredSessions = {};

    for (const sessionKey in allSessions) {
      const { savedAt, name, exchange } = allSessions[sessionKey];
      filteredSessions[sessionKey] = { savedAt, name, exchange };
    }

    socket.emit("sessions_list", filteredSessions);
  });

  // resuming the session-----------------

  socket.on("resume_session", ({ sessionKey }) => {
    const allSessions = getAllSessions();
    const session = allSessions[sessionKey];

    if (!session) {
      console.warn(
        `[${clientId}] Tried to resume unknown session: ${sessionKey}`
      );
      return socket.emit("resumed_session", { success: false });
    }

    clientState.set(clientId, session);
    stopStreaming(clientId);
    startStreaming(
      socket,
      session,
      datasets.spot,
      preGroupedCall,
      preGroupedPut,
      clientState,
      clientId
    );
    socket.emit("resumed_session", { success: true });
  });

  // deleting the session-----------------

  socket.on("delete_session", ({ sessionKey }) => {
    const success = deleteSession(sessionKey);

    socket.emit("session_deleted", {
      success,
      sessionKey,
      message: success
        ? `Session "${sessionKey}" deleted successfully.`
        : `Session "${sessionKey}" not found.`,
    });
  });

  // socket disconnect event--------------

  socket.on("disconnect", () => {
    console.log(`[SOCKET] Disconnected: ${socket.id}`);
  });
};
