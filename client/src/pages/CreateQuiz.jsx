import "../styles/createQuiz.css";
import useQuiz from "../hooks/useQuiz";
import QuizMainContent from "../components/QuizMainContent";

const CreateQuiz = () => {
  const {
    title,
    setTitle,
    isEditingTitle,
    setIsEditingTitle,
    questions,
    selectedQuestionIndex,
    setSelectedQuestionIndex,
    alert,
    setAlert,
    fileInputRef,
    handleQuestionChange,
    addQuestion,
    deleteQuestion,
    handleImageClick,
    handleImageChange,
    handleDragOver,
    handleDrop,
    removeImage,
    handleSubmit,
  } = useQuiz();

  const handleBack = () => {
    window.history.back();
  };

  const handlePreview = () => {
    console.log("Preview quiz");
  };

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
        <QuizMainContent
          questions={questions}
          selectedQuestionIndex={selectedQuestionIndex}
          handleQuestionChange={handleQuestionChange}
          handleImageClick={handleImageClick}
          handleImageChange={handleImageChange}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          removeImage={removeImage}
          fileInputRef={fileInputRef}
        />
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
