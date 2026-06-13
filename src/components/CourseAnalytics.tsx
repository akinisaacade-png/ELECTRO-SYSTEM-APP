/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserAnalytics, COURSE_DETAILS, QuizQuestion } from "../types";
import { GraduationCap, Trophy, AlertCircle, BookOpen, ShieldCheck, Zap, Cable, CircleDot, Play, CheckCircle2, RotateCcw } from "lucide-react";

// Firebase integration
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface Props {
  analytics: UserAnalytics;
  onRefresh: () => void;
  onTrackAction: (actionType: string) => void;
}

export default function CourseAnalytics({ analytics, onRefresh, onTrackAction }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<{
    currentIndex: number;
    answers: Record<number, number>;
    submitted: boolean;
    quizScore: number | null;
  } | null>(null);

  const startCourseQuiz = (courseId: string) => {
    setSelectedCourse(courseId);
    setQuizState({
      currentIndex: 0,
      answers: {},
      submitted: false,
      quizScore: null,
    });
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (!quizState || quizState.submitted) return;
    setQuizState({
      ...quizState,
      answers: {
        ...quizState.answers,
        [quizState.currentIndex]: optionIndex,
      },
    });
  };

  const handleNextQuestion = (total: number) => {
    if (!quizState) return;
    if (quizState.currentIndex < total - 1) {
      setQuizState({
        ...quizState,
        currentIndex: quizState.currentIndex + 1,
      });
    }
  };

  const handlePrevQuestion = () => {
    if (!quizState) return;
    if (quizState.currentIndex > 0) {
      setQuizState({
        ...quizState,
        currentIndex: quizState.currentIndex - 1,
      });
    }
  };

  const submitQuiz = (questions: QuizQuestion[]) => {
    if (!quizState || !selectedCourse) return;
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (quizState.answers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);

    // Save quiz result to backend or direct Firestore!
    if (auth.currentUser) {
      const docRef = doc(db, "userAnalytics", auth.currentUser.uid);
      getDoc(docRef)
        .then(async (docSnap) => {
          if (docSnap.exists()) {
            const currentData = docSnap.data();
            const courses = { ...currentData.courses };
            const crs = courses[selectedCourse] || { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false };

            const oldSum = (crs.avgScore || 0) * (crs.quizzesTaken || 0);
            crs.quizzesTaken = (crs.quizzesTaken || 0) + 1;
            crs.avgScore = Math.round((oldSum + scorePct) / crs.quizzesTaken);
            crs.progress = Math.min((crs.progress || 0) + 40, 100);
            if (crs.progress === 100) crs.completed = true;

            courses[selectedCourse] = crs;

            // Recalculate overall score across active quizzes
            let totalScore = 0;
            let counts = 0;
            Object.values(courses).forEach((c: any) => {
              if (c.quizzesTaken > 0) {
                totalScore += c.avgScore;
                counts++;
              }
            });
            const overallScore = counts > 0 ? Math.round(totalScore / counts) : scorePct;

            try {
              await setDoc(docRef, {
                ...currentData,
                courses,
                overallScore,
              });
              setQuizState({
                ...quizState,
                submitted: true,
                quizScore: scorePct,
              });
              onRefresh();
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `userAnalytics/${auth.currentUser.uid}`);
            }
          }
        })
        .catch((err) => {
          console.error("Firestore loading error in course metrics:", err);
        });
    } else {
      // Local fallback using mock fetch API
      const reportQuizLocal = async () => {
        let token = "guest-bypass-token";
        if (auth.currentUser) {
          try {
            token = await auth.currentUser.getIdToken();
          } catch (e) {
            console.error("Failed to fetch token", e);
          }
        }

        fetch("/api/analytics/quiz", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: analytics.userId,
            courseId: selectedCourse,
            score: scorePct,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setQuizState({
                ...quizState,
                submitted: true,
                quizScore: scorePct,
              });
              onRefresh();
            }
          })
          .catch((err) => console.error("Error submitting mock quiz:", err));
      };

      reportQuizLocal();
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Zap":
        return <Zap className="w-5 h-5 text-amber-500" />;
      case "Cable":
        return <Cable className="w-5 h-5 text-emerald-500" />;
      case "CircleDot":
        return <CircleDot className="w-5 h-5 text-blue-500" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-5 h-5 text-purple-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div id="course-learning-view">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Course Learning & Interactive Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Professional development, code mastery tests, and real-time computation logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Metric Cards & Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Global Test Score
                </span>
                <Trophy className="w-4 h-4 text-amber-500 animate-pulse" />
              </div>
              <div className="text-3xl font-bold text-slate-850 dark:text-white">
                {analytics.overallScore || 0}%
              </div>
              <p className="text-2xs text-slate-400 mt-1">Average across all taken quizzes</p>
            </div>

            <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Calculations Conducted
              </span>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {analytics.calculationsRun}
              </div>
              <div className="progress-bar-wrap w-full mt-2">
                <div
                  className="progress-bar"
                  style={{ width: `${Math.min(analytics.calculationsRun * 10, 100)}%` }}
                ></div>
              </div>
              <p className="text-2xs text-slate-400 mt-1">Practice load runs: level up your skills</p>
            </div>

            <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Compliance Audits
              </span>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {analytics.checksRun}
              </div>
              <div className="progress-bar-wrap w-full mt-2">
                <div
                  className="progress-bar"
                  style={{ width: `${Math.min(analytics.checksRun * 15, 100)}%` }}
                ></div>
              </div>
              <p className="text-2xs text-slate-400 mt-1">Inspections based on 6 world regulations</p>
            </div>
          </div>

          {/* Graphical Analytics Dashboard */}
          <div className="bg-white dark:bg-slate-850 p-5 rounded-xl border border-slate-105 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Curriculum Mastery Progress
            </h3>

            <div className="space-y-4">
              {Object.entries(COURSE_DETAILS).map(([id, item]) => {
                const userCrs = analytics.courses[id] || { progress: 0, quizzesTaken: 0, avgScore: 0, completed: false };
                return (
                  <div key={id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        {getIcon(item.icon)}
                        {item.title}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {userCrs.progress}% {userCrs.completed && "🏆"}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-505 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${userCrs.progress}%` }}
                      ></div>
                    </div>
                    {userCrs.quizzesTaken > 0 && (
                      <div className="flex justify-between items-center text-3xs text-slate-400 mt-1 px-1">
                        <span>Quizzes Tested: {userCrs.quizzesTaken}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Avg Grade: {userCrs.avgScore}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Active Course Syllabus / Quizzing */}
        <div className="bg-white dark:bg-slate-850 p-5 rounded-xl border border-slate-105 dark:border-slate-800 shadow-xs h-full">
          {!selectedCourse ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 animate-bounce" />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Select a Course to test
                </h4>
                <p className="text-xs text-slate-400 max-w-[210px] mx-auto mt-1">
                  Ready to benchmark your knowledge? Click any item from the course list below.
                </p>
              </div>

              <div className="w-full space-y-2 pt-2">
                {Object.entries(COURSE_DETAILS).map(([id, item]) => (
                  <button
                    key={id}
                    onClick={() => startCourseQuiz(id)}
                    className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between transition group-hover"
                  >
                    <div className="flex items-center gap-2">
                      {getIcon(item.icon)}
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                        {item.title}
                      </span>
                    </div>
                    <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* Course Quiz State */}
              {(() => {
                const cDetail = COURSE_DETAILS[selectedCourse];
                const questions = cDetail.quizzes;
                const progressData = analytics.courses[selectedCourse] || { progress: 0, avgScore: 0 };

                if (!quizState) return null;

                const currentQ = questions[quizState.currentIndex];

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                          {cDetail.title}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          Question {quizState.currentIndex + 1} of {questions.length}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedCourse(null)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Exit
                      </button>
                    </div>

                    {!quizState.submitted ? (
                      <div className="space-y-4">
                        {/* Question Text */}
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                          {currentQ.question}
                        </p>

                        {/* Options */}
                        <div className="space-y-2">
                          {currentQ.options.map((opt, oIdx) => {
                            const isSelected = quizState.answers[quizState.currentIndex] === oIdx;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleSelectAnswer(oIdx)}
                                className={`w-full text-left text-xs p-2.5 rounded-lg border transition ${
                                  isSelected
                                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-medium"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex justify-between items-center pt-2">
                          <button
                            onClick={handlePrevQuestion}
                            disabled={quizState.currentIndex === 0}
                            className="text-2xs text-slate-500 disabled:opacity-40 cursor-pointer"
                          >
                            Back
                          </button>

                          {quizState.currentIndex === questions.length - 1 ? (
                            <button
                              onClick={() => submitQuiz(questions)}
                              disabled={quizState.answers[quizState.currentIndex] === undefined}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition"
                            >
                              Submit Quiz
                            </button>
                          ) : (
                            <button
                              onClick={() => handleNextQuestion(questions.length)}
                              disabled={quizState.answers[quizState.currentIndex] === undefined}
                              className="bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition"
                            >
                              Next
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 space-y-4">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-850 dark:text-white">
                            Quiz Completed!
                          </h4>
                          <p className="text-2xs text-slate-450">
                            Grade recorded to your cloud training profile.
                          </p>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/15 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800 inline-block">
                          <div className="text-2xs text-slate-500">Your Score</div>
                          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {quizState.quizScore}%
                          </div>
                        </div>

                        {/* Explanation block */}
                        <div className="text-left text-3xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded border border-slate-100 dark:border-slate-800 leading-relaxed">
                          <strong className="block text-slate-700 dark:text-slate-200 mb-1">
                            Core Knowledge Explanation:
                          </strong>
                          {questions[0].explanation}
                        </div>

                        <div className="flex justify-center gap-2 pt-2">
                          <button
                            onClick={() => startCourseQuiz(selectedCourse)}
                            className="btn-secondary text-xs px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Retake
                          </button>
                          <button
                            onClick={() => setSelectedCourse(null)}
                            className="bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 cursor-pointer transition"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
