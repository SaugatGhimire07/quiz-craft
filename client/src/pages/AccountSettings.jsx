import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import "../styles/account-settings.css";
import "../styles/fonts.css";

//components
import DashboardNavbar from "../components/DashNav";


import { useNavigate } from "react-router-dom";

const AccountSettings = () => {
  const { user, login, logout } = useAuth();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState(""); // Name that's displayed in UI
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [initials, setInitials] = useState("");
  const [nameUpdateStatus, setNameUpdateStatus] = useState({
    message: "",
    type: "",
  });
  const [emailUpdateStatus, setEmailUpdateStatus] = useState({
    message: "",
    type: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [showSuccessButton, setShowSuccessButton] = useState(false);
  const [showEmailSuccessButton, setShowEmailSuccessButton] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    nameImage: false,
    email: false,
    password: false,
    notifications: false,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdateStatus, setPasswordUpdateStatus] = useState({
    message: "",
    type: "",
  });
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [showPasswordSuccessButton, setShowPasswordSuccessButton] =
    useState(false);
  const navigate = useNavigate();

  // Set user data when component mounts
  useEffect(() => {
    if (user) {
      const userName = user.name || "";
      setName(userName);
      setDisplayName(userName);
      setEmail(user.email || "");

      // Generate initials from name
      const userInitials = userName
        ? userName
          .split(" ")
          .map((name) => name[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)
        : "";
      setInitials(userInitials);
    }
  }, [user]);

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  // Handle name update
  const handleNameUpdate = async () => {
    // Don't update if name didn't change or is empty
    if (name === displayName || !name.trim()) {
      setNameUpdateStatus({
        message:
          name === displayName ? "No changes to save" : "Name cannot be empty",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setNameUpdateStatus({ message: "", type: "" });

    try {
      const response = await api.put("/auth/user", { name });

      // Update the display name and user context
      setDisplayName(name);

      // Update user in auth context
      if (user) {
        const updatedUser = { ...user, name };
        login(updatedUser); // This will also update localStorage
      }

      // Generate new initials
      const userInitials = name
        ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)
        : "";
      setInitials(userInitials);

      // Show success button state
      setShowSuccessButton(true);

      // Reset button state after 2 seconds
      setTimeout(() => {
        setShowSuccessButton(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to update name:", error);
      setNameUpdateStatus({
        message: error.response?.data?.message || "Failed to update name",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle email update
  const handleEmailUpdate = async () => {
    // Reset previous status
    setEmailUpdateStatus({ message: "", type: "" });

    // Validate inputs
    if (!newEmail.trim()) {
      setEmailUpdateStatus({
        message: "New email cannot be empty",
        type: "error",
      });
      return;
    }

    if (newEmail === email) {
      setEmailUpdateStatus({
        message: "New email is the same as current email",
        type: "error",
      });
      return;
    }

    if (newEmail !== confirmEmail) {
      setEmailUpdateStatus({
        message: "Email addresses don't match",
        type: "error",
      });
      return;
    }

    if (!emailPassword) {
      setEmailUpdateStatus({
        message: "Please enter your password",
        type: "error",
      });
      return;
    }

    // Email format validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailUpdateStatus({
        message: "Please enter a valid email address",
        type: "error",
      });
      return;
    }

    setIsEmailSubmitting(true);

    try {
      // Simple direct update - no verification process
      const response = await api.put("/auth/user", {
        email: newEmail,
        password: emailPassword,
      });

      // Update email in state and user context
      setEmail(newEmail);

      // Update user in auth context
      if (user) {
        const updatedUser = { ...user, email: newEmail };
        login(updatedUser); // This will also update localStorage
      }

      // Show success button state
      setShowEmailSuccessButton(true);

      // Clear form fields
      setNewEmail("");
      setConfirmEmail("");
      setEmailPassword("");

      // Reset button state after 2 seconds
      setTimeout(() => {
        setShowEmailSuccessButton(false);

        // Set success message
        setEmailUpdateStatus({
          message: "Email updated successfully",
          type: "success",
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to update email:", error);
      setEmailUpdateStatus({
        message:
          error.response?.data?.message ||
          (error.response?.status === 401
            ? "Incorrect password"
            : "Failed to update email"),
        type: "error",
      });
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    // Reset previous status
    setPasswordUpdateStatus({ message: "", type: "" });

    // Validate inputs
    if (!currentPassword) {
      setPasswordUpdateStatus({
        message: "Current password cannot be empty",
        type: "error",
      });
      return;
    }

    if (!newPassword) {
      setPasswordUpdateStatus({
        message: "New password cannot be empty",
        type: "error",
      });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordUpdateStatus({
        message: "New password must be at least 8 characters long",
        type: "error",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordUpdateStatus({
        message: "Passwords don't match",
        type: "error",
      });
      return;
    }

    setIsPasswordSubmitting(true);

    try {
      const response = await api.put("/auth/user", {
        currentPassword,
        newPassword,
      });

      // Show success button state
      setShowPasswordSuccessButton(true);

      // Clear form fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Reset button state after 2 seconds
      setTimeout(() => {
        setShowPasswordSuccessButton(false);

        // Set success message
        setPasswordUpdateStatus({
          message: "Password updated successfully",
          type: "success",
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to update password:", error);
      setPasswordUpdateStatus({
        message:
          error.response?.data?.message ||
          (error.response?.status === 401
            ? "Incorrect password"
            : "Failed to update password"),
        type: "error",
      });
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Call API to invalidate session tokens on server
      await api.post("/auth/logout-everywhere");

      // Call the logout function from AuthContext
      logout();

      // Navigate to login page
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);

      // Even if the API call fails, still logout on the client side
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="account-settings-container">
      <DashboardNavbar initials={initials} />

      <div className="content-container">
        {/* Main content with sidebar */}
        <div className="main-content">
          <div className="sidebar">
            <div className="back-button">
              <button onClick={() => navigate("/dashboard")}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back to home</span>
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="settings-content">
            <h1 className="settings-title">Account settings</h1>

            {/* Name & Image Section */}
            <div className="settings-section">
              <div
                className="section-header"
                onClick={() => toggleSection("nameImage")}
              >
                <h2 className="section-title">Name & image</h2>
                <button
                  className={`section-toggle ${expandedSections.nameImage ? "expanded" : ""
                    }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>
              <div className="user-info-always-visible">
                <span>Logged in as {displayName}</span>
                <div className="avatar-circle-small">{initials}</div>
              </div>
              <div
                className={`section-content ${expandedSections.nameImage ? "expanded" : ""
                  }`}
              >
                {/* Name input with validation */}
                <div className="name-input-container">
                  <label htmlFor="name">Name</label>
                  <div className="name-input-wrapper">
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength="46"
                      className={
                        nameUpdateStatus.type === "error" ? "error" : ""
                      }
                    />
                    <button
                      className={`save-button ${showSuccessButton ? "success" : ""
                        }`}
                      onClick={handleNameUpdate}
                      disabled={isSubmitting || showSuccessButton}
                    >
                      {showSuccessButton ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Saved
                        </>
                      ) : isSubmitting ? (
                        "Saving..."
                      ) : (
                        "Save name"
                      )}
                    </button>
                  </div>
                  {nameUpdateStatus.message && (
                    <p className={`status-message ${nameUpdateStatus.type}`}>
                      {nameUpdateStatus.message}
                    </p>
                  )}
                </div>

                <div className="profile-image-container">
                  <label>Profile image</label>
                  <div className="profile-image-uploader">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#cccccc"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 11v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      <path d="M3 11.09V9.857a4 4 0 0 1 1.8-3.346L15 2" />
                      <circle cx="13" cy="11" r="2" />
                    </svg>
                    <p>Drag and drop or</p>
                    <a href="#" className="click-to-add">
                      Click to add image
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Section */}
            <div className="settings-section">
              <div
                className="section-header"
                onClick={() => toggleSection("email")}
              >
                <div className="section-title-container">
                  <h2 className="section-title">Email</h2>
                  <span className="verified-badge">Verified</span>
                </div>
                <button
                  className={`section-toggle ${expandedSections.email ? "expanded" : ""
                    }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>
              <div className="user-info-always-visible">
                <span>Your email is {email}</span>
              </div>
              <div
                className={`section-content ${expandedSections.email ? "expanded" : ""
                  }`}
              >
                <p className="section-instruction">
                  Change your email address below.
                </p>

                <div className="email-form">
                  <div className="email-field-group">
                    <label htmlFor="new-email">New email</label>
                    <input
                      type="email"
                      id="new-email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter your new email address"
                      className={`email-input ${emailUpdateStatus.type === "error" && !newEmail
                          ? "error"
                          : ""
                        }`}
                    />
                  </div>

                  <div className="email-field-group">
                    <label htmlFor="confirm-email">Confirm new email</label>
                    <input
                      type="email"
                      id="confirm-email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      className={`email-input ${emailUpdateStatus.type === "error" &&
                          confirmEmail !== newEmail
                          ? "error"
                          : ""
                        }`}
                    />
                  </div>

                  <div className="email-field-group">
                    <label htmlFor="password">Confirm with password</label>
                    <input
                      type="password"
                      id="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      className={`email-input ${emailUpdateStatus.type === "error" && !emailPassword
                          ? "error"
                          : ""
                        }`}
                    />
                    <div className="forgot-password">
                      Forgot your password?{" "}
                      <a href="/reset-password">You can reset it here.</a>
                    </div>
                  </div>

                  {emailUpdateStatus.message && (
                    <p className={`status-message ${emailUpdateStatus.type}`}>
                      {emailUpdateStatus.message}
                    </p>
                  )}

                  <button
                    className={`change-email-button ${showEmailSuccessButton ? "success" : ""
                      }`}
                    onClick={handleEmailUpdate}
                    disabled={isEmailSubmitting || showEmailSuccessButton}
                  >
                    {showEmailSuccessButton ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Email changed
                      </>
                    ) : isEmailSubmitting ? (
                      "Updating..."
                    ) : (
                      "Change email"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="settings-section">
              <div
                className="section-header"
                onClick={() => toggleSection("password")}
              >
                <h2 className="section-title">Password</h2>
                <button
                  className={`section-toggle ${expandedSections.password ? "expanded" : ""
                    }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>
              <p className="section-instruction">Change your password below</p>
              <div
                className={`section-content ${expandedSections.password ? "expanded" : ""
                  }`}
              >
                <div className="password-form">
                  <div className="email-field-group">
                    <label htmlFor="current-password">Current Password</label>
                    <input
                      type="password"
                      id="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`email-input ${passwordUpdateStatus.type === "error" &&
                          !currentPassword
                          ? "error"
                          : ""
                        }`}
                    />
                    <div className="forgot-password">
                      Forgot your password?{" "}
                      <a href="/reset-password">You can reset it here.</a>
                    </div>
                  </div>

                  <div className="email-field-group">
                    <label htmlFor="new-password">New Password</label>
                    <input
                      type="password"
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`email-input ${passwordUpdateStatus.type === "error" &&
                          (newPassword.length === 0 || newPassword.length < 8)
                          ? "error"
                          : ""
                        }`}
                    />
                    <p className="password-hint">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div className="email-field-group">
                    <label htmlFor="confirm-password">Confirm Password</label>
                    <input
                      type="password"
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`email-input ${passwordUpdateStatus.type === "error" &&
                          confirmPassword !== newPassword
                          ? "error"
                          : ""
                        }`}
                    />
                  </div>

                  {passwordUpdateStatus.message && (
                    <p
                      className={`status-message ${passwordUpdateStatus.type}`}
                    >
                      {passwordUpdateStatus.message}
                    </p>
                  )}

                  <button
                    className={`change-email-button ${showPasswordSuccessButton ? "success" : ""
                      }`}
                    onClick={handlePasswordUpdate}
                    disabled={isPasswordSubmitting || showPasswordSuccessButton}
                  >
                    {showPasswordSuccessButton ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Password changed
                      </>
                    ) : isPasswordSubmitting ? (
                      "Updating..."
                    ) : (
                      "Change password"
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                height: "1px",
                backgroundColor: "#e5e5e5",
                width: "100%",
                margin: "40px 0px",
              }}
            ></div>

            <div className="settings-section">
              <h2 className="section-title security-title">Log out</h2>
              <div className="security-section">
                <div className="security-content">
                  <p className="security-description">
                    This will log you out from Quizcraft, including any active
                    sessions in other browsers.
                  </p>
                  <button className="logout-button" onClick={handleLogout}>
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
