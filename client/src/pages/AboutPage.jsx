import React from 'react';
import { Link } from 'react-router-dom';
import "../styles/about.css";

const AboutPage = () => {
  return (
    <div className="about-page">
      <h1>About Us</h1>
      <p>
        Welcome to Quiz Craft Platform, a cutting-edge solution designed to transform the way quizzes are created and experienced. Our platform is dedicated to empowering educators, students, and trivia enthusiasts by providing an engaging and interactive learning environment.
      </p>

      <h2>Our Mission</h2>
      <p>
        At Quiz Craft, our mission is to bridge the gap between education and entertainment. We strive to make learning more interactive, fun, and accessible for everyone through gamification and advanced analytics.
      </p>

      <h2>What We Offer</h2>
      <ul>
        <li>A user-friendly platform for creating and managing quizzes.</li>
        <li>Advanced analytics to track performance and engagement.</li>
        <li>Real-time quiz participation for dynamic learning experiences.</li>
        <li>Customizable quizzes to align with different curriculums and learning needs.</li>
        <li>A collaborative space for students and teachers to engage in knowledge-sharing.</li>
      </ul>

      <h2>Why Choose Us?</h2>
      <p>
        Unlike traditional quiz platforms, Quiz Craft goes beyond simple gamification. We provide in-depth analytics, user-driven quiz creation, and seamless integration with modern educational tools to enhance learning outcomes.
      </p>

      <h2>Our Team</h2>
      <p>
        Quiz Craft is built by a passionate team of developers, educators, and innovators dedicated to redefining digital learning experiences. We believe that education should be engaging, inclusive, and adaptable to different learning styles.
      </p>

      <h2>Future Roadmap</h2>
      <ul>
        <li>Mobile app development for seamless accessibility.</li>
        <li>AI-driven personalized quizzes.</li>
        <li>Integration with Learning Management Systems (LMS).</li>
        <li>Multi-language support to reach a global audience.</li>
      </ul>

      <p>
        Join us on our journey to make learning more interactive and enjoyable!
      </p>

      <p>
        For any inquiries or collaborations, feel free to reach out to us at: <a href="mailto:info@quizcraft.com">info@quizcraft.com</a>
      </p>

      <p>
        Ready to get started? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
};

export default AboutPage;