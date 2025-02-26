import React from 'react';
import "../styles/cookiePolicy.css";

const CookiePolicy = () => {
  return (
    <div className="cookie-policy">
      <h1>Cookie Policy</h1>
      <p>Effective Date: February 26, 2025</p>

      <section>
        <h2>1. Introduction</h2>
        <p>
          Quiz Craft Platform uses cookies and similar tracking technologies to enhance user experience and analyze platform usage. This Cookie Policy explains what cookies are, how we use them, and how you can manage your cookie preferences.
        </p>
      </section>

      <section>
        <h2>2. What Are Cookies?</h2>
        <p>
          Cookies are small text files stored on your device when you visit a website. They help improve functionality, remember preferences, and provide analytical insights.
        </p>
      </section>

      <section>
        <h2>3. Types of Cookies We Use</h2>
        <ul>
          <li><strong>Essential Cookies:</strong> Necessary for the basic functionality of the platform, such as user authentication and security.</li>
          <li><strong>Performance Cookies:</strong> Help us analyze site traffic and understand user interactions to improve the platform.</li>
          <li><strong>Functional Cookies:</strong> Allow us to remember user preferences, such as language and quiz settings.</li>
          <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements based on your browsing behavior.</li>
        </ul>
      </section>

      <section>
        <h2>4. How We Use Cookies</h2>
        <p>We use cookies to:</p>
        <ul>
          <li>Authenticate users and maintain secure sessions.</li>
          <li>Enhance functionality and personalize user experience.</li>
          <li>Track user engagement and analyze site performance.</li>
          <li>Display relevant advertisements and limit ad frequency.</li>
        </ul>
      </section>

      <section>
        <h2>5. Managing Cookies</h2>
        <p>
          You can manage or disable cookies through your browser settings. However, disabling certain cookies may impact platform functionality.
        </p>
      </section>

      <section>
        <h2>6. Third-Party Cookies</h2>
        <p>
          Some third-party services, such as analytics and advertising providers, may place cookies on your device. We do not control these cookies and recommend reviewing their privacy policies.
        </p>
      </section>

      <section>
        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this Cookie Policy periodically. Any changes will be posted on this page with an updated effective date.
        </p>
      </section>

      <section>
        <h2>8. Contact Us</h2>
        <p>If you have questions about this Cookie Policy, please contact us at:</p>
        <p>
          <a href="mailto:info@quizcraft.com">info@quizcraft.com</a>
        </p>
      </section>

      <p>By using Quiz Craft Platform, you consent to our use of cookies as described in this policy.</p>
    </div>
  );
};

export default CookiePolicy;