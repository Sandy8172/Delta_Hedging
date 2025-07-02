import { useState, useRef } from "react";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Chip from "@mui/material/Chip";
import { getSocket } from "../utils/socket";
import toast from "react-hot-toast";
import { toastPromise } from "../utils/toast.promise";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const StrikesForm = ({ type, availableStrikes }) => {
  const [selectedStrikes, setSelectedStrikes] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedStrikes.length === 0)
      return toast.error("🤦‍♂️ select atleast 1 strike");

    const socket = getSocket(); // Always use the same instance

    if (!socket) return toast.error("⚠️ No socket connection!");

    const updatePromise = new Promise((resolve, reject) => {
      socket.emit("update", {
        type,
        strikes: selectedStrikes,
      });

      socket.once("updated", ({ type: updatedType }) => {
        if (updatedType === type) {
          resolve();
          setSelectedStrikes([]);
        } else {
          reject("Update type mismatch");
        }
      });

      // fallback timeout in case no response comes
      setTimeout(() => reject("No response from server"), 10000);
    });

    const message = {
      loading: `Adding ${type} strikes...`,
      success: `${type.toUpperCase()} strikes added successfully!`,
      error: `Failed to add ${type} strikes.`,
    };

    toastPromise(updatePromise, message);
  };

  return (
    <form
      className="flex items-center justify-start gap-2"
      onSubmit={handleSubmit}
    >
      <Autocomplete
        multiple
        id="checkboxes-tags-demo"
        options={availableStrikes}
        value={selectedStrikes}
        onChange={(e, newValue) => setSelectedStrikes(newValue)}
        disableCloseOnSelect
        getOptionLabel={(strike) => strike}
        renderOption={(props, strike, { selected }) => {
          const { key, ...optionProps } = props;
          return (
            <li key={key} {...optionProps}>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {strike}
            </li>
          );
        }}
        style={{ width: 300 }}
        size="small"
        renderTags={(value, getTagProps) => {
          return value.map((strike, index) => {
            const tagProps = getTagProps({ index });

            // Remove 'key' from tagProps and pass it manually
            const { key, ...restTagProps } = tagProps;

            return (
              <Chip
                key={strike} // Manually passing the key
                label={strike}
                {...restTagProps} // Spread the rest of the tag props
                style={{
                  backgroundColor: "#a2b0db", // Background color for selected strike in the box
                  color: "black", // Text color for selected strike
                  borderColor: "red", // Border color for selected strike
                }}
              />
            );
          });
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            inputProps={{
              ...params.inputProps,
              tabIndex: -1, // ❌ disables tab focus
            }}
            label={`Strikes (${type})`}
            placeholder="strikes"
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "gray", // Border color for the input box
                },
                "&:hover fieldset": {
                  borderColor: "gray", // Border color on hover
                },
                "&.Mui-focused fieldset": {
                  borderColor: "gray", // Border color when focused
                },
              },
              "& .MuiInputBase-input": {
                color: "gray", // ✅ input text color (alternative)
              },
              "& .MuiInputLabel-root": {
                color: "gray", // Label color
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "gray", // Focused label color
              },
              "& .MuiInputBase-input::placeholder": {
                color: "gray", // Placeholder text color
                opacity: 1,
              },
            }}
          />
        )}
      />
      <button
        type="submit"
        tabIndex={-1}
        className="text-blue-700 cursor-pointer rounded-full hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium text-sm px-5 py-2.5 text-centerdark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800"
      >
        Add
      </button>
    </form>
  );
};

export default StrikesForm;
