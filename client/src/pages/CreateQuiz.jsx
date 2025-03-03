import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import "../styles/createQuiz.css";
import { FaEdit, FaSave, FaTrash } from "react-icons/fa"; // Import icons from react-icons
import logo from "../assets/logo/logo.png";

const CreateQuiz = () => {
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [questions, setQuestions] = useState([
    {
      questionText: "",
      options: ["", "", "", ""],
      correctOption: "",
      type: "multiple-choice",
      timer: 30,
      image: "",
    },
  ]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        options: ["", "", "", ""],
        correctOption: "",
        type: "multiple-choice",
        timer: 30,
        image: "",
      },
    ]);
    setSelectedQuestionIndex(questions.length);
  };

  const handleImageChange = (e, questionIndex) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].image = reader.result;
        setQuestions(newQuestions);
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    if (selectedQuestionIndex >= newQuestions.length) {
      setSelectedQuestionIndex(newQuestions.length - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/quiz/create", { title, questions });
      if (response.status === 201) {
        alert(
          `Quiz created successfully! Your quiz code is: ${response.data.code}`
        );
        setTitle("");
        setQuestions([
          {
            questionText: "",
            options: ["", "", "", ""],
            correctOption: "",
            type: "multiple-choice",
            timer: 30,
            image: "",
          },
        ]);
        setSelectedQuestionIndex(0);
      } else {
        alert("Failed to create quiz.");
      }
    } catch (error) {
      alert("Failed to create quiz.");
    }
  };

  return (
    <div className="create-quiz">
      <div className="header">
        <Link to="/" className="logo-link">
          <img src={logo} alt="Logo" className="logo" />
        </Link>
        <div className="quiz-title-container">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="quiz-title-input"
              placeholder="Enter Quiz Title"
            />
          ) : (
            <p>{title || "Untitled Quiz"}</p>
          )}
          <button
            className="edit-title-btn"
            onClick={() => setIsEditingTitle(!isEditingTitle)}
          >
            {isEditingTitle ? <FaSave /> : <FaEdit />}
          </button>
        </div>
        <button
          type="submit"
          className="create-quiz-btn"
          onClick={handleSubmit}
        >
          Create
        </button>
      </div>
      <div className="create-quiz-content">
        <div className="sidebar left-sidebar">
          <button type="button" className="new-slide-btn" onClick={addQuestion}>
            + New Slide
          </button>
          <ul>
            {questions.map((question, index) => (
              <li
                key={index}
                className={`slide-preview ${
                  index === selectedQuestionIndex ? "active" : ""
                }`}
                onClick={() => setSelectedQuestionIndex(index)}
              >
                <div className="slide-content">
                  <h4>Slide {index + 1}</h4>
                  <p className="slide-question">
                    {question.questionText || "New Question"}
                  </p>
                  {question.image && (
                    <img
                      src={question.image}
                      alt="Slide"
                      className="slide-image"
                    />
                  )}
                </div>
                <button
                  className="delete-slide-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent slide selection
                    deleteQuestion(index);
                  }}
                >
                  <FaTrash />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="main-content">
          <div className="question-group">
            <label>Question {selectedQuestionIndex + 1}</label>
            <input
              type="text"
              value={questions[selectedQuestionIndex].questionText}
              onChange={(e) =>
                handleQuestionChange(
                  selectedQuestionIndex,
                  "questionText",
                  e.target.value
                )
              }
              required
              placeholder="Enter your question"
            />

            {/* Image Picker Section */}
            <div className="image-picker">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, selectedQuestionIndex)}
              />
            </div>

            {/* Image Display Section */}
            {questions[selectedQuestionIndex].image && (
              <div className="question-image">
                <img
                  src={questions[selectedQuestionIndex].image}
                  alt="Question"
                />
              </div>
            )}

            {/* Render options based on question type */}
            {questions[selectedQuestionIndex].type === "true-false" ? (
              <>
                <p>True</p>
                <p>False</p>
              </>
            ) : (
              <div className="options-grid">
                {questions[selectedQuestionIndex].options.map((option, oIndex) => (
                  <input
                    key={oIndex}
                    type="text"
                    value={option}
                    onChange={(e) =>
                      handleOptionChange(
                        selectedQuestionIndex,
                        oIndex,
                        e.target.value
                      )
                    }
                    placeholder={`Option ${oIndex + 1}`}
                    required
                  />
                ))}
              </div>
            )}

            <label>Correct Option</label>
            <select
              value={questions[selectedQuestionIndex].correctOption}
              onChange={(e) =>
                handleQuestionChange(
                  selectedQuestionIndex,
                  "correctOption",
                  e.target.value
                )
              }
              required
            >
              <option value="">Select Correct Answer</option>
              {questions[selectedQuestionIndex].options.map(
                (option, oIndex) => (
                  <option key={oIndex} value={option}>
                    {option}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
        <div className="sidebar right-sidebar">
          <div className="quiz-type">
            <label>Quiz Type</label>
            <select
              value={questions[selectedQuestionIndex].type}
              onChange={(e) =>
                handleQuestionChange(
                  selectedQuestionIndex,
                  "type",
                  e.target.value
                )
              }
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True/False</option>
            </select>
          </div>
          <div className="timer">
            <label>Timer (seconds)</label>
            <input
              type="number"
              value={questions[selectedQuestionIndex].timer}
              onChange={(e) =>
                handleQuestionChange(
                  selectedQuestionIndex,
                  "timer",
                  e.target.value
                )
              }
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz;