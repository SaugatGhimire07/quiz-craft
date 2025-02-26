import React from "react";
import "../styles/footer.css";

import logo from "../assets/logo/logo.png";

// Import social media icons (you can replace these with actual images or Font Awesome)
import { FaLinkedin, FaYoutube, FaInstagram, FaFacebook, FaTwitter } from "react-icons/fa";

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                {/* Left Section: Logo & Social Media */}
                <div className="footer-left">
                    <img src={logo} alt="Quiz Craft Logo" className="footer-logo" />
                    <p style={{marginTop:'100px' , marginBottom:'10px'}}>Follow us</p>
                    <div className="social-icons">
                        <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
                            <FaLinkedin />
                        </a>
                        <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
                            <FaYoutube />
                        </a>
                        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
                            <FaInstagram />
                        </a>
                        <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                            <FaFacebook />
                        </a>
                        <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
                            <FaTwitter />
                        </a>
                    </div>
                </div>

                {/* Middle Section: Quick Links */}
                <div className="footer-links">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/features">Features</a></li>
                        <li><a href="/how-it-works">How It Works</a></li>
                        <li><a href="/join-quiz">Join Quiz</a></li>
                        <li><a href="/create-quiz">Create Quiz</a></li>
                        <li><a href="/login">Login / Sign Up</a></li>
                    </ul>
                </div>

                {/* Right Section: About & Resources */}
                <div className="footer-links">
                    <h3>About & Resources</h3>
                    <ul>
                        <li><a href="/about">About Quizcraft</a></li>
                        <li><a href="/contact">Contact Us</a></li>
                        <li><a href="/help-center">Help Center</a></li>
                        <li><a href="/blog">Blog</a></li>
                    </ul>
                </div>

                {/* Legal Section */}
                <div className="footer-links">
                    <h3>Legal</h3>
                    <ul>
                        <li><a href="/privacy-policy">Privacy Policy</a></li>
                        <li><a href="/terms-of-service">Terms of Service</a></li>
                        <li><a href="/cookie-policy">Cookie Policy</a></li>
                    </ul>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
