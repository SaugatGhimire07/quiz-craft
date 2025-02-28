import React from "react";
import logoImage from "../assets/logo/logo-only.png";

const DashboardNavbar = () => {
    return(
        <div>

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


    </div>
    )
}


export default DashboardNavbar;