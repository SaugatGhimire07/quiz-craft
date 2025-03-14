import "../styles/createQuiz.css";
import useQuiz from "../hooks/useQuiz";
import QuizMainContent from "../components/QuizMainContent";

const LiveQuiz = () => {
  const {
    questions,
    selectedQuestionIndex,
    setSelectedQuestionIndex,
    fileInputRef,
    handleQuestionChange,
    handleImageClick,
    handleImageChange,
    handleDragOver,
    handleDrop,
    removeImage,
  } = useQuiz();

  return (
    <div className="create-quiz">
      <div className="create-quiz-content">
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
      </div>
    </div>
  );
};

export default LiveQuiz;
