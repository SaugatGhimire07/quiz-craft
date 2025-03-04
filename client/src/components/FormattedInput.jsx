import React, { useRef } from "react";

const FormattedInput = ({
  label,
  value,
  setValue,
  placeholder = "",
  className = "",
  required = false,
}) => {
  const inputRef = useRef(null);

  const handleChange = (event) => {
    const inputElement = event.target;
    const cursorPosition = inputElement.selectionStart; // Capture cursor position before update

    let rawValue = inputElement.value.replace(/[^a-z0-9]/g, ""); // Allow only lowercase letters and numbers
    rawValue = rawValue.slice(0, 6); // Limit to 6 characters
    setValue(rawValue);

    // Restore the cursor position after React re-renders
    requestAnimationFrame(() => {
      inputElement.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const formatValue = (input) => {
    let formattedValue = input;
    let emptySlots = 6 - input.length;
    if (emptySlots > 0) {
      formattedValue += "-".repeat(emptySlots);
    }
    return formattedValue;
  };

  return (
    <div className={`formatted-input ${className}`}>
      {label && <label className="block text-sm font-medium">{label}</label>}
      <input
        ref={inputRef}
        type="text"
        value={formatValue(value)}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: "180px", textAlign: "center", letterSpacing: "0.5em" }} // Add padding between characters
      />
    </div>
  );
};

export default FormattedInput;
