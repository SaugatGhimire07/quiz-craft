import { useState, useRef, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../hooks/useAuth"; // Import useAuth
import "../styles/createQuiz.css";
import LogoOnly from "../assets/logo/logo-only.png";
import { useNavigate, useParams } from "react-router-dom"; // Add useParams

const CreateQuiz = () => {
  const { quizId } = useParams(); // Add this hook
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user from useAuth
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
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const fileInputRef = useRef(null); // Add this for file input reference

  // Add fetch quiz effect
  useEffect(() => {
    const fetchQuiz = async () => {
      if (quizId) {
        try {
          const response = await api.get(`/quiz/${quizId}`);
          const quiz = response.data;
          setTitle(quiz.title);
          setQuestions(quiz.questions);
        } catch (error) {
          console.error("Error fetching quiz:", error);
          navigate("/dashboard");
        }
      }
    };

    fetchQuiz();
  }, [quizId, navigate]);

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
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

  const deleteQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    if (selectedQuestionIndex >= newQuestions.length) {
      setSelectedQuestionIndex(newQuestions.length - 1);
    }
  };

  const handleBack = () => {
    // Navigate back to previous page
    window.history.back();
  };

  const handlePreview = () => {
    // Logic for previewing the quiz
    console.log("Preview quiz");
  };

  // Updated image handlers
  const handleImageClick = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Add this to prevent bubbling

    // Make sure we have a reference and directly trigger the click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error("File input reference not available");
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post("/images/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Store the URL and filename
      handleQuestionChange(selectedQuestionIndex, "image", response.data.url);
      handleQuestionChange(
        selectedQuestionIndex,
        "imageFilename",
        response.data.filename
      );
    } catch (error) {
      console.error("Error uploading image:", error);
      setAlert({
        show: true,
        message: "Failed to upload image. Please try again.",
        type: "error",
      });
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 3000);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await api.post("/images/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Store the URL and filename
        handleQuestionChange(selectedQuestionIndex, "image", response.data.url);
        handleQuestionChange(
          selectedQuestionIndex,
          "imageFilename",
          response.data.filename
        );
      } catch (error) {
        console.error("Error uploading image:", error);
        setAlert({
          show: true,
          message: "Failed to upload image. Please try again.",
          type: "error",
        });
        setTimeout(
          () => setAlert({ show: false, message: "", type: "" }),
          3000
        );
      }
    }
  };

  const removeImage = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const filename = questions[selectedQuestionIndex].imageFilename;

    // If we have a filename, try to delete the file from the server
    if (filename) {
      try {
        await api.delete(`/images/${filename}`);
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }

    handleQuestionChange(selectedQuestionIndex, "image", "");
    handleQuestionChange(selectedQuestionIndex, "imageFilename", null);
  };

  // Update handleSubmit to handle both create and edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user) {
        navigate("/login");
        return;
      }

      // Validate title
      if (!title.trim()) {
        setAlert({
          show: true,
          message: "Please enter a quiz title!",
          type: "error",
        });
        setTimeout(
          () => setAlert({ show: false, message: "", type: "" }),
          3000
        );
        return;
      }

      // Validate questions
      const isValid = questions.every((question) => {
        if (!question.questionText.trim()) {
          setAlert({
            show: true,
            message: "All questions must have text",
            type: "error",
          });
          setTimeout(
            () => setAlert({ show: false, message: "", type: "" }),
            3000
          );
          return false;
        }

        if (!question.correctOption) {
          setAlert({
            show: true,
            message: "Please select a correct answer for all questions",
            type: "error",
          });
          setTimeout(
            () => setAlert({ show: false, message: "", type: "" }),
            3000
          );
          return false;
        }

        if (question.type === "multiple-choice") {
          const filledOptions = question.options.filter((opt) => opt.trim());
          if (filledOptions.length < 2) {
            setAlert({
              show: true,
              message: "Multiple choice questions must have at least 2 options",
              type: "error",
            });
            setTimeout(
              () => setAlert({ show: false, message: "", type: "" }),
              3000
            );
            return false;
          }
        }
        return true;
      });

      if (!isValid) return;

      // Clean up questions data before sending
      const cleanQuestions = questions.map((question) => ({
        ...question,
        questionText: question.questionText.trim(),
        options:
          question.type === "multiple-choice"
            ? question.options.filter((opt) => opt.trim())
            : ["True", "False"],
        correctOption: question.correctOption,
        type: question.type,
        timer: parseInt(question.timer) || 30,
      }));

      const endpoint = quizId ? `/quiz/${quizId}` : "/quiz/create";
      const method = quizId ? "put" : "post";

      const response = await api[method](endpoint, {
        title: title.trim(),
        questions: cleanQuestions,
      });

      if (response.status === 201 || response.status === 200) {
        setAlert({
          show: true,
          message: `Quiz ${quizId ? "updated" : "created"} successfully!`,
          type: "success",
        });
        setTimeout(() => {
          setAlert({ show: false, message: "", type: "" });
          navigate("/dashboard");
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating quiz:", error);
      if (error.response?.status === 413) {
        setAlert({
          show: true,
          message: "Failed to create quiz. The payload size is too large.",
          type: "error",
        });
      } else if (error.response?.data?.message) {
        setAlert({
          show: true,
          message: error.response.data.message,
          type: "error",
        });
      } else {
        setAlert({
          show: true,
          message: "Failed to create quiz. Please try again.",
          type: "error",
        });
      }
      setTimeout(() => setAlert({ show: false, message: "", type: "" }), 3000);
    }
  };

  // Check if current question has an image
  const hasImage = questions[selectedQuestionIndex]?.image;

  return (
    <div className="create-quiz">
      {alert.show && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}
      <div className="quiz-header">
        <div className="header-left">
          <button className="quiz-back-button" onClick={handleBack}>
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
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="quiz-title-container">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="quiz-title-input"
                placeholder="Untitled Quiz"
                autoFocus
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsEditingTitle(false);
                  }
                }}
              />
            ) : (
              <p onClick={() => setIsEditingTitle(true)}>
                {title || "Untitled Quiz"}
              </p>
            )}
            <button
              className="edit-title-btn"
              onClick={() => setIsEditingTitle(!isEditingTitle)}
            ></button>
          </div>
        </div>

        <div className="header-right">
          <button className="preview-button" onClick={handlePreview}>
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
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Preview
          </button>
          <button
            type="submit"
            className="create-quiz-btn"
            onClick={handleSubmit}
          >
            Save Quiz
          </button>
        </div>
      </div>

      <div className="create-quiz-content">
        <div className="quiz-sidebar left-sidebar">
          <button type="button" className="new-slide-btn" onClick={addQuestion}>
            + New Question
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
                  <h4>Question {index + 1}</h4>
                  <p className="slide-question">
                    {question.questionText || "New Question"}
                  </p>
                  {question.image && (
                    <div className="image-indicator">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>Image attached</span>
                    </div>
                  )}
                </div>
                <button
                  className="delete-slide-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteQuestion(index);
                  }}
                ></button>
              </li>
            ))}
          </ul>
        </div>
        <div className="quiz-main-content">
          <div className="quiz-main-header">
            <img src={LogoOnly} alt="Quiz Craft Logo" className="quiz-logo" />
          </div>
          <div className="question-group">
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
              placeholder="Ask your question here..."
            />

            {/* Image Display Section */}
            {questions[selectedQuestionIndex].image && (
              <div className="question-image">
                <img
                  src={questions[selectedQuestionIndex].image}
                  alt="Question"
                />
              </div>
            )}
          </div>

          {/* Spacer to push options to bottom */}
          <div className="content-spacer"></div>

          {/* Question type specific options - will stay at bottom */}
          {questions[selectedQuestionIndex].type === "multiple-choice" ? (
            <div className="options-container multiple-choice">
              <div className="options-grid">
                {questions[selectedQuestionIndex].options.map(
                  (option, optionIndex) => (
                    <div key={optionIndex} className="option-row">
                      <div className="option-input-wrapper">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [
                              ...questions[selectedQuestionIndex].options,
                            ];
                            newOptions[optionIndex] = e.target.value;
                            handleQuestionChange(
                              selectedQuestionIndex,
                              "options",
                              newOptions
                            );
                          }}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="option-input"
                        />
                        {option && (
                          <div
                            className={`option-radio ${
                              questions[selectedQuestionIndex].correctOption ===
                              option
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              handleQuestionChange(
                                selectedQuestionIndex,
                                "correctOption",
                                option
                              );
                            }}
                          >
                            <div className="radio-inner"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="options-container true-false">
              <div className="option-row">
                <div className="option-input-wrapper">
                  <input
                    type="text"
                    value="True"
                    readOnly
                    className="option-input true-option"
                  />
                  <div
                    className={`option-radio ${
                      questions[selectedQuestionIndex].correctOption === "True"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => {
                      handleQuestionChange(
                        selectedQuestionIndex,
                        "correctOption",
                        "True"
                      );
                    }}
                  >
                    <div className="radio-inner"></div>
                  </div>
                </div>
              </div>
              <div className="option-row">
                <div className="option-input-wrapper">
                  <input
                    type="text"
                    value="False"
                    readOnly
                    className="option-input false-option"
                  />
                  <div
                    className={`option-radio ${
                      questions[selectedQuestionIndex].correctOption === "False"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => {
                      handleQuestionChange(
                        selectedQuestionIndex,
                        "correctOption",
                        "False"
                      );
                    }}
                  >
                    <div className="radio-inner"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="quiz-sidebar right-sidebar">
          <div className="quiz-type">
            <label>Question Type</label>
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
          <div className="quiz-image-container">
            <label>Image</label>
            <div
              className={`quiz-image-uploader ${hasImage ? "has-image" : ""}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {hasImage ? (
                <div className="image-actions">
                  <div className="image-thumbnail">
                    <img
                      src={questions[selectedQuestionIndex].image}
                      alt="Question"
                    />
                  </div>
                  <div className="image-buttons">
                    <span
                      className="update-image-text"
                      onClick={handleImageClick}
                    >
                      Update image
                    </span>
                    <button
                      className="delete-image-btn"
                      onClick={removeImage}
                      aria-label="Delete image"
                    >
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
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                  <label
                    className="click-to-add"
                    htmlFor="file-upload"
                    onClick={handleImageClick}
                  >
                    Click to add image
                  </label>
                </>
              )}
              <input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>
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
