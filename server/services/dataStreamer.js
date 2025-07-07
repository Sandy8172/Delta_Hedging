// let intervalId = null;

// function startStreaming(socket, dataset, strikes, startTimeStr, type) {
//   const normalizedStrikes = strikes.map(Number);

//   const startTime = new Date(`1970-01-01T${startTimeStr}Z`);
//   const filteredData = dataset.filter(
//     (row) =>
//       normalizedStrikes.includes(Number(row.Strike_Price)) &&
//       new Date(`1970-01-01T${row.Time}Z`) >= startTime
//   );
//   console.log(filteredData.length);

//   // ✅ Group rows by time (e.g., '09:15:00')
//   const groupedByTime = {};
//   filteredData.forEach((row) => {
//     const timeKey = row.Time.padStart(8, "0");
//     if (!groupedByTime[timeKey]) {
//       groupedByTime[timeKey] = [];
//     }
//     groupedByTime[timeKey].push(row);
//   });

//   const sortedTimeKeys = Object.keys(groupedByTime).sort(); // chronological order

//   let index = 0;

//   clearInterval(intervalId);

//  intervalId = setInterval(() => {
//     if (index >= sortedTimeKeys.length) {
//       clearInterval(intervalId);
//       return;
//     }

//     const timeKey = sortedTimeKeys[index];
//     const rows = groupedByTime[timeKey];

//     socket.emit("tick", {
//       type,
//       time: timeKey,
//       data: rows, // an array of rows for that time
//     });

//     index++;
//   }, 1000);
// }

// function stopStreaming() {
//   clearInterval(intervalId);
// }

// module.exports = { startStreaming, stopStreaming };

// 2nd interval code -------------------------------------------------------------

// const timeToSeconds = (t) => {
//   const [h, m, s] = t.split(":").map(Number);
//   return h * 3600 + m * 60 + s;
// };

// function groupOptionData(dataset, strikes, startTimeStr) {
//   const startSecs = timeToSeconds(startTimeStr);
//   const strikeNums = strikes.map(Number);
//   const map = {};

//   dataset.forEach((row) => {
//     const timeStr = row.Time.padStart(8, "0");
//     const secs = timeToSeconds(timeStr);
//     if (secs < startSecs) return;

//     if (strikeNums.includes(Number(row.Strike_Price))) {
//       if (!map[timeStr]) map[timeStr] = [];
//       map[timeStr].push(row);
//     }
//   });

//   return map;
// }

// function groupSpotData(dataset, startTimeStr) {
//   const startSecs = timeToSeconds(startTimeStr);
//   const map = {};
//   dataset.forEach((row) => {
//     const timeStr = row.Time.padStart(8, "0");
//     const secs = timeToSeconds(timeStr);
//     if (secs >= startSecs) {
//       map[timeStr] = row;
//     }
//   });
//   return map;
// }

// const intervalMap = new Map(); // socket.id -> interval

// function startStreaming(
//   socket,
//   state,
//   spotDataset,
//   callDataset,
//   putDataset,
//   clientState,
//   clientId
// ) {
//   const { call, put, startTime } = state;

//   const spotGrouped = groupSpotData(spotDataset, startTime);

//   const allTimeKeys = new Set([
//     ...Object.keys(call.grouped),
//     ...Object.keys(put.grouped),
//     ...Object.keys(spotGrouped),
//   ]);

//   const sortedTimes = [...allTimeKeys].sort();

//   let index = state.index || 0;

//   const interval = setInterval(() => {
//     const currentState = clientState.get(clientId);

//     if (!currentState || currentState.paused) return; // 🛑 Pause check

//     if (index >= sortedTimes.length) {
//       clearInterval(interval);
//       console.log("in index");
//       return;
//     }

//     const time = sortedTimes[index];

//     const callData = call.grouped[time] || [];
//     const putData = put.grouped[time] || [];
//     const spotData = spotGrouped[time] || null;

//     // ✅ Calculate factor using full dataset (not user-subscribed filtered data)
//     let factor = null;
//     if (spotData?.Close) {
//       const spot = parseFloat(spotData.Close);
//       const floor = Math.floor(spot / 100) * 100;
//       const ceil = Math.ceil(spot / 100) * 100;
//       // console.log(callDataset, putDataset);

//       const filterByTimeAndStrike = (dataset, timeStr, strike) =>
//         dataset.filter(
//           (row) =>
//             row.Time.padStart(8, "0") === timeStr &&
//             Number(row.Strike_Price) === strike
//         );

//       const calcMidSum = (strike) => {
//         const callRows = filterByTimeAndStrike(callDataset, time, strike);
//         const putRows = filterByTimeAndStrike(putDataset, time, strike);
//         // console.log("yoc", callRows, putRows);

//         const callMid =
//           callRows.length > 0
//             ? (parseFloat(callRows[0].Bid) + parseFloat(callRows[0].Ask)) / 2
//             : 0;

//         const putMid =
//           putRows.length > 0
//             ? (parseFloat(putRows[0].Bid) + parseFloat(putRows[0].Ask)) / 2
//             : 0;

//         return callMid + putMid;
//       };

