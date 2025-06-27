import HomePage from "./pages/HomePage.jsx";
import PWABadge from "./PWABadge.jsx";
import Background from "./components/Background.jsx";
import { Toaster } from "react-hot-toast";
// import React, { useEffect, useRef, useState } from "react";
// import { io } from "socket.io-client";

// const socket = io("http://localhost:3000"); // change if needed

function App() {
  // const [type, setType] = useState("call");
  // const [strikes, setStrikes] = useState(["76400"]);
  // const [startTime, setStartTime] = useState("09:15:00");

  // const [addInput, setAddInput] = useState("");
  // const [removeInput, setRemoveInput] = useState("");

  // const logRef = useRef(null);

  // useEffect(() => {
  //   socket.on("connect", () => {
  //     console.log("Socket connected:", socket.id);
  //   });

  //   socket.on("tick", (payload) => {
  //     console.log("Tick data:", payload);
  //     if (logRef.current) {
  //       logRef.current.textContent = JSON.stringify(payload, null, 2);
  //     }
  //   });

  //   socket.on("removed", ({ type, strikes }) => {
  //     console.log(`[${type}] Updated strike list after removal:`, strikes);
  //   });

  //   socket.on("updated", ({ type, strikes }) => {
  //     console.log(`[${type}] Updated strike list after addition:`, strikes);
  //   });

  //   return () => {
  //     socket.off("tick");
  //     socket.off("removed");
  //     socket.off("updated");
  //   };
  // }, []);

  // const handleSubscribe = () => {
  //   socket.emit("subscribe", {
  //     type,
  //     strikes,
  //     startTime,
  //   });
  // };

  // const handleAddStrikes = () => {
  //   const newStrikes = addInput
  //     .split(",")
  //     .map((s) => s.trim())
  //     .filter(Boolean);
  //   if (newStrikes.length > 0) {
  //     socket.emit("update", { type, strikes: newStrikes });
  //   }
  //   setAddInput("");
  // };

  // const handleRemoveStrikes = () => {
  //   const removeStrikes = removeInput
  //     .split(",")
  //     .map((s) => s.trim())
  //     .filter(Boolean);
  //   if (removeStrikes.length > 0) {
  //     socket.emit("remove", { type, remove: removeStrikes });
  //   }
  //   setRemoveInput("");
  // };

  return (
    <>
      <Background>
        <Toaster position="top-right" />
        <HomePage />
        <PWABadge />
      </Background>
    </>
  );
}

export default App;
