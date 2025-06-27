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
  groupOptionData,
} = require("../services/dataStreamer");

let datasets = {
  call: [],
  put: [],
  spot: [],
};

(async () => {
  datasets.call = await loadCSVData(path.join(__dirname, "../data/call.csv"));
  datasets.put = await loadCSVData(path.join(__dirname, "../data/put.csv"));
  datasets.spot = await loadCSVData(path.join(__dirname, "../data/spot.csv"));
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
        datasets.call,
        datasets.put,
        clientState,
        clientId
      );
    }
  }

  // subscribe the socket to start spot data ------------

  socket.on("subscribe", ({ startTime }) => {
    console.log(`[${clientId}] Subscribed at ${startTime}`);

    const prev = clientState.get(clientId) || {
      call: { strikes: [], grouped: {} },
      put: { strikes: [], grouped: {} },
      startTime,
      index: 0,
      paused: false,
    };

    // Ensure strikes arrays are initialized
    if (!prev.call.strikes) prev.call.strikes = [];
    if (!prev.put.strikes) prev.put.strikes = [];

    prev.startTime = startTime;
    prev.index = 0;
    prev.paused = false;

    // Use existing strikes if present
    prev.call.grouped = groupOptionData(
      datasets.call,
      prev.call.strikes,
      startTime
    );
    prev.put.grouped = groupOptionData(
      datasets.put,
      prev.put.strikes,
      startTime
    );

    clientState.set(clientId, prev);
    stopStreaming(clientId);
    startStreaming(
      socket,
      prev,
      datasets.spot,
      datasets.call,
      datasets.put,
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
    state[type].grouped = groupOptionData(
      datasets[type],
      mergedStrikes,
      state.startTime
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
    state[type].grouped = groupOptionData(
      datasets[type],
      updatedStrikes,
      state.startTime
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
      datasets.call,
      datasets.put,
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

  // socket disconnect event--------------

  socket.on("disconnect", () => {
    console.log(`[SOCKET] Disconnected: ${socket.id}`);
  });
};