//       const floorSum = calcMidSum(floor);
//       const ceilSum = calcMidSum(ceil);

//       factor = floorSum < ceilSum ? floorSum : ceilSum;
//     }

//     socket.emit("tick", {
//       time,
//       call: callData,
//       put: putData,
//       spot: spotData,
//       factor, // ✅ include in tick
//     });

//     currentState.index = index + 1; // Save progress
//     clientState.set(clientId, currentState);

//     index++;
//   }, 1000);

//   intervalMap.set(clientId, interval);
// }

// function stopStreaming(clientId) {
//   clearInterval(intervalMap.get(clientId));
//   intervalMap.delete(clientId);
// }

// module.exports = {
//   startStreaming,
//   stopStreaming,
//   groupOptionData,
// };

// 3rd interval code with map ---------------------------

const timeToSeconds = (t) => {
  const [h, m, s] = t.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

function groupOptionData(dataset, strikes, startTimeStr) {
  const startSecs = timeToSeconds(startTimeStr);
  const strikeNums = strikes.map(Number);
  const map = {};

  dataset.forEach((row) => {
    const timeStr = row.Time.padStart(8, "0");
    const secs = timeToSeconds(timeStr);
    if (secs < startSecs) return;

    if (strikeNums.includes(Number(row.Strike_Price))) {
      if (!map[timeStr]) map[timeStr] = [];
      map[timeStr].push(row);
    }
  });

  return map;
}

function groupSpotData(dataset, startTimeStr) {
  const startSecs = timeToSeconds(startTimeStr);
  const map = {};
  dataset.forEach((row) => {
    const timeStr = row.Time.padStart(8, "0");
    const secs = timeToSeconds(timeStr);
    if (secs >= startSecs) {
      map[timeStr] = row;
    }
  });
  return map;
}

const intervalMap = new Map(); // socket.id -> interval

function preGroupByTimeAndStrike(dataset) {
  const map = {};
  dataset.forEach((row) => {
    const time = row.Time.padStart(8, "0");
    const strike = row.Strike_Price;
    if (!map[time]) map[time] = {};
    map[time][strike] = row;
  });
  return map;
}

function startStreaming(
  socket,
  state,
  spotDataset,
  callDataset,
  putDataset,
  clientState,
  clientId
) {
  const { call, put, startTime } = state;

  const spotGrouped = groupSpotData(spotDataset, startTime);

  const allTimeKeys = new Set([
    ...Object.keys(call.grouped),
    ...Object.keys(put.grouped),
    ...Object.keys(spotGrouped),
  ]);

  const sortedTimes = [...allTimeKeys].sort();

  let index = state.index || 0;

  // ✅ Pre-group call and put datasets by time + strike for fast lookup
  const preGroupedCall = preGroupByTimeAndStrike(callDataset);
  const preGroupedPut = preGroupByTimeAndStrike(putDataset);
  const exchange = clientState.get(clientId)?.exchange;
  if (!exchange) return;

  const interval = setInterval(() => {
    const currentState = clientState.get(clientId);

    if (!currentState || currentState.paused) return; // 🛑 Pause check

    if (index >= sortedTimes.length) {
      clearInterval(interval);
      console.log("✔ Finished streaming for", clientId);
      return;
    }

    const time = sortedTimes[index];
    // console.time(`tick-${time}`);

    const callData = call.grouped[time] || [];
    const putData = put.grouped[time] || [];
    const spotData = spotGrouped[time] || null;

    // ✅ Calculate factor using full dataset (not user-subscribed filtered data)
    let factor = null;
    if (spotData?.Close) {
      const spot = parseFloat(spotData.Close);
      const step = exchange === "NIFTY" ? 50 : 100; // 👈 Step size based on exchange
      const floor = Math.floor(spot / step) * step;
      const ceil = Math.ceil(spot / step) * step;

      const getMidSum = (time, strike) => {
        const strikeKey = strike.toFixed(1);
        const callRow = preGroupedCall[time]?.[strikeKey];
        const putRow = preGroupedPut[time]?.[strikeKey];

        const callMid =
          callRow?.Bid && callRow?.Ask
            ? (parseFloat(callRow.Bid) + parseFloat(callRow.Ask)) / 2
            : 0;

        const putMid =
          putRow?.Bid && putRow?.Ask
            ? (parseFloat(putRow.Bid) + parseFloat(putRow.Ask)) / 2
            : 0;

        return callMid + putMid;
      };

      const floorSum = getMidSum(time, floor);
      const ceilSum = getMidSum(time, ceil);
      factor = floorSum < ceilSum ? floorSum : ceilSum;
    }

    socket.emit("tick", {
      time,
      call: callData,
      put: putData,
      spot: spotData,
      factor, // ✅ include in tick
    });

    // console.timeEnd(`tick-${time}`);

    currentState.index = index + 1; // Save progress
    clientState.set(clientId, currentState);

    index++;
  }, state.interval || 1000);

  intervalMap.set(clientId, interval);
}

function stopStreaming(clientId) {
  clearInterval(intervalMap.get(clientId));
  intervalMap.delete(clientId);
}

module.exports = {
  startStreaming,
  stopStreaming,
  groupOptionData,
};
