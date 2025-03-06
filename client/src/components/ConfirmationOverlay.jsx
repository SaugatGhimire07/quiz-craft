import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
import "../styles/confirmation-overlay.css";

const ConfirmationOverlay = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Yes, delete",
  cancelText = "No, cancel",
  type = "danger",
}) => {
  const overlayRef = useRef(null);

  // Close on escape key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="confirmation-overlay-backdrop">
      <div className="confirmation-overlay-container" ref={overlayRef}>
        <div className={`confirmation-overlay-content ${type}`}>
          <h3>{title}</h3>
          <p>{message}</p>
          <div className="confirmation-overlay-actions">
            <button className="cancel-button" onClick={onClose}>
              {cancelText}
            </button>
            <button
              className={`confirm-button ${type}`}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ConfirmationOverlay.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.node.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  type: PropTypes.oneOf(["danger", "warning", "info"]),
};

export default ConfirmationOverlay;
