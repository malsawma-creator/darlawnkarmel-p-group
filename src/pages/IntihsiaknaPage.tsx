import React, { useState, useEffect } from 'react';
import { Member, Competition, Submission, BookReview, BookChallengeConfig, isOBRole, isDeveloperUser } from '../types';
import { Storage } from '../utils/storage';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Plus,
  Upload,
  Heart,
  Star,
  Award,
  Calendar,
  X,
  FileText,
  Sparkles,
  BookOpen,
  Gift,
  ThumbsUp,
  User,
  CheckCircle2,
  Edit2,
  Trash2,
  Maximize2,
  Sliders,
  Settings,
} from 'lucide-react';
import { PhotoLightbox, LightboxPhoto } from '../components/PhotoLightbox';

interface IntihsiaknaPageProps {
  currentUser: Member | null;
  onOpenLogin: () => void;
  onDataChanged: () => void;
  dataVersion?: number;
}

type MainTab = 'contests' | 'reading';

export const IntihsiaknaPage: React.FC<IntihsiaknaPageProps> = ({
  currentUser,
  onOpenLogin,
  onDataChanged,
}) => {
  // Persistent mainTab: reading vs contests (remembers tab across data changes)
  const [mainTab, setMainTabState] = useState<MainTab>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#reading' || hash === '#book-reading') return 'reading';
      if (hash === '#contests') return 'contests';
      const saved = sessionStorage.getItem('kpg_intihsiakna_tab');
      if (saved === 'reading' || saved === 'contests') return saved as MainTab;
    }
    return 'contests';
  });

  const setMainTab = (tab: MainTab) => {
    setMainTabState(tab);
    try {
      sessionStorage.setItem('kpg_intihsiakna_tab', tab);
      if (typeof window !== 'undefined') {
        window.location.hash = tab === 'reading' ? 'reading' : 'contests';
      }
    } catch {}
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#reading' || hash === '#book-reading') {
        setMainTabState('reading');
      } else if (hash === '#contests') {
        setMainTabState('contests');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // --- GENERAL COMPETITIONS DATA ---
  const competitions = Storage.getCompetitions();
  const [selectedCompId, setSelectedCompId] = useState<string>(
    competitions[0]?.id || ''
  );
  const isOB = (currentUser && isOBRole(currentUser.role)) || isDeveloperUser(currentUser);
  const activeComp = competitions.find((c) => c.id === selectedCompId) || competitions[0];
  const submissions = activeComp ? Storage.getSubmissions(activeComp.id) : [];

  // --- KARMEL AI CHAT AGENT STATES ---
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; text: string; actionData?: any; actionType?: string }>>([
    {
      role: 'model',
      text: 'Chibai! Kei hi Karmel AI ka ni a. Intihsiakna leh Quiz hrang hrang siam tur te, modify tur te, zawhna belh turin min rawn rawh le. Eng nge kan buatsaih dawn tul?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatSending) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    
    const newMessages = [...chatMessages, { role: 'user' as const, text: userMsg }];
    setChatMessages(newMessages);
    setIsChatSending(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.text })),
          activeCompetition: activeComp || null
        }),
      });
      const data = await response.json();
      if (response.ok) {
        let replyText = data.reply || '';
        let extractedActionData = null;
        let extractedActionType = null;

        const createMatch = replyText.match(/\[ACTION:CREATE_QUIZ\]([\s\S]*?)\[\/ACTION\]/);
        const updateMatch = replyText.match(/\[ACTION:UPDATE_COMPETITION\]([\s\S]*?)\[\/ACTION\]/);

        if (createMatch) {
          extractedActionType = 'CREATE_QUIZ';
          try {
            extractedActionData = JSON.parse(createMatch[1].trim());
          } catch {}
          replyText = replyText.replace(/\[ACTION:CREATE_QUIZ\][\s\S]*?\[\/ACTION\]/, '').trim();
        } else if (updateMatch) {
          extractedActionType = 'UPDATE_COMPETITION';
          try {
            extractedActionData = JSON.parse(updateMatch[1].trim());
          } catch {}
          replyText = replyText.replace(/\[ACTION:UPDATE_COMPETITION\][\s\S]*?\[\/ACTION\]/, '').trim();
        }

        setChatMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: replyText,
            actionData: extractedActionData,
            actionType: extractedActionType
          }
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'model', text: 'Sorry, I encountered an error: ' + (data.error || 'Unknown error') }
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: 'Network connection error: ' + String(err) }
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleExecuteAiAction = (actionType: string, actionData: any) => {
    if (!actionData) return;
    if (actionType === 'CREATE_QUIZ') {
      const newComp = Storage.addCompetition({
        title: actionData.title || 'AI Chat Quiz',
        type: 'Quiz',
        description: actionData.description || 'Created via Karmel AI Agent Chat.',
        lastDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        createdBy: `${currentUser?.hming || 'Developer'} (Karmel AI)`,
      });

      const updatedComp: Competition = {
        ...newComp,
        quizData: {
          timerSeconds: actionData.timerSeconds || 15,
          questions: actionData.questions || []
        }
      };
      Storage.updateCompetition(updatedComp);
      alert(`Quiz thar "${actionData.title}" chu AI chat atangin a siam fel a ni e!`);
      setSelectedCompId(newComp.id);
      onDataChanged();
    } else if (actionType === 'UPDATE_COMPETITION' && activeComp) {
      const updatedComp: Competition = {
        ...activeComp,
        title: actionData.title || activeComp.title,
        description: actionData.description || activeComp.description,
        quizData: {
          timerSeconds: actionData.timerSeconds || activeComp.quizData?.timerSeconds || 15,
          questions: actionData.questions || activeComp.quizData?.questions || []
        }
      };
      Storage.updateCompetition(updatedComp);
      alert(`Competition "${updatedComp.title}" chu AI chat atangin modification tihtheih a ni e!`);
      onDataChanged();
    }
  };

  // --- ACTIVE QUIZ PLAYING STATES ---
  const [activeQuiz, setActiveQuiz] = useState<Competition | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizTimer, setQuizTimer] = useState(15);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  const handleStartQuiz = (comp: Competition) => {
    if (!comp.quizData || comp.quizData.questions.length === 0) return;
    setActiveQuiz(comp);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setSelectedOptionIndex(null);
    setShowQuizResult(false);
    setQuizTimer(comp.quizData.timerSeconds || 15);
  };

  const handleNextQuestion = (chosenIdx: number | null) => {
    if (!activeQuiz || !activeQuiz.quizData) return;
    const currentQ = activeQuiz.quizData.questions[currentQuestionIndex];
    
    let isCorrect = false;
    if (chosenIdx !== null && chosenIdx === currentQ.correctAnswer) {
      setQuizScore((prev) => prev + 1);
      isCorrect = true;
    }

    setSelectedOptionIndex(chosenIdx);

    setTimeout(() => {
      setSelectedOptionIndex(null);
      if (currentQuestionIndex + 1 < activeQuiz.quizData!.questions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setQuizTimer(activeQuiz.quizData!.timerSeconds || 15);
      } else {
        setShowQuizResult(true);
        try {
          confetti({ particleCount: 80, spread: 60 });
        } catch {}
        
        if (currentUser) {
          const finalScoreStr = `${quizScore + (isCorrect ? 1 : 0)} / ${activeQuiz.quizData!.questions.length}`;
          Storage.addSubmission({
            competitionId: activeQuiz.id,
            memberId: currentUser.id,
            memberHming: currentUser.hming,
            memberVeng: currentUser.veng,
            title: `Quiz Score: ${finalScoreStr}`,
            description: `AI Quiz completed successfully. Checked answers in countdown limit mode.`,
            fileUrl: '/src/assets/images/banner_bg_1790693520321.jpg',
            fileType: 'document',
          });
          onDataChanged();
        }
      }
    }, 1000);
  };

  useEffect(() => {
    let intervalId: any = null;
    if (activeQuiz && activeQuiz.quizData && activeQuiz.quizData.timerSeconds && !showQuizResult) {
      intervalId = setInterval(() => {
        setQuizTimer((prev) => {
          if (prev <= 1) {
            handleNextQuestion(null);
            return activeQuiz.quizData?.timerSeconds || 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeQuiz, currentQuestionIndex, showQuizResult]);

  // Modals for Contests
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scoringSubId, setScoringSubId] = useState<string | null>(null);
  const [selectedMark, setSelectedMark] = useState<number>(9);

  // Edit Competition states
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [editCompTitle, setEditCompTitle] = useState('');
  const [editCompType, setEditCompType] = useState('Photography');
  const [editCompDesc, setEditCompDesc] = useState('');
  const [editCompLastDate, setEditCompLastDate] = useState('2026-10-31');

  // Edit Submission states
  const [editingSub, setEditingSub] = useState<Submission | null>(null);
  const [editSubTitle, setEditSubTitle] = useState('');
  const [editSubDesc, setEditSubDesc] = useState('');

  // Edit Book Review states
  const [editingBook, setEditingBook] = useState<BookReview | null>(null);
  const [editBookHming, setEditBookHming] = useState('');
  const [editBookZiaktu, setEditBookZiaktu] = useState('');
  const [editBookReview, setEditBookReview] = useState('');

  // Form states for submission
  const [subTitle, setSubTitle] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subFileUrl, setSubFileUrl] = useState('');
  const [subFileType, setSubFileType] = useState<'image' | 'video' | 'document'>('image');

  // Form states for new competition
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Photography');
  const [newDesc, setNewDesc] = useState('');
  const [newLastDate, setNewLastDate] = useState('2026-10-31');

  // Photo Lightbox state
  const [lightboxPhotos, setLightboxPhotos] = useState<LightboxPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const openPhotoLightbox = (photos: LightboxPhoto[], index: number = 0) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  // --- BOOK READING CHALLENGE (EDITABLE CONFIG BY OB / ADMIN) ---
  const challengeConfig = Storage.getBookChallengeConfig();
  const targetCount = Math.max(1, challengeConfig.targetBooks || 5);

  const bookReviews = Storage.getBookReviews();
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [bookHming, setBookHming] = useState(''); // Only 1 compulsory
  const [bookZiaktu, setBookZiaktu] = useState('');
  const [bookReview, setBookReview] = useState('');
  const [bookPhoto, setBookPhoto] = useState('');

  // Edit Challenge Config modal states (OB Only)
  const [showEditChallengeModal, setShowEditChallengeModal] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState(challengeConfig.title);
  const [challengeTarget, setChallengeTarget] = useState(challengeConfig.targetBooks);
  const [challengeRules, setChallengeRules] = useState(challengeConfig.rules);
  const [challengeReward, setChallengeReward] = useState(challengeConfig.rewardDescription);
  const [challengeIsActive, setChallengeIsActive] = useState(challengeConfig.isActive);

  // Group books by member for challenge
  const memberBookStats: Record<string, { memberId: string; hming: string; count: number; books: BookReview[] }> = {};
  bookReviews.forEach((bk) => {
    if (!memberBookStats[bk.memberId]) {
      memberBookStats[bk.memberId] = {
        memberId: bk.memberId,
        hming: bk.memberHming,
        count: 0,
        books: [],
      };
    }
    memberBookStats[bk.memberId].count += 1;
    memberBookStats[bk.memberId].books.push(bk);
  });

  const memberRankings = Object.values(memberBookStats).sort((a, b) => b.count - a.count);
  const rewardQualifiedMembers = memberRankings.filter((m) => m.count >= targetCount);
  const myReadCount = currentUser ? (memberBookStats[currentUser.id]?.count || 0) : 0;
  const isMyRewardQualified = myReadCount >= targetCount;

  const [bookFilter, setBookFilter] = useState<'all' | 'qualified' | 'myBooks'>('all');

  // Ranked submissions for Leaderboard
  const rankedSubmissions = [...submissions].sort((a, b) => {
    const marksA = Object.values(a.marks || {});
    const avgA = marksA.length > 0 ? marksA.reduce((s, v) => s + v, 0) / marksA.length : 0;
    const scoreA = avgA * 10 + (a.votes?.length || 0) * 2;

    const marksB = Object.values(b.marks || {});
    const avgB = marksB.length > 0 ? marksB.reduce((s, v) => s + v, 0) / marksB.length : 0;
    const scoreB = avgB * 10 + (b.votes?.length || 0) * 2;

    return scoreB - scoreA;
  });

  const top1 = rankedSubmissions[0];
  const top2 = rankedSubmissions[1];
  const top3 = rankedSubmissions[2];

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#1E3A8A', '#3B82F6', '#10B981'],
    });
  };

  const handleVote = (subId: string) => {
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    Storage.voteSubmission(subId, currentUser.id);
    onDataChanged();
  };

  const handleScoreSubmit = (subId: string) => {
    if (!currentUser || !isOB) {
      onOpenLogin();
      return;
    }
    Storage.markSubmission(subId, currentUser.id, selectedMark);
    setScoringSubId(null);
    onDataChanged();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      setSubFileType('image');
    } else if (file.type.startsWith('video/')) {
      setSubFileType('video');
    } else {
      setSubFileType('document');
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSubFileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    if (!subTitle.trim()) return;

    const fallbackImage =
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80';

    Storage.addSubmission({
      competitionId: activeComp.id,
      memberId: currentUser.id,
      memberHming: currentUser.hming,
      memberVeng: currentUser.veng,
      title: subTitle.trim(),
      description: subDesc.trim(),
      fileUrl: subFileUrl || fallbackImage,
      fileType: subFileType,
    });

    setSubTitle('');
    setSubDesc('');
    setSubFileUrl('');
    setShowSubmitModal(false);
    triggerConfetti();
    onDataChanged();
  };

  const handleCreateComp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isOB) {
      onOpenLogin();
      return;
    }
    if (!newTitle.trim()) return;

    const newComp = Storage.addCompetition({
      title: newTitle.trim(),
      type: newType,
      description: newDesc.trim(),
      lastDate: newLastDate,
      createdBy: `${currentUser.hming} (${currentUser.role})`,
    });

    setSelectedCompId(newComp.id);
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
    onDataChanged();
  };

  // Edit & Delete handlers for Competitions
  const handleOpenEditComp = (comp: Competition) => {
    setEditingComp(comp);
    setEditCompTitle(comp.title);
    setEditCompType(comp.type);
    setEditCompDesc(comp.description);
    setEditCompLastDate(comp.lastDate);
  };

  const handleSaveEditComp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComp || !editCompTitle.trim()) return;
    Storage.updateCompetition({
      ...editingComp,
      title: editCompTitle.trim(),
      type: editCompType,
      description: editCompDesc.trim(),
      lastDate: editCompLastDate,
    });
    setEditingComp(null);
    onDataChanged();
  };

  const handleDeleteComp = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete competition "${title}"?`)) {
      Storage.deleteCompetition(id);
      const remaining = Storage.getCompetitions();
      if (remaining.length > 0) {
        setSelectedCompId(remaining[0].id);
      }
      onDataChanged();
    }
  };

  // Edit & Delete handlers for Submissions (Photo contest entries) - OB & Developer Only
  const handleOpenEditSub = (sub: Submission) => {
    if (!isOB) return;
    setEditingSub(sub);
    setEditSubTitle(sub.title);
    setEditSubDesc(sub.description || '');
  };

  const handleSaveEditSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOB) return;
    if (!editingSub || !editSubTitle.trim()) return;
    Storage.updateSubmission({
      ...editingSub,
      title: editSubTitle.trim(),
      description: editSubDesc.trim(),
    });
    setEditingSub(null);
    onDataChanged();
  };

  const handleDeleteSub = (id: string, title: string) => {
    if (!isOB) return;
    if (window.confirm(`Are you sure you want to delete submission "${title}"?`)) {
      Storage.deleteSubmission(id);
      onDataChanged();
    }
  };

  // Edit & Delete handlers for Book Reviews - OB & Developer Only
  const handleOpenEditBook = (bk: BookReview) => {
    if (!isOB) return;
    setEditingBook(bk);
    setEditBookHming(bk.lehkhabuHming);
    setEditBookZiaktu(bk.ziaktu || '');
    setEditBookReview(bk.review || '');
  };

  const handleSaveEditBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOB) return;
    if (!editingBook || !editBookHming.trim()) return;
    Storage.updateBookReview({
      ...editingBook,
      lehkhabuHming: editBookHming.trim(),
      ziaktu: editBookZiaktu.trim() || undefined,
      review: editBookReview.trim() || undefined,
    });
    setEditingBook(null);
    setMainTab('reading');
    onDataChanged();
  };

  const handleDeleteBook = (id: string, bookName: string) => {
    if (!isOB) return;
    if (window.confirm(`Are you sure you want to delete book review "${bookName}"?`)) {
      Storage.deleteBookReview(id);
      setMainTab('reading');
      onDataChanged();
    }
  };

  // --- BOOK READING CHALLENGE SETTINGS HANDLERS (OB / DEVELOPER ONLY) ---
  const handleOpenEditChallenge = () => {
    if (!isOB) return;
    setChallengeTitle(challengeConfig.title);
    setChallengeTarget(challengeConfig.targetBooks);
    setChallengeRules(challengeConfig.rules);
    setChallengeReward(challengeConfig.rewardDescription);
    setChallengeIsActive(challengeConfig.isActive);
    setShowEditChallengeModal(true);
  };

  const handleSaveChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOB) return;
    Storage.updateBookChallengeConfig(
      {
        title: challengeTitle.trim() || 'Book Reading Challenge',
        targetBooks: Math.max(1, Number(challengeTarget) || 5),
        rules: challengeRules.trim(),
        rewardDescription: challengeReward.trim(),
        isActive: challengeIsActive,
      },
      currentUser?.hming
    );
    setShowEditChallengeModal(false);
    setMainTab('reading');
    onDataChanged();
  };

  // --- BOOK READING SUBMISSION ---
  const handleSaveBookReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    if (!bookHming.trim()) return;

    Storage.addBookReview({
      lehkhabuHming: bookHming.trim(),
      ziaktu: bookZiaktu.trim() || undefined,
      review: bookReview.trim() || undefined,
      photo: bookPhoto.trim() || undefined,
      memberId: currentUser.id,
      memberHming: currentUser.hming,
    });

    setBookHming('');
    setBookZiaktu('');
    setBookReview('');
    setBookPhoto('');
    setShowAddBookModal(false);
    setMainTab('reading');

    if (myReadCount + 1 >= targetCount) {
      triggerConfetti();
    }
    onDataChanged();
  };

  const handleToggleChhiarTha = (bookId: string) => {
    if (!currentUser || !isOB) {
      onOpenLogin();
      return;
    }
    Storage.toggleChhiarTha(bookId, currentUser.id);
    setMainTab('reading');
    onDataChanged();
  };

  const displayedBooks = bookReviews.filter((bk) => {
    if (bookFilter === 'myBooks') return currentUser && bk.memberId === currentUser.id;
    if (bookFilter === 'qualified') {
      const qIds = rewardQualifiedMembers.map((m) => m.memberId);
      return qIds.includes(bk.memberId);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-28 animate-in fade-in">
      {/* Top Banner Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Intihsiakna & Activities Hub
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                2026
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Competitions (Voting & OB marks) leh 5-Book Reading Challenge Rewards
            </p>
          </div>
        </div>

        {/* Action button based on active subtab */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {mainTab === 'contests' ? (
            <>
              {isOB && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Contest</span>
                </button>
              )}
              {activeComp && activeComp.type !== 'Quiz' && !activeComp.quizData && (
                <button
                  onClick={() => {
                    if (!currentUser) {
                      onOpenLogin();
                      return;
                    }
                    setShowSubmitModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-600 transition shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Submit Entry</span>
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {isOB && (
                <>
                  <button
                    type="button"
                    onClick={handleOpenEditChallenge}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-100 transition shadow-sm"
                    title="Edit Challenge Rules, Target & Criteria"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-700" />
                    <span>Edit Rules & Target</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Lehkhabu chhiar thehluh zawng zawng hi i nawt reh vek duh takzet em? (RESET BOOK CHALLENGE)")) {
                        Storage.clearAllBookReviews();
                        onDataChanged();
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500 transition shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All 🧹</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    onOpenLogin();
                    return;
                  }
                  setShowAddBookModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Book (Chhiar Thehlut)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TOP SEGMENTED SWITCHER: GENERAL CONTESTS vs BOOK READING ACTIVITY */}
      <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-2xl max-w-lg shadow-inner">
        <button
          type="button"
          onClick={() => setMainTab('contests')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            mainTab === 'contests'
              ? 'bg-white text-blue-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Intihsiakna ({competitions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('reading')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            mainTab === 'reading'
              ? 'bg-white text-blue-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span className="truncate">{challengeConfig.title}</span>
          <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full">
            {targetCount} Books
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: GENERAL COMPETITIONS (VOTING & OB MARKS)      */}
      {/* ======================================================== */}
      {mainTab === 'contests' && (
        <div className="space-y-6">
          {/* DEVELOPER ONLY: KARMEL AI CHAT AGENT PANEL */}
          {isDeveloperUser(currentUser) && (
            <div className="rounded-2xl border-2 border-indigo-400 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 p-4 sm:p-5 text-white shadow-md space-y-4 animate-in slide-in-from-top-3">
              <div className="flex items-center justify-between border-b border-indigo-500/35 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-inner">
                    <Sparkles className="w-5 h-5 text-amber-200" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                      <span>Karmel AI Assistant Agent</span>
                      <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Online</span>
                    </h3>
                    <p className="text-[10px] text-indigo-200">Chat with AI to create, modify, or customize quizzes & competitions conversationally</p>
                  </div>
                </div>
              </div>

              {/* Chat Message History */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {chatMessages.map((msg, mIdx) => (
                  <div
                    key={mIdx}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs font-medium'
                          : 'bg-slate-900 border border-indigo-500/30 text-indigo-100 rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Action Execution Button if model returned an action */}
                      {msg.actionData && msg.actionType && (
                        <div className="mt-3 pt-3 border-t border-indigo-500/20 space-y-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 uppercase">
                            <Award className="w-3.5 h-3.5" />
                            <span>Action Ready: {msg.actionData.title || 'Competition Update'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleExecuteAiAction(msg.actionType!, msg.actionData)}
                            className="cursor-pointer w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-black text-white transition shadow"
                          >
                            <span>Apply Changes to App</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 px-1 pt-0.5">
                      {msg.role === 'user' ? 'You' : 'Karmel AI'}
                    </span>
                  </div>
                ))}
                {isChatSending && (
                  <div className="flex items-center gap-2 text-xs text-indigo-300 bg-slate-900/60 p-3 rounded-2xl w-fit border border-indigo-500/20">
                    <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <span>Karmel AI is thinking & reasoning...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Box */}
              <div className="flex items-center gap-2 pt-1 border-t border-indigo-500/25">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  placeholder="Ask AI to add questions, change timer, or create a quiz..."
                  className="flex-1 rounded-xl border border-indigo-500/30 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isChatSending || !chatInput.trim()}
                  onClick={handleSendChatMessage}
                  className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50 shrink-0"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Competition Selector Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {competitions.map((comp) => {
              const isSelected = comp.id === activeComp?.id;
              return (
                <button
                  key={comp.id}
                  onClick={() => setSelectedCompId(comp.id)}
                  className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                    isSelected
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="uppercase text-[9px] tracking-wider block opacity-75">
                    {comp.type}
                  </span>
                  <span className="truncate max-w-[200px] inline-block font-bold">
                    {comp.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Competition Info Card */}
          {activeComp && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                    {activeComp.type}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Last date: {activeComp.lastDate}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    Organized by: <strong className="text-slate-700">{activeComp.createdBy}</strong>
                  </span>
                  {/* EDIT & DELETE BUTTONS - Visible ONLY to OBs and Developer */}
                  {isOB && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleOpenEditComp(activeComp)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition"
                        title="Edit Competition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteComp(activeComp.id, activeComp.title)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Delete Competition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900">{activeComp.title}</h2>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {activeComp.description}
              </p>
            </div>
          )}

          {/* ======================================================== */}
          {/* INTERACTIVE QUIZ BOARD (Option 1)                       */}
          {/* ======================================================== */}
          {activeComp && activeComp.quizData && (
            <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm space-y-4">
              {activeQuiz?.id !== activeComp.id ? (
                /* QUIZ NOT STARTED / ENTRY STATE */
                <div className="text-center py-6 space-y-3.5">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto shadow-xs border border-indigo-100">
                    <Trophy className="w-8 h-8 text-amber-500 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900">🎯 Interactive Quiz Board Active</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      He hmunah hian interactive quiz a awm e. Zawhna <strong>{activeComp.quizData.questions.length}</strong> awm miahin, question tinah <strong>{activeComp.quizData.timerSeconds || 15}s</strong> countdown a awm ang.
                    </p>
                  </div>

                  {/* Previous submission score if any */}
                  {currentUser && submissions.find((s) => s.memberId === currentUser.id) && (
                    <div className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-3.5 py-1.5 rounded-xl font-bold font-sans">
                      🎉 I score hnuhnung zawk: {submissions.find((s) => s.memberId === currentUser.id)?.title.replace('Quiz Score: ', '')}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) {
                          onOpenLogin();
                          return;
                        }
                        handleStartQuiz(activeComp);
                      }}
                      className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-xs font-black text-white hover:from-indigo-500 hover:to-blue-500 transition shadow-md active:scale-95 select-none"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Start Quiz Challenge</span>
                    </button>
                  </div>
                </div>
              ) : showQuizResult ? (
                /* QUIZ FINISHED / RESULTS STATE */
                <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
                  <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center mx-auto shadow-md">
                    <Gift className="w-10 h-10 text-amber-500 animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-950">Quiz Challenge Zo Ta!</h3>
                    <p className="text-xs text-slate-500">I hlawhtling taka i chhang zo hi kan lawmpui che e.</p>
                  </div>

                  <div className="bg-slate-50 max-w-sm mx-auto p-5 rounded-2xl border border-slate-100 space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Final Score</span>
                    <div className="text-3xl font-black text-blue-700 tracking-tight font-sans">
                      {quizScore} / {activeComp.quizData.questions.length}
                    </div>
                    <p className="text-xs font-semibold text-slate-600">
                      {quizScore === activeComp.quizData.questions.length
                        ? '💯 Nil bil lo! I chhang sual lo hrim hrim.'
                        : quizScore >= activeComp.quizData.questions.length / 2
                        ? '👏 Thra lutuk! Chhanna hlawhtling tak a ni.'
                        : '👍 I ti tha e! Zirbelh zel rawh le.'}
                    </p>
                  </div>

                  {currentUser && (
                    <p className="text-[11px] text-slate-400 font-medium">
                      ℹ️ I score hi leaderboards-ah submit fel nghal a ni e.
                    </p>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveQuiz(null);
                        setShowQuizResult(false);
                      }}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                    >
                      <span>Close & Return</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ACTIVE PLAYING STATE */
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Progress Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                    <span className="font-bold text-slate-500">
                      Question <strong className="text-indigo-700">{currentQuestionIndex + 1}</strong> of {activeComp.quizData.questions.length}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold font-mono text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      ⏱️ {quizTimer}s remaining
                    </span>
                  </div>

                  {/* Timer Progress Bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        quizTimer <= 5 ? 'bg-rose-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${(quizTimer / (activeComp.quizData.timerSeconds || 15)) * 100}%` }}
                    />
                  </div>

                  {/* Question */}
                  <div className="py-2.5">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                      {activeComp.quizData.questions[currentQuestionIndex].question}
                    </h3>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1.5">
                    {activeComp.quizData.questions[currentQuestionIndex].options.map((opt, oIdx) => {
                      const isCorrect = oIdx === activeComp.quizData!.questions[currentQuestionIndex].correctAnswer;
                      const isSelected = oIdx === selectedOptionIndex;
                      
                      let btnStyle = "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100";
                      let feedbackIcon = null;

                      if (selectedOptionIndex !== null) {
                        if (isCorrect) {
                          btnStyle = "border-emerald-300 bg-emerald-50 text-emerald-900 font-bold scale-[1.01] ring-2 ring-emerald-500/10";
                          feedbackIcon = "✅";
                        } else if (isSelected) {
                          btnStyle = "border-rose-300 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-500/10";
                          feedbackIcon = "❌";
                        } else {
                          btnStyle = "border-slate-200 bg-slate-50 text-slate-400 opacity-60 pointer-events-none";
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={selectedOptionIndex !== null}
                          onClick={() => handleNextQuestion(oIdx)}
                          className={`w-full text-left rounded-xl border p-3.5 text-xs font-bold transition-all flex items-center justify-between cursor-pointer select-none ${btnStyle}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-white border border-slate-300/80 flex items-center justify-center font-mono text-[10px] text-slate-500 shrink-0">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {feedbackIcon && <span className="text-sm shrink-0">{feedbackIcon}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LIVE LEADERBOARD / PODIUM (Top 3) */}
          {rankedSubmissions.length > 0 && (
            <div className="rounded-2xl border border-amber-300 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Live Leaderboard • Top Participants
                  </h3>
                </div>
                <button
                  onClick={triggerConfetti}
                  className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Celebrate 🏆</span>
                </button>
              </div>

              {/* Podium Display */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2">
                {/* 2nd Place */}
                {top2 && (
                  <div className="order-2 sm:order-1 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center shadow-xs">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center mx-auto mb-1.5">
                      2
                    </div>
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {top2.memberHming}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{top2.title}</div>
                    <div className="mt-1.5 inline-block font-mono text-xs font-bold text-slate-700">
                      ❤️ {top2.votes?.length || 0} • ⭐ {Object.keys(top2.marks || {}).length} OBs
                    </div>
                  </div>
                )}

                {/* 1st Place (Gold Center) */}
                {top1 && (
                  <div className="order-1 sm:order-2 rounded-2xl border-2 border-amber-400 bg-amber-50/50 p-4 text-center shadow-md transform sm:-translate-y-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-xs">
                      1 👑
                    </div>
                    <div className="font-black text-sm text-slate-900 truncate">
                      {top1.memberHming}
                    </div>
                    <div className="text-xs text-amber-900 font-semibold truncate">
                      "{top1.title}"
                    </div>
                    <div className="mt-2 inline-block font-mono text-xs font-black text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                      ❤️ {top1.votes?.length || 0} votes • ⭐ Marked by {Object.keys(top1.marks || {}).length} OBs
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {top3 && (
                  <div className="order-3 sm:order-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center shadow-xs">
                    <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 font-black text-xs flex items-center justify-center mx-auto mb-1.5">
                      3
                    </div>
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {top3.memberHming}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{top3.title}</div>
                    <div className="mt-1.5 inline-block font-mono text-xs font-bold text-slate-700">
                      ❤️ {top3.votes?.length || 0} • ⭐ {Object.keys(top3.marks || {}).length} OBs
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submissions Feed */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              All Submissions ({submissions.length})
            </h3>

            {submissions.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
                <Trophy className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Thehlut an la awm lo.</p>
                <p className="text-xs text-slate-400 mt-1">A hmasa ber nih tumin submit rawh le!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submissions.map((sub) => {
                  const hasVoted = currentUser && sub.votes?.includes(currentUser.id);
                  const marksArray = Object.values(sub.marks || {});
                  const avgMark =
                    marksArray.length > 0
                      ? (marksArray.reduce((s, v) => s + v, 0) / marksArray.length).toFixed(1)
                      : null;
                  const myMark = currentUser ? sub.marks?.[currentUser.id] : undefined;

                  return (
                    <div
                      key={sub.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      {/* Media */}
                      {sub.fileType === 'image' && (
                        <div 
                          onClick={() => {
                            const imageSubs = submissions.filter((s) => s.fileType === 'image');
                            const photosList: LightboxPhoto[] = imageSubs.map((s) => ({
                              url: s.fileUrl,
                              title: s.title,
                              subtitle: `Thehluttu: ${s.memberHming} (${s.memberVeng}) • ${s.submittedAt.split('T')[0]}`,
                              description: s.description,
                            }));
                            const idx = imageSubs.findIndex((s) => s.id === sub.id);
                            openPhotoLightbox(photosList, Math.max(0, idx));
                          }}
                          className="relative h-48 w-full bg-slate-100 overflow-hidden cursor-pointer group"
                        >
                          <img
                            src={sub.fileUrl}
                            alt={sub.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-slate-900/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                              <Maximize2 className="w-3.5 h-3.5" /> En zauhna (Full View)
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-900">
                            {sub.memberHming} ({sub.memberVeng})
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {sub.submittedAt.split('T')[0]}
                            </span>
                            {/* EDIT & DELETE BUTTONS - Visible to OBs & Developer Only */}
                            {isOB && (
                              <div className="flex items-center gap-1 ml-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSub(sub)}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-700 transition"
                                  title="Edit Entry"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSub(sub.id, sub.title)}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                  title="Delete Entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {sub.title}
                        </h4>
                        {sub.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">{sub.description}</p>
                        )}

                        {/* Scores & OB ratings */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-rose-600 flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 fill-rose-500" />
                              <span>{sub.votes?.length || 0}</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="font-bold text-amber-700 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              <span>{avgMark ? `${avgMark}/10 (${marksArray.length} OBs)` : 'No marks'}</span>
                            </span>
                          </div>
                        </div>

                        {/* OB & Member Action Bar */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          {/* Member Vote Button */}
                          <button
                            onClick={() => handleVote(sub.id)}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                              hasVoted
                                ? 'bg-rose-50 border border-rose-200 text-rose-700'
                                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-rose-600' : ''}`} />
                            <span>{hasVoted ? 'Voted' : 'Vote'}</span>
                          </button>

                          {/* OB Score Button (1-10 marks) */}
                          {isOB && (
                            <div>
                              {myMark !== undefined ? (
                                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                                  Marked: {myMark}/10
                                </span>
                              ) : (
                                <button
                                  onClick={() => setScoringSubId(sub.id)}
                                  className="flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-xs"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                  <span>Give Mark (1-10)</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: 5-BOOK READING CHALLENGE ACTIVITY            */}
      {/* ======================================================== */}
      {mainTab === 'reading' && (
        <div className="space-y-6">
          {/* BOOK REWARD CHALLENGE HERO BANNER */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md">
                  <Gift className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                      {challengeConfig.title}
                    </span>
                    <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.2 rounded-full shadow-2xs">
                      Target: {targetCount} Books
                    </span>
                    {!challengeConfig.isActive && (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.2 rounded-full">
                        Closed / Paused
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                    Lehkhabu {targetCount} tal chhiar chhuak rawh le — Lawmman dawng ngei turin!
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {challengeConfig.rewardDescription}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 self-stretch sm:self-auto">
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">Lawmman dawng thei tling tawh:</div>
                  <div className="text-xl sm:text-2xl font-black text-amber-700">
                    {rewardQualifiedMembers.length} Members 🏆
                  </div>
                </div>

                {/* OB quick edit button */}
                {isOB && (
                  <button
                    type="button"
                    onClick={handleOpenEditChallenge}
                    className="flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-50 transition shadow-2xs"
                  >
                    <Sliders className="w-3 h-3 text-amber-700" />
                    <span>Dan & Target Siamrem</span>
                  </button>
                )}
              </div>
            </div>

            {/* DYNAMIC RULES & CRITERIA DISPLAY */}
            {challengeConfig.rules && (
              <div className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-amber-100/70 border border-amber-300 p-3 text-xs text-amber-950">
                <FileText className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider block mb-0.5">
                    Dan & Kairawhhna (Rules & Criteria):
                  </span>
                  <p className="leading-relaxed font-medium">{challengeConfig.rules}</p>
                </div>
              </div>
            )}

            {/* PERSONAL BOOK PROGRESS TRACKER (For Logged in User) */}
            {currentUser && (
              <div className="mt-4 pt-4 border-t border-amber-200/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      I Chhiar Tawh Zat ({currentUser.hming}):
                    </span>
                    <span className="font-mono text-sm font-black text-blue-800">
                      {myReadCount} / {targetCount} Books
                    </span>
                  </div>

                  {isMyRewardQualified ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300">
                      <Trophy className="w-4 h-4 text-amber-600" />
                      <span>Tahrik i thleng tawh! Lawmman dawng thei i ni e 🎉</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600">
                      Lawmman dawng turin lehkhabu <strong className="text-amber-700 font-bold">{Math.max(0, targetCount - myReadCount)}</strong> chhiar a la ngai!
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isMyRewardQualified
                        ? 'bg-gradient-to-r from-amber-500 to-emerald-600'
                        : 'bg-gradient-to-r from-blue-600 to-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (myReadCount / targetCount) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* HALL OF FAME: TARGET+ BOOKS REWARD WINNERS */}
          {rewardQualifiedMembers.length > 0 && (
            <div className="rounded-2xl border border-amber-300 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    {targetCount}+ Books Reward Qualified Members ({rewardQualifiedMembers.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={triggerConfetti}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Celebrate {targetCount}+ Club 🎉</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {rewardQualifiedMembers.map((m, idx) => (
                  <div
                    key={m.memberId}
                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-white border border-amber-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 truncate max-w-[130px]">
                          {m.hming}
                        </div>
                        <span className="text-[10px] font-bold text-amber-800">
                          🏆 Lawmman Dawng Thei
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-blue-900 font-mono">
                        {m.count}
                      </span>
                      <span className="text-[10px] text-slate-500 block">books</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FILTER BUTTONS */}
          <div className="flex rounded-xl bg-white p-1 border border-slate-200 max-w-md shadow-xs">
            <button
              type="button"
              onClick={() => setBookFilter('all')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                bookFilter === 'all'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Books ({bookReviews.length})
            </button>
            <button
              type="button"
              onClick={() => setBookFilter('qualified')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                bookFilter === 'qualified'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {targetCount}+ Club ({rewardQualifiedMembers.length})
            </button>
            {currentUser && (
              <button
                type="button"
                onClick={() => setBookFilter('myBooks')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                  bookFilter === 'myBooks'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Books ({myReadCount})
              </button>
            )}
          </div>

          {/* BOOK FEED LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedBooks.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">Lehkhabu thehlut an la awm lo.</p>
                <p className="text-xs text-slate-400 mt-1">Lehkhabu hming chhu lut la, {targetCount}-book reward target pan rawh le!</p>
              </div>
            ) : (
              displayedBooks.map((bk) => {
                const hasGivenThumb = currentUser && bk.goodReads.includes(currentUser.id);
                const userTotalRead = memberBookStats[bk.memberId]?.count || 1;
                const isUserQualified = userTotalRead >= targetCount;

                return (
                  <div
                    key={bk.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-100 uppercase">
                              Lehkhabu
                            </span>
                            {isUserQualified && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                🏆 {targetCount}+ Club
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 font-mono">
                              {bk.createdAt}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 leading-tight">
                            {bk.lehkhabuHming}
                          </h3>
                          {bk.ziaktu && (
                            <p className="text-xs text-amber-700 font-semibold mt-0.5">
                              Ziaktu: {bk.ziaktu}
                            </p>
                          )}
                        </div>
                      </div>

                      {bk.review && (
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                          "{bk.review}"
                        </p>
                      )}

                      {bk.photo && (
                        <div 
                          onClick={() => {
                            const allBookPhotos = bookReviews.filter((b) => !!b.photo);
                            const photosList: LightboxPhoto[] = allBookPhotos.map((b) => ({
                              url: b.photo!,
                              title: b.lehkhabuHming,
                              subtitle: b.ziaktu ? `Ziaktu: ${b.ziaktu} • Chhiartu: ${b.memberHming}` : `Chhiartu: ${b.memberHming}`,
                              description: b.review,
                            }));
                            const idx = allBookPhotos.findIndex((b) => b.id === bk.id);
                            openPhotoLightbox(photosList, Math.max(0, idx));
                          }}
                          className="h-40 overflow-hidden rounded-xl border border-slate-200 cursor-pointer group relative"
                        >
                          <img
                            src={bk.photo}
                            alt={bk.lehkhabuHming}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-slate-900/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                              <Maximize2 className="w-3.5 h-3.5" /> En zauhna (Full View)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Chhiartu: <strong className="text-blue-900">{bk.memberHming}</strong>{' '}
                          <span className="text-[11px] text-slate-400 font-mono">({userTotalRead}/{targetCount})</span>
                        </span>
                      </span>

                      <div className="flex items-center gap-2">
                        {/* EDIT & DELETE BUTTONS - Visible to OBs & Developer Only */}
                        {isOB && (
                          <div className="flex items-center gap-1 mr-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditBook(bk)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-700 transition"
                              title="Edit Book Review"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBook(bk.id, bk.lehkhabuHming)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Delete Book Review"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* OBs click "Chhiar tha 👍" (Competition Review) / Members view count */}
                        {isOB ? (
                          <button
                            type="button"
                            onClick={() => handleToggleChhiarTha(bk.id)}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                              hasGivenThumb
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="OB Review Endorsement"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Chhiar tha 👍 ({bk.goodReads.length})</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700">
                            <ThumbsUp className="w-3.5 h-3.5 text-amber-500" />
                            <span>Chhiar tha: {bk.goodReads.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: SUBMIT ENTRY FOR CONTEST */}
      {showSubmitModal && activeComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit Contest Entry</h3>
                <p className="text-xs text-slate-500">{activeComp.title}</p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEntry} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Title (Thupui)
                </label>
                <input
                  type="text"
                  required
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  placeholder="I kutchhuak thupui"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Description / Explanation
                </label>
                <textarea
                  rows={2}
                  value={subDesc}
                  onChange={(e) => setSubDesc(e.target.value)}
                  placeholder="Thlalak/Essay chungchang tawi..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Upload Photo / File
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE CONTEST */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create Competition</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComp} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Competition Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Darlawn Tlang Photography Contest"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Photography">Photography</option>
                    <option value="Video">Video</option>
                    <option value="Essay">Essay</option>
                    <option value="Singing">Singing</option>
                    <option value="Art">Art / Drawing</option>
                    <option value="Quiz">Quiz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Last Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newLastDate}
                    onChange={(e) => setNewLastDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Dan leh hriatturte..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: OB SCORING DIALOG (1 - 10) */}
      {scoringSubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Office Bearer Scoring</h3>
              <button
                onClick={() => setScoringSubId(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500 mb-2">Mark pe rawh (Scale 1 - 10):</p>
              <div className="text-3xl font-black text-amber-500 font-mono">
                {selectedMark} / 10
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={selectedMark}
                onChange={(e) => setSelectedMark(Number(e.target.value))}
                className="mt-3 w-full accent-amber-500"
              />
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setScoringSubId(null)}
                className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleScoreSubmit(scoringSubId)}
                className="flex-1 rounded-xl bg-amber-500 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Submit Mark
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD BOOK (SUPER SIMPLE: ONLY 1 COMPULSORY) */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Lehkhabu Chhiar Thehlut</h3>
                <p className="text-xs text-slate-500">Lehkhabu Hming chauh hi a tul (compulsory) a ni</p>
              </div>
              <button
                onClick={() => setShowAddBookModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBookReview} className="mt-4 space-y-3.5">
              {/* COMPULSORY */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Lehkhabu Hming (Book Name) *
                  </label>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    COMPULSORY
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={bookHming}
                  onChange={(e) => setBookHming(e.target.value)}
                  placeholder="e.g. Kristiana Vanram Kawng Zawh"
                  className="w-full rounded-xl border border-blue-400 bg-white py-2.5 px-3.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* OPTIONAL: Ziaktu */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Ziaktu / Author (Optional)
                </label>
                <input
                  type="text"
                  value={bookZiaktu}
                  onChange={(e) => setBookZiaktu(e.target.value)}
                  placeholder="e.g. Rev. Chuauthuama"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* OPTIONAL: Review */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Review / I ngaihdan tawi (Optional)
                </label>
                <textarea
                  rows={2}
                  value={bookReview}
                  onChange={(e) => setBookReview(e.target.value)}
                  placeholder="A tha em? Eng nge i hlawkpui?"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* OPTIONAL: Photo */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Photo URL / Cover (Optional)
                </label>
                <input
                  type="url"
                  value={bookPhoto}
                  onChange={(e) => setBookPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                🎯 I thehluh rual hian i reward score chu <strong>{myReadCount + 1}/{targetCount}</strong> a ni tawh ang!
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBookModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm"
                >
                  Post Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT COMPETITION */}
      {editingComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Competition</h3>
              <button
                onClick={() => setEditingComp(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditComp} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editCompTitle}
                  onChange={(e) => setEditCompTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Type / Category
                </label>
                <input
                  type="text"
                  required
                  value={editCompType}
                  onChange={(e) => setEditCompType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Last Date
                </label>
                <input
                  type="date"
                  required
                  value={editCompLastDate}
                  onChange={(e) => setEditCompLastDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={editCompDesc}
                  onChange={(e) => setEditCompDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingComp(null)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SUBMISSION */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Submission</h3>
              <button
                onClick={() => setEditingSub(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSub} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editSubTitle}
                  onChange={(e) => setEditSubTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Description / Caption
                </label>
                <textarea
                  rows={3}
                  value={editSubDesc}
                  onChange={(e) => setEditSubDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BOOK REVIEW */}
      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Book Review</h3>
              <button
                onClick={() => setEditingBook(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBook} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Lehkhabu Hming
                </label>
                <input
                  type="text"
                  required
                  value={editBookHming}
                  onChange={(e) => setEditBookHming(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Ziaktu (Author)
                </label>
                <input
                  type="text"
                  value={editBookZiaktu}
                  onChange={(e) => setEditBookZiaktu(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Review / I ngaihdan tawi
                </label>
                <textarea
                  rows={3}
                  value={editBookReview}
                  onChange={(e) => setEditBookReview(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BOOK READING CHALLENGE SETTINGS (OB ONLY) */}
      {showEditChallengeModal && isOB && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Lehkhabu Chhiar Intihsiakna Siamremna</h3>
                  <p className="text-xs text-slate-500">OB & Developer chauhvin an siamrem thei</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditChallengeModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChallenge} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Intihsiakna Hming / Title
                </label>
                <input
                  type="text"
                  required
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                  placeholder="e.g. 5-Book Reading Challenge"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Lehkhabu Chhiar Ngai Zat (Target No. of Books)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={challengeTarget}
                  onChange={(e) => setChallengeTarget(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Member-ten lawmman dawng tura lehkhabu an chhiar chhuah ngai zat (e.g. 3, 5, or 10).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Dan & Kairawhhna (Rules & Criteria)
                </label>
                <textarea
                  rows={3}
                  value={challengeRules}
                  onChange={(e) => setChallengeRules(e.target.value)}
                  placeholder="e.g. Reading a book which is not more than 100 pages / Lehkhabu phêk 100 aia tam lo..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Phek zat bi (page limit), lehkhabu chi thlan tur, leh thil dang tarlan tur te.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Lawmman Hrilhfiahna (Reward Description)
                </label>
                <input
                  type="text"
                  value={challengeReward}
                  onChange={(e) => setChallengeReward(e.target.value)}
                  placeholder="e.g. Branch hnen atangin Lawmman tha tak a hlan dawn e."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  id="challengeActiveCheck"
                  checked={challengeIsActive}
                  onChange={(e) => setChallengeIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 accent-amber-600"
                />
                <label htmlFor="challengeActiveCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                  He Intihsiakna hi kal mek a ni (Active)
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditChallengeModal(false)}
                  className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-sm"
                >
                  Save Challenge Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Photo Lightbox */}
      <PhotoLightbox
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        photos={lightboxPhotos}
        initialIndex={lightboxIndex}
      />
    </div>
  );
};
