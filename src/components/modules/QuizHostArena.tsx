import React, { useState, useEffect } from 'react';
import { QuizTournament, QuizQuestion, ClassRoom, Student } from '../../types';
import { quizAudio } from '../../utils/quizAudio';
import { QuizPodium } from './QuizPodium';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Timer,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Trophy,
  Users,
  Zap,
  Sparkles,
  Eye,
  X,
  Maximize2
} from 'lucide-react';

interface QuizHostArenaProps {
  quiz: QuizTournament;
  classes: ClassRoom[];
  students: Student[];
  teacherName?: string;
  onClose: () => void;
  onSubmitSimulatedScore: (
    quizId: string,
    studentId: string,
    studentName: string,
    classId: string,
    answers: { questionId: string; selected: number; isCorrect: boolean; timeSpent: number }[]
  ) => void;
  onAwardStars?: (awards: { studentId: string; classId: string; points: number; reason: string }[]) => void;
}

export const QuizHostArena: React.FC<QuizHostArenaProps> = ({
  quiz,
  classes,
  students,
  teacherName = 'Guru Geografi',
  onClose,
  onSubmitSimulatedScore,
  onAwardStars,
}) => {
  // Phase: 'intro_countdown' | 'question_active' | 'question_revealed' | 'podium'
  const [phase, setPhase] = useState<'intro_countdown' | 'question_active' | 'question_revealed' | 'podium'>('intro_countdown');
  const [countdownNumber, setCountdownNumber] = useState<number>(3);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(quiz.timePerQuestion || 20);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(quizAudio.getIsMuted());

  const currentQ: QuizQuestion | undefined = quiz.questions[questionIndex];

  // Eligible students for this quiz
  const targetStudents = students.filter((s) => {
    if (quiz.targetClassIds.includes('all')) return true;
    return quiz.targetClassIds.includes(s.classId);
  });

  // Toggle Mute / Sound
  const handleToggleSound = () => {
    const nextMute = quizAudio.toggleMute();
    setIsMuted(nextMute);
    if (!nextMute) {
      if (phase === 'question_active') {
        quizAudio.startQuestionMusic();
      } else if (phase === 'podium') {
        quizAudio.startVictoryMusic();
      } else {
        quizAudio.startLobbyMusic();
      }
    }
  };

  // 1. Initial 3-2-1 Countdown Effect
  useEffect(() => {
    if (phase !== 'intro_countdown') return;

    quizAudio.playCountdownBeep(false);

    const interval = setInterval(() => {
      setCountdownNumber((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          quizAudio.playCountdownBeep(true);
          // Transition to first question
          setTimeout(() => {
            setPhase('question_active');
            setTimeLeft(quiz.timePerQuestion || 20);
            quizAudio.startQuestionMusic();
          }, 600);
          return 0;
        }
        quizAudio.playCountdownBeep(false);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, quiz.timePerQuestion]);

  // 2. Active Question Timer Loop
  useEffect(() => {
    if (phase !== 'question_active' || isTimerPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up! Automatically reveal answer
          handleRevealAnswer();
          return 0;
        }

        // SFX for ticking and tension
        if (prev <= 5) {
          quizAudio.playTensionPulse();
        } else {
          quizAudio.playTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isTimerPaused, questionIndex]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      quizAudio.stopBgm();
    };
  }, []);

  const handleRevealAnswer = () => {
    setPhase('question_revealed');
    quizAudio.stopBgm();
    quizAudio.playCorrect();
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
  };

  const handleNextQuestion = () => {
    if (questionIndex + 1 < quiz.questions.length) {
      setQuestionIndex((prev) => prev + 1);
      setTimeLeft(quiz.timePerQuestion || 20);
      setPhase('question_active');
      quizAudio.startQuestionMusic();
    } else {
      // Finished all questions! Go to Podium!
      setPhase('podium');
    }
  };

  // Simulate responses from eligible classroom students
  const handleSimulateClassParticipation = () => {
    quizAudio.playClick();
    if (targetStudents.length === 0) return;

    // Pick 8 to 15 students or all eligible
    const numToSimulate = Math.min(targetStudents.length, 12);
    const shuffled = [...targetStudents].sort(() => 0.5 - Math.random());
    const selectedStudents = shuffled.slice(0, numToSimulate);

    selectedStudents.forEach((student) => {
      const answers = quiz.questions.map((q) => {
        // 75% probability of correct answer
        const isCorrect = Math.random() < 0.75;
        const selected = isCorrect ? q.correctIndex : (q.correctIndex + 1) % 4;
        const timeSpent = Math.max(3, Math.floor(Math.random() * (quiz.timePerQuestion - 2)));
        return {
          questionId: q.id,
          selected,
          isCorrect,
          timeSpent,
        };
      });

      onSubmitSimulatedScore(quiz.id, student.id, student.name, student.classId, answers);
    });

    confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
  };

  // If in podium mode, render the Podium Juara
  if (phase === 'podium') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto p-4 sm:p-8 animate-in fade-in">
        <div className="max-w-5xl mx-auto">
          <QuizPodium
            quiz={quiz}
            classes={classes}
            students={students}
            teacherName={teacherName}
            onClose={onClose}
            onAwardStars={onAwardStars}
          />
        </div>
      </div>
    );
  }

  // Option colors inspired by game shows (Kahoot/Jeopardy/Trivia)
  const optionTheme = [
    { bg: 'from-rose-600 to-rose-700', border: 'border-rose-500', badge: 'bg-rose-950 text-rose-300' },
    { bg: 'from-blue-600 to-blue-700', border: 'border-blue-500', badge: 'bg-blue-950 text-blue-300' },
    { bg: 'from-amber-600 to-amber-700', border: 'border-amber-500', badge: 'bg-amber-950 text-amber-300' },
    { bg: 'from-emerald-600 to-emerald-700', border: 'border-emerald-500', badge: 'bg-emerald-950 text-emerald-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 overflow-y-auto animate-in fade-in text-white">
      {/* 3-2-1 INTRO COUNTDOWN OVERLAY */}
      {phase === 'intro_countdown' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-in fade-in">
          <div className="text-center space-y-6">
            <span className="text-xs uppercase tracking-widest font-black text-rose-400 bg-rose-950/60 px-4 py-1.5 rounded-full border border-rose-500/40">
              TURNAMEN KUIS GEOGRAFI
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white">{quiz.title}</h1>
            <p className="text-slate-400 text-sm">Persiapkan diri! Pertandingan akan segera dimulai...</p>

            <div className="py-8">
              <span className="inline-block text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 animate-ping">
                {countdownNumber === 0 ? 'MULAI!' : countdownNumber}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Mode Layar Guru / Proyektor Kelas
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold">
                LIVE
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{quiz.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Mute/Unmute */}
          <button
            onClick={handleToggleSound}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              isMuted
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 hover:bg-indigo-600/50'
            }`}
            title="Nyalakan/Matikan Musik Kuis"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />}
            <span className="hidden sm:inline">{isMuted ? 'Mute' : 'Musik On'}</span>
          </button>

          {/* Pause / Resume Timer */}
          {phase === 'question_active' && (
            <button
              onClick={() => setIsTimerPaused(!isTimerPaused)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1.5 text-slate-200 transition"
            >
              {isTimerPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
              <span>{isTimerPaused ? 'Lanjutkan' : 'Jeda'}</span>
            </button>
          )}

          {/* Direct Podium Button */}
          <button
            onClick={() => setPhase('podium')}
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Podium Juara</span>
          </button>

          {/* Close Host Arena */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Keluar dari Arena"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* QUESTION MAIN STAGE */}
      {currentQ && (
        <div className="max-w-4xl mx-auto w-full my-auto py-4 space-y-6">
          {/* Question Status & Live Timer */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-slate-400">
              Soal {questionIndex + 1} dari {quiz.questions.length}
            </span>

            {/* Big Countdown Timer */}
            <div
              className={`flex items-center gap-2 px-5 py-2 rounded-2xl text-xl font-black font-mono transition-all duration-300 ${
                timeLeft <= 5
                  ? 'bg-rose-950 text-rose-300 border-2 border-rose-500 shadow-xl shadow-rose-950/60 animate-bounce'
                  : 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/50 shadow-lg'
              }`}
            >
              <Timer className="w-5 h-5" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Question Text Box (Big & Clear for Presentation) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <HelpCircle className="w-28 h-28" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-relaxed relative z-10">
              {currentQ.question}
            </h3>
          </div>

          {/* Multiple Choice Options (4 Big Colored Blocks) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQ.options.map((opt, optIdx) => {
              const theme = optionTheme[optIdx % optionTheme.length];
              const isCorrect = optIdx === currentQ.correctIndex;
              const isRevealed = phase === 'question_revealed';

              return (
                <div
                  key={optIdx}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    isRevealed
                      ? isCorrect
                        ? 'bg-emerald-950 border-emerald-400 shadow-xl shadow-emerald-950/60 scale-[1.02]'
                        : 'bg-slate-900/50 border-slate-800 opacity-40'
                      : `bg-gradient-to-r ${theme.bg} ${theme.border} shadow-lg hover:scale-[1.01]`
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
                      isRevealed && isCorrect
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-black/30 text-white'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="font-bold text-sm sm:text-base text-white flex-1">{opt}</span>
                  {isRevealed && isCorrect && (
                    <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 animate-bounce" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation Box when Revealed */}
          {phase === 'question_revealed' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm space-y-1 animate-in zoom-in-95">
              <span className="font-extrabold uppercase tracking-wider block text-emerald-400">
                💡 Kunci Jawaban & Pembahasan Konsep:
              </span>
              <p className="leading-relaxed">
                Jawaban Benar adalah{' '}
                <strong>
                  {String.fromCharCode(65 + currentQ.correctIndex)}. {currentQ.options[currentQ.correctIndex]}
                </strong>
                . {currentQ.explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM ACTION BAR */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Participants count & quick simulation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>
              <strong className="text-white">{quiz.participants.length}</strong> Siswa Bertanding
            </span>
          </div>

          <button
            onClick={handleSimulateClassParticipation}
            className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Simulasikan jawaban siswa sekelas agar papan peringkat terisi!"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Simulasi Skor Kelas</span>
          </button>
        </div>

        {/* Phase Buttons */}
        <div className="flex items-center gap-2">
          {phase === 'question_active' ? (
            <button
              onClick={handleRevealAnswer}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-950/40 transition"
            >
              <Eye className="w-4 h-4" />
              <span>Buka Kunci Jawaban</span>
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition"
            >
              <span>
                {questionIndex + 1 < quiz.questions.length ? 'Soal Berikutnya' : 'Selesai & Lihat Podium'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
