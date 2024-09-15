
"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {useSession} from "next-auth/react"
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// Assuming these are custom components
import axios from "axios";

export default function ExamComponent() {
  const { examId } = useParams(); // Get the exam ID from the URL query

  const router = useRouter();
  const [isExamActive, setIsExamActive] = useState(true);
  const {data:session,status}=useSession()
  const [exam, setExam] = useState(null); // To store the exam data
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Track current question
  const [answers, setAnswers] = useState([]); // Store user answers (questionId -> selectedOptionId)
  const [timeLeft, setTimeLeft] = useState(null); // Timer state
  
  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  const exitExam = () => {
    setIsExamActive(false);
    router.replace(`/exams`); // Redirect to an exam failed page
    alert("The exam is now stopped.");
  };

  // Fetch the exam data when the component loads

  useEffect(() => {
    if (examId) {
      axios
        .get(`/api/exams/${examId}`)
        .then((response) => {
          setExam(response.data);
          setTimeLeft(response.data.duration * 60);
          console.log(response); // Set the time based on exam duration
        })
        .catch((error) => {
          console.error("Error fetching exam:", error);
        });
    }
  }, [examId]);

  const handleVisibilityChange = () => {
    if (document.hidden) {
      exitExam();
    }
  };

  const handleFullScreenChange = () => {
    if (
      !document.fullscreenElement &&
      !document.webkitIsFullScreen &&
      !document.mozFullScreen &&
      !document.msFullscreenElement
    ) {
      exitExam(); // Exit exam if full-screen mode is left
    }
  };

  useEffect(() => {
    // Ensure the exam starts in full-screen mode
    enterFullScreen();

    // Listen for full-screen exit
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange", handleFullScreenChange);
    document.addEventListener("MSFullscreenChange", handleFullScreenChange);

    // Listen for tab switching
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up event listeners when the component unmounts
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullScreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullScreenChange
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Handle timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  // Handle answer selection
  const handleAnswerChange = (questionId, optionIndex) => {
    setAnswers([
      ...answers,
      {[questionId]: optionIndex}
    ]);
  };

  // Submit exam
  const handleSubmit = () => {
    console.log(answers)
    axios
      .post(`/api/exams/${examId}/submit`, { answers, examId, timeSpent:3, studentId:session.user._id })
      .then((response) => {
        
        // Redirect or show result after successful submission
        console.log("Exam submitted:", response.data);
        router.replace("/exams")
        
      })
      .catch((error) => {
        console.error("Error submitting exam:", error);
      });
  };

  if (!exam) return <div>Loading...</div>;

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{`${Math.floor(timeLeft / 60)}:${String(
              timeLeft % 60
            ).padStart(2, "0")}`}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>{exam.questions.length} Questions</span>
          <div className="h-3 w-40 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `100%` }}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-10">
          {exam.questions.map((question, index) => (
            <div key={question._id} className="m-4 p-4">
              <h2 className="text-xl font-bold">Question {index + 1}</h2>
              <p className="text-muted-foreground mt-4">{question.text}</p>
              <div className="mt-4 space-y-4">
                {question.options.map((option, optionIndex) => (
                  <div className="flex items-center gap-3" key={optionIndex}>
                    <Checkbox
                      id={`option-${optionIndex}-${index}`}
                      checked={answers[question._id] === optionIndex}
                      onChange={() =>
                        handleAnswerChange(question._id, optionIndex)
                      }
                    />
                    <label
                      htmlFor={`option-${optionIndex}-${index}`}
                      className="text-base"
                    >
                      {option.optionText}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t py-4 px-6 flex justify-end">
        <Button onClick={handleSubmit}>Submit Exam</Button>
      </div>
    </div>
  );
}
