import React, { useState } from "react";
import api from "../api/axios";
import "../styles/createQuiz.css";

const CreateQuiz = () => {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    {
      questionText: "",
      options: ["", "", "", ""],
      correctOption: "",
      type: "multiple-choice",
      timer: 30,
    },
  ]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];

    if (field === "type") {
      newQuestions[index].type = value;

      // Adjust options based on question type
      if (value === "true-false") {
        newQuestions[index].options = ["True", "False"];
      } else {
        newQuestions[index].options = ["", "", "", ""];
      }

      // Reset correctOption to avoid incorrect values
      newQuestions[index].correctOption = "";
    } else {
      newQuestions[index][field] = value;
    }

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
      },
    ]);
    setSelectedQuestionIndex(questions.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/quiz/create", { title, questions });
      if (response.status === 201) {
        alert(`Quiz created successfully! Your quiz code is: ${response.data.code}`);
        setTitle("");
        setQuestions([
          {
            questionText: "",
            options: ["", "", "", ""],
            correctOption: "",
            type: "multiple-choice",
            timer: 30,
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
        <button type="button" onClick={addQuestion}>Add Slide</button>
        <input
          type="text"
          placeholder="Quiz Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button type="submit" onClick={handleSubmit}>Create Quiz</button>
      </div>
      <div className="create-quiz-content">
        <div className="sidebar left-sidebar">
          <ul>
            {questions.map((question, index) => (
              <li
                key={index}
                className={index === selectedQuestionIndex ? "active" : ""}
                onClick={() => setSelectedQuestionIndex(index)}
              >
                Slide {index + 1}
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
              onChange={(e) => handleQuestionChange(selectedQuestionIndex, "questionText", e.target.value)}
              required
            />
            
            {/* Render options based on question type */}
            {questions[selectedQuestionIndex].type === "true-false" ? (
              <>
                <p>True</p>
                <p>False</p>
              </>
            ) : (
              questions[selectedQuestionIndex].options.map((option, oIndex) => (
                <input
                  key={oIndex}
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(selectedQuestionIndex, oIndex, e.target.value)}
                  placeholder={`Option ${oIndex + 1}`}
                  required
                />
              ))
            )}

            <label>Correct Option</label>
            <select
              value={questions[selectedQuestionIndex].correctOption}
              onChange={(e) => handleQuestionChange(selectedQuestionIndex, "correctOption", e.target.value)}
              required
            >
              <option value="">Select Correct Answer</option>
              {questions[selectedQuestionIndex].options.map((option, oIndex) => (
                <option key={oIndex} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="sidebar right-sidebar">
          <div className="quiz-type">
            <label>Quiz Type</label>
            <select
              value={questions[selectedQuestionIndex].type}
              onChange={(e) => handleQuestionChange(selectedQuestionIndex, "type", e.target.value)}
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
              onChange={(e) => handleQuestionChange(selectedQuestionIndex, "timer", e.target.value)}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz;
