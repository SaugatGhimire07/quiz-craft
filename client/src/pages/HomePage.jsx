import Img_study from "../assets/Home/landing_study_pic.svg";
import Create from "../assets/Home/create.png";
import Play from "../assets/Home/play.png";
import Review from "../assets/Home/review.png";
import Children from "../assets/Home/children.jpg";
import "../styles/home.css";

//components
import Navbar from "../components/NavBar";
import Footer from "../components/Footer";
import JoinQuiz from "../components/JoinQuiz";

const HomePage = () => {
  return (
    <div className="container-home">
      <Navbar />
      <div className="pincode-container">
        <h2 className="enter-pincode-text">Enter code to join live Quiz</h2>
        <JoinQuiz />
      </div>
      <div className="header-container">
        <h1 className="header">
          Create, Play and Learn with Interactive Quizzes!
        </h1>
        <p className="header-text">
          Empower your learning with fun, customizable quizzes tailored for
          students and educators alike
        </p>
      </div>
      <div className="bottom-container">
        <button className="button">Get Started</button>
      </div>

      {/* Modified fullwidth image container */}
      <div className="fullwidth-img-container">
        <img
          src={Img_study}
          alt="Study illustration"
          className="fullwidth-image"
        />
      </div>

      <div className="text-container" id="features">
        <div className="short-heading">
          <h5>Why you&apos;ll love QuizCraft</h5>
        </div>
        <div className="heading-2">
          <h1
            style={{
              fontWeight: "600",
              fontSize: "40px",
              fontFamily: "Hurme Geometric Sans 1",
            }}
          >
            From Fun Quizzes to Powerful Learning
          </h1>
        </div>
        <div className="para-2">
          <p>
            Quizcraft makes learning interactive, engaging, and effective.
            Whether you&apos;re hosting a fun trivia <br /> game or an
            educational quiz, everyone can participate, learn, and grow at their
            own pace.
          </p>
        </div>
      </div>

      <div className="desc-container">
        <ul className="desc_points">
          <li>🎯 Easy Quiz Creation</li>
          <li>⚡ Real-Time Participation</li>
          <li>📊 Detailed Results & Analytics</li>
          <li>📝 Personalized Feedback</li>
        </ul>
      </div>

      <div className="text-container" id="how-it-works">
        <div className="short-heading">
          <h5>How it works</h5>
        </div>
        <div className="heading-2">
          <h1 style={{ fontWeight: "600", fontSize: "40px" }}>
            Get started in 3 steps
          </h1>
        </div>
        <div className="para-2">
          <p>
            Quizcraft helps you create, play, and review—let&apos;s see how!
          </p>
        </div>
      </div>

      <div className="features-container">
        {/* Create Card */}
        <div className="feature-card">
          <h2 style={{ textAlign: "left" }}>Create</h2>
          <div className="feature-image pink">
            <img
              src={Create}
              alt="Person typing on laptop"
              className="feature-img"
            />
          </div>
          <p>
            Whether you&apos;re crafting a coding challenge or a fun trivia
            quiz, Quizcraft has you covered. Create your quiz in seconds!
          </p>
        </div>

        {/* Play Card */}
        <div className="feature-card">
          <h2 style={{ textAlign: "left" }}>Play</h2>
          <div className="feature-image purple">
            <img src={Play} alt="Person using phone" className="feature-img" />
          </div>
          <p>
            Participants can easily join your quiz by entering a unique code.
            Everyone gets instant feedback as they play!
          </p>
        </div>

        {/* Review Card */}
        <div className="feature-card">
          <h2 style={{ textAlign: "left" }}> Review</h2>
          <div className="feature-image yellow">
            <img
              src={Review}
              alt="Person reviewing on laptop"
              className="feature-img"
            />
          </div>
          <p>
            After the quiz, identify strengths and areas for improvement with
            insightful analytics and feedback for every participant.
          </p>
        </div>
      </div>

      <div className="last-container">
        {/* Left Image Container */}
        <div className="left_img_container">
          <div className="img-wrapper">
            <img
              src={Children}
              alt="Children Learning"
              className="rotated-img"
            />
          </div>
        </div>

        {/* Right Text Container */}
        <div className="right_text_container">
          <div className="badge">Quizcraft in Education</div>
          <p className="text-content">
            Quizcraft empowers students and educators to engage, learn, and grow
            through interactive quizzes. Encourage participation, assess
            understanding, and make learning fun for everyone in the classroom.
          </p>
          <button className="learn-more-btn">Learn More</button>
        </div>
      </div>

      <div className="Ready-container">
        <div className="left-style"></div>
        <div className="Ready-heading">
          <h1>Ready to get started?</h1>
        </div>
        <div className="Ready-button-container">
          <button className="Ready-button">Get Started</button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
