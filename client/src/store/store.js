import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "../utils/themeSlice";

const store = configureStore({
  reducer: {
    theme: themeReducer,
  },
});

export default store;
