import React from 'react';
import "../styles/navbar.css";

//logo 
import logo from "../assets/Logo/logo-1.png";

const NavBar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <a href="/">
        <img src={logo} alt="logo" className='img' />
        </a>
      </div>
      <ul className="navbar-links">
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
        <li><a href="/login">Login</a></li>
      </ul>
    </nav>
  );
};

export default NavBar;