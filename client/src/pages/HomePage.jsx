import React from "react";
import Img_study from "../assets/Home/landing_study_pic.png";
import Create from "../assets/Home/create_img.jpg";
import Play from "../assets/Home/play_img.jpg";
import Review from "../assets/Home/review_img.jpg";
import Children from "../assets/Home/children.jpg";
import "../styles/home.css";

const HomePage = () => {
  return (
    <div className="container-home">
        <div className="header-container">
            <h1 className="header">Create, Play and Learn with Interactive Quizzes!</h1>
            <p className="header-text">Empower your learning with fun, customizable quizzes tailored for students and educators alike</p>
        </div>

        <div className="bottom-container">
            <button className="button">Get Started</button>
        </div>
        <div className="img-container">
            <div className="img_Style">   
            <img src={Img_study} style={{width:'1250px' , height:'400px', padding:'0px'}}/>
            </div>
        </div>

        <div className="text-container">
            <div className="short-heading">
                <h5>Why you'll love QuizCraft</h5>
            </div>
            <div className="heading-2">
                <h1 style={{fontWeight:'600'}}>From Fun Quizzes to Powerful Learning</h1>
            </div>
            <div className="para-2">
                <p>Quizcraft makes learning interactive, engaging, and effective. Whether you're hosting a fun trivia game or an educational quiz, everyone can participate, learn, and grow at their own pace.</p>
            </div>
        </div>

        <div className="desc-container">
            <ul className="desc_points">
                <li>
                🎯 Easy Quiz Creation
                </li>
                <li>
                ⚡ Real-Time Participation
                </li>
                <li>
                📊 Detailed Results & Analytics
                </li>
                <li>
                📝 Personalized Feedback
                </li>
            </ul>
        </div>
    
        <div className="text-container">
            <div className="short-heading">
                <h5>How it works</h5>
            </div>
            <div className="heading-2">
                <h1 style={{fontWeight:'600'}}>Get started in 3 steps</h1>
            </div>
            <div className="para-2">
                <p>Quizcraft helps you create, play, and review—let's see how!</p>
            </div>
        </div>

        <div className="features-container">
            {/* Create Card */}
            <div className="feature-card">
                <h2 style={{textAlign:'left'}}>Create</h2>
                <div className="feature-image pink">
                    <span className="number number-one"></span>
                    <span className="design1 pink1"></span>
                    <img src={Create} alt="Person typing on laptop" className="feature-img" />
                </div>
                <p>Whether you're crafting a coding challenge or a fun trivia quiz, Quizcraft has you covered. Create your quiz in seconds!</p>
            </div>

            {/* Play Card */}
            <div className="feature-card">
                <h2 style={{textAlign:'left'}}>Play</h2>
                <div className="feature-image purple">
                    <span className="number number-two"></span>
                    <img src={Play} alt="Person using phone" className="feature-img1" />
                </div>
                <p>Participants can easily join your quiz by entering a unique code. Everyone gets instant feedback as they play!</p>
            </div>

            {/* Review Card */}
            <div className="feature-card">
                <h2 style={{textAlign:'left'}}> Review</h2>
                <div className="feature-image yellow">
                    <span className="number number-three"></span>
                    <img src={Review} alt="Person reviewing on laptop" className="feature-img2" />
                </div>
                <p>After the quiz, identify strengths and areas for improvement with insightful analytics and feedback for every participant.</p>
            </div>
        </div>


        <div className="last-container">
            {/* Left Image Container */}
            <div className="left_img_container">
                <div className="img-wrapper">
                    <img src={Children} alt="Children Learning" className="rotated-img" />
                </div>
            </div>

            {/* Right Text Container */}
            <div className="right_text_container">
                <div className="badge">Quizcraft in Education</div>
                <p className="text-content">
                    <i>
                        Quizcraft empowers students and educators to engage, learn, and grow 
                        through interactive quizzes. Encourage participation, assess 
                        understanding, and make learning fun for everyone in the classroom.
                    </i>
                </p>
                <button className="learn-more-btn">Learn More</button>
            </div>
        </div>
    </div>
  );
};

export default HomePage;
