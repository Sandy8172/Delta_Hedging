import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  theme: localStorage.getItem("color-theme") || "light", // Get theme from localStorage on initial load
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      state.theme = newTheme;
      localStorage.setItem("color-theme", newTheme); // Save theme to localStorage
      document.documentElement.classList.toggle("dark", newTheme === "dark"); // Apply theme to HTML element
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export const selectedColorTheme = (state) => state.theme.theme;
export default themeSlice.reducer;
