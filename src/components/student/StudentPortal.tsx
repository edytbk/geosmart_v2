import React, { useState, useEffect } from 'react';
import {
  Student,
  ClassRoom,
  MaterialItem,
  Assignment,
  Submission,
  QuizTournament,
  QuizQuestion
} from '../../types';
import { QuizPodium } from '../modules/QuizPodium';
import { quizAudio } from '../../utils/quizAudio';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  ClipboardList,
  Flame,
  Award,
  Star,
  CheckCircle,
  Clock,
  Send,
  Timer,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Trophy,
  LogIn,
  LogOut,
  Check,
  Play,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Crown,
  Volume2,
  VolumeX
} from 'lucide-react';

interface StudentPortalProps {
  classes: ClassRoom[];
  students: Student[];
  materials: MaterialItem[];
  assignments: Assignment[];
  submissions: Submission[];
  quizzes: QuizTournament[];
  onMarkMaterialRead: (materialId: string, studentId: string) => void;
  onSubmitAssignment: (submission: Omit<Submission, 'id' | 'submittedAt'>) => void;
  onSubmitQuizAnswers: (
    quizId: string,
    studentId: string,
    studentName: string,
    classId: string,
    answers: { questionId: string; selected: number; isCorrect: boolean; timeSpent: number }[]
  ) => void;
  onUpdateStudentPassword?: (studentId: string, newPassword: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  classes,
  students,
  materials,
  assignments,
  submissions,
  quizzes,
  onMarkMaterialRead,
  onSubmitAssignment,
  onSubmitQuizAnswers,
  onUpdateStudentPassword,
}) => {
  // Login / Selected Student State
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'materi' | 'tugas' | 'kuis' | 'nilai'>('materi');

  // Student Password State
  const [passwordInput, setPasswordInput] = useState('siswa123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Change Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showChangePasswordEyes, setShowChangePasswordEyes] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  // Assignment Doing State
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [assignmentAnswers, setAssignmentAnswers] = useState<Record<string, string>>({});
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Live Quiz Game State
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [quizTimeLeft, setQuizTimeLeft] = useState(20);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizAnswerLog, setQuizAnswerLog] = useState<
    { questionId: string; selected: number; isCorrect: boolean; timeSpent: number }[]
  >([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [viewingPodiumQuiz, setViewingPodiumQuiz] = useState<QuizTournament | null>(null);
  const [isQuizMuted, setIsQuizMuted] = useState(quizAudio.getIsMuted());

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const classStudents = students.filter((s) => s.classId === selectedClassId);
  const currentStudent = students.find((s) => s.id === selectedStudentId);

  // Materials for student's class
  const studentMaterials = materials.filter(
    (m) => m.targetClassIds.includes('all') || m.targetClassIds.includes(selectedClassId)
  );

  // Assignments for student's class
  const studentAssignments = assignments.filter(
    (a) => a.targetClassIds.includes('all') || a.targetClassIds.includes(selectedClassId)
  );

  // Quizzes for student's class
  const studentQuizzes = quizzes.filter(
    (q) => q.targetClassIds.includes('all') || q.targetClassIds.includes(selectedClassId)
  );

  // Handle student login with password
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !currentStudent) return;

    const expectedPassword = currentStudent.password || 'siswa123';
    if (passwordInput !== expectedPassword) {
      setLoginError('Password tidak sesuai. Password bawaan default adalah "siswa123". Jika Anda lupa password baru Anda, silakan minta guru Anda untuk mereset akun.');
      return;
    }

    setLoginError('');
    setIsLoggedIn(true);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (!currentStudent) return;
    const expectedPassword = currentStudent.password || 'siswa123';

    if (oldPasswordInput !== expectedPassword) {
      setChangePasswordError('Password lama Anda tidak cocok!');
      return;
    }

    if (!newPasswordInput || newPasswordInput.length < 4) {
      setChangePasswordError('Password baru minimal 4 karakter!');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordError('Konfirmasi password baru tidak cocok!');
      return;
    }

    if (onUpdateStudentPassword) {
      onUpdateStudentPassword(currentStudent.id, newPasswordInput);
    }

    setChangePasswordSuccess('Password berhasil diperbarui! Gunakan password baru ini saat masuk berikutnya.');
    setOldPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setTimeout(() => {
      setShowChangePasswordModal(false);
      setChangePasswordSuccess('');
    }, 2000);
  };

  // Timer effect for live quiz gameplay
  useEffect(() => {
    if (!activeQuizId || isQuizCompleted) return;

    const quiz = quizzes.find((q) => q.id === activeQuizId);
    if (!quiz) return;

    const timer = setInterval(() => {
      setQuizTimeLeft((prev) => {
        if (prev <= 4 && prev > 1) {
          quizAudio.playTick();
        }
        if (prev <= 1) {
          // Time expired for this question, auto advance
          quizAudio.playWrong();
          handleNextQuestion(-1, quiz);
          return quiz.timePerQuestion;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuizId, quizQuestionIndex, isQuizCompleted]);

  const handleStartQuiz = (quiz: QuizTournament) => {
    setActiveQuizId(quiz.id);
    setQuizQuestionIndex(0);
    setQuizTimeLeft(quiz.timePerQuestion);
    setQuizSelectedOption(null);
    setQuizAnswerLog([]);
    setIsQuizCompleted(false);
    setQuizScore(0);
    quizAudio.playCountdown();
    quizAudio.startBgm('student');
  };

  const handleNextQuestion = (chosenOpt: number, quiz: QuizTournament) => {
    const currentQ = quiz.questions[quizQuestionIndex];
    if (!currentQ) return;

    const isCorrect = chosenOpt === currentQ.correctIndex;
    const timeSpent = quiz.timePerQuestion - quizTimeLeft;

    if (isCorrect) {
      quizAudio.playCorrect();
    } else {
      quizAudio.playWrong();
    }

    const pointsGained = isCorrect ? currentQ.points + Math.max(0, quizTimeLeft * 2) : 0;

    const updatedLog = [
      ...quizAnswerLog,
      {
        questionId: currentQ.id,
        selected: chosenOpt,
        isCorrect,
        timeSpent,
      },
    ];

    setQuizAnswerLog(updatedLog);
    setQuizScore((prev) => prev + pointsGained);

    if (quizQuestionIndex + 1 < quiz.questions.length) {
      setQuizQuestionIndex((prev) => prev + 1);
      setQuizTimeLeft(quiz.timePerQuestion);
      setQuizSelectedOption(null);
    } else {
      // Quiz finished!
      setIsQuizCompleted(true);
      quizAudio.stopBgm();
      quizAudio.playFinish();
      if (currentStudent) {
        onSubmitQuizAnswers(
          quiz.id,
          currentStudent.id,
          currentStudent.name,
          currentStudent.classId,
          updatedLog
        );
      }
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleSubmitAssignmentAnswers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignmentId || !currentStudent) return;

    setSubmittingAssignment(true);
    onSubmitAssignment({
      assignmentId: activeAssignmentId,
      studentId: currentStudent.id,
      classId: currentStudent.classId,
      answers: assignmentAnswers,
    });

    setTimeout(() => {
      setSubmittingAssignment(false);
      setActiveAssignmentId(null);
      setAssignmentAnswers({});
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }, 400);
  };

  // If student hasn't logged in, show student selection login screen
  if (!isLoggedIn || !currentStudent) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <LogIn className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Selamat Datang di Portal Siswa</h2>
            <p className="text-xs text-slate-400">
              Pilih kelas dan nama Anda untuk mengakses materi pembelajaran, penilaian tugas geografi, dan turnamen kuis.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pilih Kelas Anda
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentId('');
                  setLoginError('');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Tingkat {cls.grade})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pilih Nama Siswa
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setLoginError('');
                }}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Pilih Nama Anda --</option>
                {classStudents.map((std) => (
                  <option key={std.id} value={std.id}>
                    {std.name} ({std.gender === 'L' ? 'L' : 'P'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password Akun Siswa *
                </label>
                <span className="text-[10px] text-emerald-400 font-medium">Default: siswa123</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  required
                  placeholder="Masukkan password akun Anda..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-500 flex-shrink-0" />
                <span>Password default adalah <strong>siswa123</strong>. Siswa dapat mengganti password setelah masuk.</span>
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-200">{loginError}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Jika Anda lupa password, hubungi Guru Anda untuk mereset akun ke default.</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedStudentId || !passwordInput}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950 transition flex items-center justify-center gap-2"
            >
              <span>Masuk ke Kelas</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active Live Quiz Interface
  if (activeQuizId) {
    const quiz = quizzes.find((q) => q.id === activeQuizId);
    if (!quiz) return null;

    if (isQuizCompleted) {
      return (
        <div className="max-w-lg mx-auto py-12 px-4 animate-in zoom-in-95">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/20">
              🏆
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Turnamen Selesai!</h2>
              <p className="text-xs text-slate-400 mt-1">Kerja keras yang luar biasa, {currentStudent.name}!</p>
            </div>

            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400">Total Skor Akhir Anda</span>
              <div className="text-4xl font-black text-amber-400 font-mono">{quizScore}</div>
              <p className="text-xs text-emerald-400 font-semibold">
                {quizAnswerLog.filter((a) => a.isCorrect).length} dari {quiz.questions.length} Soal Benar
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  quizAudio.stopBgm();
                  setViewingPodiumQuiz(quiz);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Trophy className="w-4 h-4" />
                <span>Lihat Podium Juara</span>
              </button>
              <button
                onClick={() => {
                  quizAudio.stopBgm();
                  setActiveQuizId(null);
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
              >
                Kembali ke Menu
              </button>
            </div>
          </div>
        </div>
      );
    }

    const currentQ = quiz.questions[quizQuestionIndex];

    return (
      <div className="max-w-xl mx-auto py-8 px-4 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          {/* Header Quiz Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              Soal {quizQuestionIndex + 1} dari {quiz.questions.length}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const muted = quizAudio.toggleMute();
                  setIsQuizMuted(muted);
                }}
                className={`p-1.5 rounded-lg border text-xs font-medium transition ${
                  isQuizMuted
                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
                title={isQuizMuted ? 'Nyalakan Audio' : 'Matikan Audio'}
              >
                {isQuizMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Countdown Timer with warning color */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono transition-colors ${
                  quizTimeLeft <= 5
                    ? 'bg-rose-950 text-rose-400 border border-rose-500 animate-pulse'
                    : 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{quizTimeLeft}s</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 transition-all duration-300"
              style={{
                width: `${((quizQuestionIndex + 1) / quiz.questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Text */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80">
            <h3 className="text-base font-bold text-white leading-relaxed">{currentQ.question}</h3>
          </div>

          {/* Options ABCD */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuizSelectedOption(idx);
                  handleNextQuestion(idx, quiz);
                }}
                className="w-full p-4 rounded-xl border bg-slate-800/80 hover:bg-indigo-600/30 border-slate-700 hover:border-indigo-500 text-left text-xs font-semibold text-white transition flex items-center gap-3 group"
              >
                <span className="w-6 h-6 rounded-lg bg-slate-900 group-hover:bg-indigo-500 text-slate-300 group-hover:text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
            <span>Poin: {currentQ.points} + Kecepatan</span>
            <button
              onClick={() => {
                if (confirm('Yakin ingin keluar dari kuis?')) setActiveQuizId(null);
              }}
              className="text-slate-400 hover:text-rose-400"
            >
              Keluar Kuis
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Student Main View
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Student Profile Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
            {currentStudent.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{currentStudent.name}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                {currentClass?.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">NISN: {currentStudent.nisn}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-amber-500/30">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <div>
              <span className="text-xs font-bold text-amber-300 font-mono">
                {currentStudent.points} Bintang
              </span>
              <span className="text-[10px] text-slate-400 block">Poin Keaktifan Anda</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setChangePasswordError('');
                setChangePasswordSuccess('');
                setShowChangePasswordModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
              title="Ganti Password Akun Anda"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Ganti Password</span>
            </button>

            <button
              onClick={() => {
                setIsLoggedIn(false);
                setPasswordInput('siswa123');
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Keluar / Ganti Siswa"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Badges Earned */}
      {currentStudent.badges.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            Lencana Saya:
          </span>
          {currentStudent.badges.map((b, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 whitespace-nowrap shadow-sm"
            >
              🎖️ {b}
            </span>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 sm:gap-6 text-xs font-semibold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('materi')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'materi'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Materi Pelajaran ({studentMaterials.length})
        </button>

        <button
          onClick={() => setActiveTab('tugas')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tugas'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Tugas Aktif ({studentAssignments.length})
        </button>

        <button
          onClick={() => setActiveTab('kuis')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'kuis'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-500" />
          Turnamen Kuis ({studentQuizzes.length})
        </button>

        <button
          onClick={() => setActiveTab('nilai')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'nilai'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Rapor Nilai Saya
        </button>
      </div>

      {/* TAB 1: MATERI */}
      {activeTab === 'materi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentMaterials.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center col-span-2">
              Belum ada materi untuk kelas Anda saat ini.
            </p>
          ) : (
            studentMaterials.map((mat) => {
              const isRead = mat.completedByStudentIds.includes(currentStudent.id);
              return (
                <div
                  key={mat.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded">
                        {mat.chapter}
                      </span>
                      {isRead && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">
                          <CheckCircle className="w-3 h-3" />
                          Sudah Dipelajari
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-white text-base">{mat.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line line-clamp-4">
                      {mat.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    {mat.url ? (
                      <a
                        href={mat.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>Buka Lampiran/Video</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-500">Teks modul</span>
                    )}

                    <button
                      onClick={() => onMarkMaterialRead(mat.id, currentStudent.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                        isRead
                          ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isRead ? 'Tandai Ulang' : 'Tandai Selesai'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: TUGAS */}
      {activeTab === 'tugas' && (
        <div className="space-y-4">
          {studentAssignments.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              Tidak ada tugas aktif untuk kelas Anda saat ini.
            </p>
          ) : (
            studentAssignments.map((asg) => {
              const submission = submissions.find(
                (s) => s.assignmentId === asg.id && s.studentId === currentStudent.id
              );
              const isSubmitted = !!submission;
              const isGraded = submission?.score !== undefined;
              const isDoingThis = activeAssignmentId === asg.id;

              return (
                <div
                  key={asg.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300">
                          {asg.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          Batas: {new Date(asg.dueDate).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base">{asg.title}</h3>
                      <p className="text-xs text-slate-300 mt-1">{asg.instructions}</p>
                    </div>

                    <div className="self-end sm:self-auto text-right">
                      {isGraded ? (
                        <div className="bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Nilai Guru</span>
                          <span className="text-lg font-black text-emerald-400 font-mono">
                            {submission.score} / 100
                          </span>
                        </div>
                      ) : isSubmitted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                          <Clock className="w-3.5 h-3.5" />
                          Menunggu Dinilai
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveAssignmentId(isDoingThis ? null : asg.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
                        >
                          {isDoingThis ? 'Tutup Pengerjaan' : 'Kerjakan Sekarang'}
                        </button>
                      )}
                    </div>
                  </div>

                  {submission?.feedback && (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                      <span className="font-bold text-indigo-400 block mb-0.5">Umpan Balik Guru:</span>
                      <p className="italic">"{submission.feedback}"</p>
                    </div>
                  )}

                  {/* Form doing assignment */}
                  {isDoingThis && !isSubmitted && (
                    <form
                      onSubmit={handleSubmitAssignmentAnswers}
                      className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 pt-4 mt-2"
                    >
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Lembar Jawaban Siswa
                      </h4>

                      {asg.questions.map((q, idx) => (
                        <div key={q.id} className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-200">
                            {idx + 1}. {q.question} ({q.points} Poin)
                          </label>

                          {q.type === 'pg' && q.options ? (
                            <div className="space-y-1.5">
                              {q.options.map((opt, optIdx) => (
                                <label
                                  key={optIdx}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 cursor-pointer hover:bg-slate-850"
                                >
                                  <input
                                    type="radio"
                                    name={`ans-${q.id}`}
                                    value={optIdx}
                                    checked={assignmentAnswers[q.id] === String(optIdx)}
                                    onChange={(e) =>
                                      setAssignmentAnswers({
                                        ...assignmentAnswers,
                                        [q.id]: e.target.value,
                                      })
                                    }
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <textarea
                              rows={3}
                              placeholder="Tuliskan langkah perhitungan dan jawaban Anda di sini..."
                              value={assignmentAnswers[q.id] || ''}
                              onChange={(e) =>
                                setAssignmentAnswers({
                                  ...assignmentAnswers,
                                  [q.id]: e.target.value,
                                })
                              }
                              required
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                            />
                          )}
                        </div>
                      ))}

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveAssignmentId(null)}
                          className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={submittingAssignment}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim Jawaban Tugas</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: TURNAMEN KUIS */}
      {activeTab === 'kuis' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentQuizzes.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center col-span-2">
              Belum ada turnamen kuis aktif.
            </p>
          ) : (
            studentQuizzes.map((qz) => {
              const myParticipantRecord = qz.participants.find(
                (p) => p.studentId === currentStudent.id
              );
              const alreadyPlayed = !!myParticipantRecord;

              return (
                <div
                  key={qz.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded">
                        {qz.isInterClass ? 'Duel Antar Kelas' : 'Kuis Kelas'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {qz.timePerQuestion}s / soal
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base">{qz.title}</h3>
                    <p className="text-xs text-slate-300">Topik: {qz.topic}</p>
                    <p className="text-xs text-slate-400">
                      {qz.questions.length} butir soal • {qz.participants.length} siswa bertanding
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    {alreadyPlayed ? (
                      <div>
                        <span className="text-[10px] text-slate-400 block">Skor Kuis Anda:</span>
                        <span className="text-base font-black text-amber-400 font-mono">
                          {myParticipantRecord.score} Poin
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-emerald-400 font-medium">Siap Dimainkan</span>
                    )}

                    <div className="flex items-center gap-2">
                      {qz.participants.length > 0 && (
                        <button
                          onClick={() => setViewingPodiumQuiz(qz)}
                          className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          title="Lihat Panggung Juara"
                        >
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>Podium</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleStartQuiz(qz)}
                        className="px-4 py-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{alreadyPlayed ? 'Main Ulang' : 'Mulai Turnamen'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 4: RAPOR NILAI SAYA */}
      {activeTab === 'nilai' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-base">Rekap Nilai Siswa</h3>
              <p className="text-xs text-slate-400">
                Transparansi capaian tugas dan ulangan harian Anda di mata pelajaran ini.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {studentAssignments.map((asg) => {
              const sub = submissions.find(
                (s) => s.assignmentId === asg.id && s.studentId === currentStudent.id
              );

              return (
                <div
                  key={asg.id}
                  className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 mr-2">
                      {asg.category}
                    </span>
                    <span className="font-semibold text-white">{asg.title}</span>
                    {sub?.feedback && (
                      <p className="text-[11px] text-slate-400 italic mt-1">
                        Catatan: "{sub.feedback}"
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    {sub && sub.score !== undefined ? (
                      <span className="text-base font-bold text-emerald-400 font-mono">
                        {sub.score} / 100
                      </span>
                    ) : (
                      <span className="text-slate-500">Belum Dinilai</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Ganti Password Siswa */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                Ganti Password Siswa
              </h3>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {changePasswordSuccess ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-emerald-200">{changePasswordSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password Saat Ini (Lama) *
                  </label>
                  <input
                    type={showChangePasswordEyes ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password saat ini (default: siswa123)"
                    value={oldPasswordInput}
                    onChange={(e) => setOldPasswordInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password Baru *
                  </label>
                  <input
                    type={showChangePasswordEyes ? 'text' : 'password'}
                    required
                    minLength={4}
                    placeholder="Minimal 4 karakter..."
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ulangi Password Baru *
                  </label>
                  <input
                    type={showChangePasswordEyes ? 'text' : 'password'}
                    required
                    minLength={4}
                    placeholder="Ketik ulang password baru..."
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showChangePasswordEyes}
                      onChange={(e) => setShowChangePasswordEyes(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                    />
                    <span>Lihat Password</span>
                  </label>
                </div>

                {changePasswordError && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span>{changePasswordError}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition"
                  >
                    Simpan Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL PODIUM JUARA TURNAMEN */}
      {viewingPodiumQuiz && (
        <QuizPodium
          quiz={viewingPodiumQuiz}
          classes={classes}
          currentStudentId={currentStudent?.id}
          onClose={() => setViewingPodiumQuiz(null)}
        />
      )}
    </div>
  );
};
