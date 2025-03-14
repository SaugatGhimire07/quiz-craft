import PropTypes from "prop-types";
import LogoOnly from "../assets/logo/logo-only.png";

const QuizMainContent = ({
  questions,
  selectedQuestionIndex,
  handleQuestionChange,
  handleImageClick,
  handleImageChange,
  handleDragOver,
  handleDrop,
  removeImage,
  fileInputRef,
  readOnly,
}) => {
  const hasImage = questions[selectedQuestionIndex]?.image;

  return (
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
          readOnly={readOnly}
        />

        {questions[selectedQuestionIndex].image && (
          <div className="question-image">
            <img src={questions[selectedQuestionIndex].image} alt="Question" />
          </div>
        )}
      </div>

      <div className="content-spacer"></div>

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
                      readOnly={readOnly}
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
                          if (!readOnly) {
                            handleQuestionChange(
                              selectedQuestionIndex,
                              "correctOption",
                              option
                            );
                          }
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
                  if (!readOnly) {
                    handleQuestionChange(
                      selectedQuestionIndex,
                      "correctOption",
                      "True"
                    );
                  }
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
                  if (!readOnly) {
                    handleQuestionChange(
                      selectedQuestionIndex,
                      "correctOption",
                      "False"
                    );
                  }
                }}
              >
                <div className="radio-inner"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

QuizMainContent.propTypes = {
  questions: PropTypes.array.isRequired,
  selectedQuestionIndex: PropTypes.number.isRequired,
  handleQuestionChange: PropTypes.func.isRequired,
  handleImageClick: PropTypes.func.isRequired,
  handleImageChange: PropTypes.func.isRequired,
  handleDragOver: PropTypes.func.isRequired,
  handleDrop: PropTypes.func.isRequired,
  removeImage: PropTypes.func.isRequired,
  fileInputRef: PropTypes.object.isRequired,
  readOnly: PropTypes.bool,
};

export default QuizMainContent;
