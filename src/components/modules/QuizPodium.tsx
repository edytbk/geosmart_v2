import React, { useEffect, useState } from 'react';
import { QuizTournament, ClassRoom, Student } from '../../types';
import { quizAudio } from '../../utils/quizAudio';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Medal,
  Crown,
  Sparkles,
  Volume2,
  VolumeX,
  Star,
  Printer,
  ChevronDown,
  CheckCircle,
  Share2,
  X,
  RotateCcw
} from 'lucide-react';

interface QuizPodiumProps {
  quiz: QuizTournament;
  classes: ClassRoom[];
  students?: Student[];
  currentStudentId?: string;
  teacherName?: string;
  onClose?: () => void;
  onAwardStars?: (awards: { studentId: string; classId: string; points: number; reason: string }[]) => void;
}

export const QuizPodium: React.FC<QuizPodiumProps> = ({
  quiz,
  classes,
  students = [],
  currentStudentId,
  teacherName = 'Guru Geografi',
  onClose,
  onAwardStars,
}) => {
  const [isMuted, setIsMuted] = useState(quizAudio.getIsMuted());
  const [awarded, setAwarded] = useState(false);
  const [selectedCertificateStudent, setSelectedCertificateStudent] = useState<{
    rank: number;
    name: string;
    className: string;
    score: number;
    correctCount: number;
  } | null>(null);

  // Sort participants by score descending, then by time taken ascending
  const sortedParticipants = [...quiz.participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeTakenTotal - b.timeTakenTotal;
  });

  const firstPlace = sortedParticipants[0];
  const secondPlace = sortedParticipants[1];
  const thirdPlace = sortedParticipants[2];
  const restPlaces = sortedParticipants.slice(3, 10);

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || 'Kelas Siswa';
  };

  const getClassColor = (classId: string) => {
    return classes.find((c) => c.id === classId)?.color || '#6366f1';
  };

  // Trigger celebration on mount
  useEffect(() => {
    // Play harmonious celebration fanfare & start celebration groove
    quizAudio.startCelebrationMusic();

    // Multistage confetti burst
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#f59e0b', '#ec4899', '#6366f1', '#10b981', '#38bdf8'];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    return () => {
      quizAudio.stopBgm();
    };
  }, []);

  const handleToggleSound = () => {
    const nextMute = quizAudio.toggleMute();
    setIsMuted(nextMute);
    if (!nextMute) {
      quizAudio.startCelebrationMusic();
    }
  };

  const handleConfetti = () => {
    quizAudio.playConfettiSparkle();
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
    });
  };

  const handleReplayFanfare = () => {
    quizAudio.startCelebrationMusic();
    handleConfetti();
  };

  const handleGiveStarsToWinners = () => {
    if (awarded || !onAwardStars) return;

    const awards: { studentId: string; classId: string; points: number; reason: string }[] = [];
    if (firstPlace) {
      awards.push({
        studentId: firstPlace.studentId,
        classId: firstPlace.classId,
        points: 5,
        reason: `Juara 1 Turnamen Kuis: ${quiz.title}`,
      });
    }
    if (secondPlace) {
      awards.push({
        studentId: secondPlace.studentId,
        classId: secondPlace.classId,
        points: 3,
        reason: `Juara 2 Turnamen Kuis: ${quiz.title}`,
      });
    }
    if (thirdPlace) {
      awards.push({
        studentId: thirdPlace.studentId,
        classId: thirdPlace.classId,
        points: 2,
        reason: `Juara 3 Turnamen Kuis: ${quiz.title}`,
      });
    }

    onAwardStars(awards);
    setAwarded(true);
    quizAudio.playCorrect();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-8">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-900 border-2 border-amber-500/40 p-6 shadow-2xl shadow-amber-950/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 -ml-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
              <span>Podium Kejuaraan Kuis</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{quiz.title}</span>
            </h2>
            <p className="text-xs text-slate-300">
              Topik: <span className="text-amber-300 font-semibold">{quiz.topic}</span> • Total{' '}
              <span className="text-white font-bold">{quiz.participants.length} Siswa</span> Telah Bertanding
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleSound}
              className={`p-2.5 rounded-2xl border transition flex items-center gap-2 text-xs font-semibold ${
                isMuted
                  ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  : 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 hover:bg-indigo-600/50'
              }`}
              title={isMuted ? 'Nyalakan Musik & SFX' : 'Mute Musik'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />}
              <span className="hidden sm:inline">{isMuted ? 'Suara Mati' : 'Musik Aktif'}</span>
            </button>

            <button
              onClick={handleReplayFanfare}
              className="px-3.5 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Musik Selebrasi 🎵</span>
            </button>

            <button
              onClick={handleConfetti}
              className="px-3.5 py-2.5 rounded-2xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <span>🎉 Confetti</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                title="Tutup Podium"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3D Olympic Champion Podium */}
      {sortedParticipants.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-slate-900/60 rounded-3xl border border-slate-800">
          <Trophy className="w-16 h-16 mx-auto text-slate-700 mb-3" />
          <p className="text-base font-semibold text-slate-300">Belum Ada Peserta Turnamen</p>
          <p className="text-xs text-slate-500 mt-1">
            Peserta dapat bermain melalui Portal Siswa atau jalankan simulasi live pertandingan di bawah.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Podium Pedestals Grid */}
          <div className="pt-12 px-2 max-w-4xl mx-auto">
            <div className="flex items-end justify-center gap-3 sm:gap-6 min-h-[380px]">
              {/* JUARA 2 (PERAK) - LEFT */}
              <div className="flex-1 max-w-[240px] flex flex-col items-center">
                {secondPlace ? (
                  <div className="w-full flex flex-col items-center space-y-2 mb-3">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-400 p-0.5 shadow-xl shadow-slate-500/20">
                        <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-slate-200 text-2xl font-black">
                          {secondPlace.studentName.charAt(0)}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-300 text-slate-900 border-2 border-slate-900 flex items-center justify-center font-black text-xs shadow-md">
                        2
                      </div>
                    </div>

                    <div className="text-center w-full px-1">
                      <p className="text-xs sm:text-sm font-bold text-white truncate" title={secondPlace.studentName}>
                        {secondPlace.studentName}
                      </p>
                      <span
                        className="inline-block text-[10px] px-2 py-0.5 rounded font-semibold mt-0.5 truncate max-w-full"
                        style={{
                          backgroundColor: `${getClassColor(secondPlace.classId)}25`,
                          color: getClassColor(secondPlace.classId),
                        }}
                      >
                        {getClassName(secondPlace.classId)}
                      </span>
                      <div className="mt-1">
                        <span className="text-base sm:text-lg font-black text-slate-200 font-mono">
                          {secondPlace.score}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">Pts</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {secondPlace.correctCount}/{quiz.questions.length} Benar • {secondPlace.timeTakenTotal}s
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedCertificateStudent({
                          rank: 2,
                          name: secondPlace.studentName,
                          className: getClassName(secondPlace.classId),
                          score: secondPlace.score,
                          correctCount: secondPlace.correctCount,
                        })
                      }
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 underline"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Cetak Piagam</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-slate-600 text-xs mb-4">Belum ada</div>
                )}

                {/* Pedestal 2 */}
                <div className="w-full h-44 sm:h-52 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-t-4 border-slate-400 rounded-t-2xl shadow-2xl flex flex-col items-center justify-start pt-4 relative overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-slate-300/20 text-slate-200 flex items-center justify-center mb-1">
                    <Medal className="w-6 h-6 text-slate-300" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-300 font-mono">#2</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">JUARA PERAK</span>
                  <span className="text-[11px] font-bold text-amber-300 mt-2 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    +3 ⭐ Bintang
                  </span>
                </div>
              </div>

              {/* JUARA 1 (EMAS) - CENTER & TALLEST */}
              <div className="flex-1 max-w-[260px] flex flex-col items-center z-10">
                {firstPlace ? (
                  <div className="w-full flex flex-col items-center space-y-2 mb-3">
                    <div className="relative">
                      {/* Golden Crown */}
                      <Crown className="w-9 h-9 text-amber-400 fill-amber-400 absolute -top-7 left-1/2 -translate-x-1/2 animate-bounce drop-shadow-[0_4px_8px_rgba(245,158,11,0.5)]" />
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 p-1 shadow-2xl shadow-amber-500/40 ring-4 ring-amber-500/30">
                        <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-amber-400 text-3xl font-black">
                          {firstPlace.studentName.charAt(0)}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 border-2 border-slate-900 flex items-center justify-center font-black text-sm shadow-lg shadow-amber-500/50">
                        1
                      </div>
                    </div>

                    <div className="text-center w-full px-1">
                      <div className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-0.5">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span>KAMPION UTAMA</span>
                      </div>
                      <p className="text-sm sm:text-base font-black text-white truncate" title={firstPlace.studentName}>
                        {firstPlace.studentName}
                      </p>
                      <span
                        className="inline-block text-[11px] px-2.5 py-0.5 rounded font-bold mt-0.5 truncate max-w-full"
                        style={{
                          backgroundColor: `${getClassColor(firstPlace.classId)}30`,
                          color: getClassColor(firstPlace.classId),
                        }}
                      >
                        {getClassName(firstPlace.classId)}
                      </span>
                      <div className="mt-1">
                        <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                          {firstPlace.score}
                        </span>
                        <span className="text-xs text-amber-300 font-bold ml-1">Pts</span>
                      </div>
                      <p className="text-[11px] text-emerald-400 font-medium">
                        {firstPlace.correctCount}/{quiz.questions.length} Benar • Waktu: {firstPlace.timeTakenTotal}s
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedCertificateStudent({
                          rank: 1,
                          name: firstPlace.studentName,
                          className: getClassName(firstPlace.classId),
                          score: firstPlace.score,
                          correctCount: firstPlace.correctCount,
                        })
                      }
                      className="text-xs text-amber-300 hover:text-white flex items-center gap-1 font-bold underline"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Piagam Kampiun</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-slate-600 text-xs mb-4">Belum ada</div>
                )}

                {/* Pedestal 1 */}
                <div className="w-full h-56 sm:h-64 bg-gradient-to-b from-amber-600 via-amber-700 to-slate-900 border-t-4 border-yellow-300 rounded-t-3xl shadow-2xl flex flex-col items-center justify-start pt-5 relative overflow-hidden ring-2 ring-amber-500/20">
                  <div className="w-12 h-12 rounded-full bg-amber-400/30 text-amber-200 flex items-center justify-center mb-1 shadow-inner">
                    <Trophy className="w-7 h-7 text-yellow-300 fill-amber-300" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-black text-yellow-300 font-mono">#1</span>
                  <span className="text-xs uppercase font-black tracking-wider text-amber-200">JUARA EMAS</span>
                  <span className="text-xs font-black text-yellow-300 mt-2 bg-yellow-400/30 px-3 py-1 rounded-full border border-yellow-400/50 shadow-md">
                    +5 ⭐ Bintang
                  </span>
                </div>
              </div>

              {/* JUARA 3 (PERUNGGU) - RIGHT */}
              <div className="flex-1 max-w-[240px] flex flex-col items-center">
                {thirdPlace ? (
                  <div className="w-full flex flex-col items-center space-y-2 mb-3">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-700 via-orange-500 to-amber-800 p-0.5 shadow-xl shadow-amber-900/30">
                        <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-amber-200 text-2xl font-black">
                          {thirdPlace.studentName.charAt(0)}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-700 text-amber-100 border-2 border-slate-900 flex items-center justify-center font-black text-xs shadow-md">
                        3
                      </div>
                    </div>

                    <div className="text-center w-full px-1">
                      <p className="text-xs sm:text-sm font-bold text-white truncate" title={thirdPlace.studentName}>
                        {thirdPlace.studentName}
                      </p>
                      <span
                        className="inline-block text-[10px] px-2 py-0.5 rounded font-semibold mt-0.5 truncate max-w-full"
                        style={{
                          backgroundColor: `${getClassColor(thirdPlace.classId)}25`,
                          color: getClassColor(thirdPlace.classId),
                        }}
                      >
                        {getClassName(thirdPlace.classId)}
                      </span>
                      <div className="mt-1">
                        <span className="text-base sm:text-lg font-black text-amber-500 font-mono">
                          {thirdPlace.score}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">Pts</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {thirdPlace.correctCount}/{quiz.questions.length} Benar • {thirdPlace.timeTakenTotal}s
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setSelectedCertificateStudent({
                          rank: 3,
                          name: thirdPlace.studentName,
                          className: getClassName(thirdPlace.classId),
                          score: thirdPlace.score,
                          correctCount: thirdPlace.correctCount,
                        })
                      }
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 underline"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Piagam</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-slate-600 text-xs mb-4">Belum ada</div>
                )}

                {/* Pedestal 3 */}
                <div className="w-full h-36 sm:h-44 bg-gradient-to-b from-amber-800 via-amber-900 to-slate-900 border-t-4 border-amber-600 rounded-t-2xl shadow-2xl flex flex-col items-center justify-start pt-4 relative overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-amber-600/30 text-amber-300 flex items-center justify-center mb-1">
                    <Medal className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">#3</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                    JUARA PERUNGGU
                  </span>
                  <span className="text-[11px] font-bold text-amber-300 mt-2 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    +2 ⭐ Bintang
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Action: Award Bintang Points Directly to Champions */}
          {onAwardStars && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-4xl mx-auto shadow-xl">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Apresiasi Poin Bintang Otomatis untuk Juara</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Berikan Bintang Keaktifan langsung ke profil siswa: Juara 1 (+5⭐), Juara 2 (+3⭐), Juara 3 (+2⭐).
                </p>
              </div>

              <button
                onClick={handleGiveStarsToWinners}
                disabled={awarded}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  awarded
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 cursor-default'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-950/40'
                }`}
              >
                {awarded ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Bintang Juara Berhasil Diberikan!</span>
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 fill-slate-950" />
                    <span>Hadiahi Bintang Sekarang</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Honorable Mentions (Peringkat 4 - 10) */}
          {restPlaces.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 max-w-4xl mx-auto space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Medal className="w-4 h-4 text-indigo-400" />
                  <span>Peringkat 4 Sampai 10 (Honorable Mentions)</span>
                </h4>
                <span className="text-xs text-slate-400">{restPlaces.length} Siswa</span>
              </div>

              <div className="space-y-2">
                {restPlaces.map((p, idx) => {
                  const rank = idx + 4;
                  return (
                    <div
                      key={p.studentId}
                      className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs font-mono">
                          #{rank}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{p.studentName}</span>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded font-semibold"
                              style={{
                                backgroundColor: `${getClassColor(p.classId)}20`,
                                color: getClassColor(p.classId),
                              }}
                            >
                              {getClassName(p.classId)}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {p.correctCount}/{quiz.questions.length} Benar • Waktu: {p.timeTakenTotal} detik
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-slate-200 font-mono">{p.score} Pts</span>
                        <button
                          onClick={() =>
                            setSelectedCertificateStudent({
                              rank,
                              name: p.studentName,
                              className: getClassName(p.classId),
                              score: p.score,
                              correctCount: p.correctCount,
                            })
                          }
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
                          title="Cetak Sertifikat Partisipasi"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Certificate Modal / Printable View */}
      {selectedCertificateStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <span>Piagam Penghargaan Turnamen Kuis</span>
              </h3>
              <button
                onClick={() => setSelectedCertificateStudent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Canvas Box (Printable Area) */}
            <div
              id="printable-certificate"
              className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-100/90 text-slate-900 border-8 border-amber-600/70 shadow-inner text-center space-y-4 my-2"
            >
              <div className="flex justify-center mb-1">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-600 flex items-center justify-center text-amber-700">
                  <Trophy className="w-6 h-6 fill-amber-500" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-800">
                  PIAGAM PENGHARGAAN JUARA
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                  TURNAMEN CERDAS GEOGRAFI
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">Topik: {quiz.topic}</p>
              </div>

              <div className="py-2 border-y border-amber-300">
                <p className="text-xs text-slate-600 italic">Diberikan dengan bangga kepada:</p>
                <h3 className="text-2xl font-black text-amber-900 mt-1 uppercase tracking-wide">
                  {selectedCertificateStudent.name}
                </h3>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {selectedCertificateStudent.className}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-700">
                  Atas prestasi gemilang sebagai:{' '}
                  <strong className="text-amber-800 font-black text-sm">
                    {selectedCertificateStudent.rank === 1
                      ? 'JUARA 1 (EMAS)'
                      : selectedCertificateStudent.rank === 2
                      ? 'JUARA 2 (PERAK)'
                      : selectedCertificateStudent.rank === 3
                      ? 'JUARA 3 (PERUNGGU)'
                      : `PERINGKAT #${selectedCertificateStudent.rank}`}
                  </strong>
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Total Perolehan: <strong>{selectedCertificateStudent.score} Poin</strong> ({selectedCertificateStudent.correctCount} Soal Terjawab Benar)
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between text-xs text-slate-700 border-t border-amber-200">
                <div className="text-left">
                  <span className="block text-[10px] text-slate-500">Tanggal:</span>
                  <span className="font-semibold">{new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-500">Guru Pembimbing:</span>
                  <span className="font-bold underline text-slate-900">{teacherName}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setSelectedCertificateStudent(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Piagam / PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
