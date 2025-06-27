// import { io } from "socket.io-client";
// let socket;

// // utils/socket.js
// export const createSocketConnection = () => {
//   const clientId = localStorage.getItem("clientId") || crypto.randomUUID();

//   localStorage.setItem("clientId", clientId);

//   socket = io("http://localhost:3000", {
//     transports: ["websocket"],
//     query: { clientId },
//   });

//   return socket;
// };

// export const clearClientId = () => {
//   localStorage.removeItem("clientId");
// };

import { io } from "socket.io-client";

let socket = null;

export const createSocketConnection = () => {
  if (!socket || socket.disconnected) {
    const clientId = localStorage.getItem("clientId") || crypto.randomUUID();
    localStorage.setItem("clientId", clientId);

    socket = io("http://localhost:3000", {
      transports: ["websocket"],
      query: { clientId },
    });
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const clearClientId = () => {
  localStorage.removeItem("clientId");
};
