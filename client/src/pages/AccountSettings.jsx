import { useState } from "react";
import "../styles/account-settings.css";
import "../styles/fonts.css";
import logoImage from "../assets/logo/logo-only.png";

const AccountSettings = () => {
  const [name, setName] = useState("Saugat Ghimire");
  const [email] = useState("ghimiresaugat1987@gmail.com");
  const [expandedSections, setExpandedSections] = useState({
    nameImage: false,
    email: false,
    password: false,
    notifications: false,
  });

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  return (
    <div className="account-settings-container">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <img src={logoImage} alt="Quiz Craft Logo" width="40" height="30" />
        </div>
        <div className="header-right">
          <div className="avatar-circle">SG</div>
        </div>
      </header>
      <div
        style={{
          height: "1px",
          backgroundColor: "#e5e5e5",
          width: "100%",
          marginBottom: "20px",
        }}
      ></div>

      <div className="content-container">
        {/* Main content with sidebar */}
        <div className="main-content">
          {/* Sidebar */}
          <div className="sidebar">
            {/* Back button */}
            <div className="back-button">
              <button>
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
            <div className="sidebar-section">
              <h3 className="sidebar-heading">My profile</h3>
              <ul className="sidebar-menu">
                <li className="sidebar-menu-item active">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  Account settings
                </li>
                <li className="sidebar-menu-item">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Organization
                </li>
              </ul>
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
                  className={`section-toggle ${
                    expandedSections.nameImage ? "expanded" : ""
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
                <span>Logged in as Saugat Ghimire</span>
                <div className="avatar-circle-small">SG</div>
              </div>
              <div
                className={`section-content ${
                  expandedSections.nameImage ? "expanded" : ""
                }`}
              >
                <div className="name-input-container">
                  <label htmlFor="name">Name</label>
                  <div className="name-input-wrapper">
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength="46"
                    />
                    <button className="save-button">Save name</button>
                  </div>
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
                  className={`section-toggle ${
                    expandedSections.email ? "expanded" : ""
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
                className={`section-content ${
                  expandedSections.email ? "expanded" : ""
                }`}
              >
                <p className="section-instruction">
                  After you change your email address, verification will be
                  required.
                </p>

                <div className="email-form">
                  <div className="email-field-group">
                    <label htmlFor="new-email">New email</label>
                    <input
                      type="email"
                      id="new-email"
                      placeholder="ghimiresaugat987@gmail.com"
                      className="email-input"
                    />
                  </div>

                  <div className="email-field-group">
                    <label htmlFor="confirm-email">Confirm new email</label>
                    <input
                      type="email"
                      id="confirm-email"
                      className="email-input"
                    />
                  </div>

                  <div className="email-field-group">
                    <label htmlFor="password">Confirm with password</label>
                    <input
                      type="password"
                      id="password"
                      className="email-input"
                    />
                    <div className="forgot-password">
                      Forgot your password?{" "}
                      <a href="#">You can reset it here.</a>
                    </div>
                  </div>

                  <button className="change-email-button">Change email</button>
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
                  className={`section-toggle ${
                    expandedSections.password ? "expanded" : ""
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
              <div
                className={`section-content ${
                  expandedSections.password ? "expanded" : ""
                }`}
              >
                <div className="password-form">
                  <div className="email-field-group">
                    <label htmlFor="current-password">Current Password</label>
                    <input
                      type="password"
                      id="current-password"
                      className="email-input"
                    />
                    <div className="forgot-password">
                      Forgot your password?{" "}
                      <a href="#">You can reset it here.</a>
                    </div>
                  </div>

                  <div className="email-field-group">
                    <label htmlFor="new-password">New Password</label>
                    <input
                      type="password"
                      id="new-password"
                      className="email-input"
                    />
                  </div>

                  <div className="email-field-group">
                    <label htmlFor="confirm-password">Confirm Password</label>
                    <input
                      type="password"
                      id="confirm-password"
                      className="email-input"
                    />
                  </div>

                  <button className="change-email-button">
                    Change password
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
              <h2 className="section-title security-title">
                Log out everywhere else
              </h2>
              <div className="security-section">
                <div className="security-content">
                  <p className="security-description">
                    This will log you out from all other devices you have used
                    Quiz Craft on, for example other browsers.
                  </p>
                  <button className="logout-everywhere-button">Log out</button>
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
