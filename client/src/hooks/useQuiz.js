import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../hooks/useAuth";

const useQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const fileInputRef = useRef(null);

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

  const handleImageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!user) {
        navigate("/login");
        return;
      }

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

  return {
    title,
    setTitle,
    isEditingTitle,
    setIsEditingTitle,
    questions,
    setQuestions,
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
  };
};

export default useQuiz;
