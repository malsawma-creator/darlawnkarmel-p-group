import React, { useState, useEffect, useRef } from 'react';
import {
  Member,
  Competition,
  BibleCompetitionType,
  BibleQuestion,
  LeagueScore,
  isDeveloperUser,
} from '../types';
import { Storage } from '../utils/storage';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  Flame,
  Gift,
  Zap,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Check,
  ChevronRight,
  Crown,
  Medal,
  Lock,
  Play,
  Plus,
  Edit3,
  Trash2,
  Sliders,
  X,
  FileText,
  AlertCircle,
  Award,
  Calendar,
  Layers,
} from 'lucide-react';

interface BibleLeagueSystemProps {
  currentUser: Member | null;
  onOpenLogin: () => void;
  onDataChanged: () => void;
}

export const BibleLeagueSystem: React.FC<BibleLeagueSystemProps> = ({
  currentUser,
  onOpenLogin,
  onDataChanged,
}) => {
  const isDeveloper = isDeveloperUser(currentUser);

  // Competitions
  const allComps = Storage.getCompetitions();
  const availableComps = allComps.filter(
    (c) => isDeveloper || c.status === 'Active'
  );

  const [selectedCompId, setSelectedCompId] = useState<string>(
    availableComps[0]?.id || ''
  );

  const activeComp =
    availableComps.find((c) => c.id === selectedCompId) || availableComps[0];

  // Active view: 'overview' | 'game' | 'leaderboard'
  const [viewMode, setViewMode] = useState<'overview' | 'game' | 'leaderboard'>('overview');

  // Developer Admin Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [showQuestionInspector, setShowQuestionInspector] = useState(false);

  // Developer Leaderboard Edit State
  const [editingScore, setEditingScore] = useState<LeagueScore | null>(null);
  const [showAddScoreForm, setShowAddScoreForm] = useState(false);
  const [editScoreName, setEditScoreName] = useState('');
  const [editScoreVeng, setEditScoreVeng] = useState('');
  const [editScorePoints, setEditScorePoints] = useState(0);
  const [editScoreWeeks, setEditScoreWeeks] = useState(1);
  const [editScoreStreak, setEditScoreStreak] = useState(1);

  const answerRevealRef = useRef<HTMLDivElement>(null);

  const handleOpenEditScore = (score: LeagueScore) => {
    setShowAddScoreForm(false);
    setEditingScore(score);
    setEditScoreName(score.userName || '');
    setEditScoreVeng(score.userVeng || '');
    setEditScorePoints(score.totalPoints || 0);
    setEditScoreWeeks(score.weeksPlayed || 1);
    setEditScoreStreak(score.currentStreak || 1);
  };

  const handleOpenAddScore = () => {
    setEditingScore(null);
    setEditScoreName('');
    setEditScoreVeng('Darlawn');
    setEditScorePoints(10);
    setEditScoreWeeks(1);
    setEditScoreStreak(1);
    setShowAddScoreForm(true);
  };

  const handleSaveNewScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editScoreName.trim()) return;
    const customUserId = `manual-${Date.now()}`;
    const newEntry: LeagueScore = {
      id: `ls-${customUserId}`,
      userId: customUserId,
      userName: editScoreName.trim(),
      userVeng: editScoreVeng.trim() || 'Darlawn',
      totalPoints: Number(editScorePoints) || 0,
      weeksPlayed: Number(editScoreWeeks) || 1,
      currentStreak: Number(editScoreStreak) || 1,
      lastPlayedWeek: activeComp?.title || 'Manual Entry',
      history: [],
      updatedAt: new Date().toISOString(),
    };
    const currentScores = Storage.getLeagueScores();
    currentScores.push(newEntry);
    Storage.saveLeagueScores(currentScores);
    Storage.updateLeagueScore(newEntry);
    setShowAddScoreForm(false);
    onDataChanged();
  };

  const handleSaveEditScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScore) return;
    Storage.updateLeagueScore({
      ...editingScore,
      userName: editScoreName.trim() || editingScore.userName,
      userVeng: editScoreVeng.trim(),
      totalPoints: Number(editScorePoints) || 0,
      weeksPlayed: Number(editScoreWeeks) || 0,
      currentStreak: Number(editScoreStreak) || 0,
    });
    setEditingScore(null);
    onDataChanged();
  };

  const handleDeleteScoreEntry = (score: LeagueScore) => {
    if (
      window.confirm(
        `Leaderboard atangin "${score.userName}" (${score.totalPoints} pts) hi paih i duh tak tak em?`
      )
    ) {
      Storage.deleteLeagueScore(score.id, score.userId);
      onDataChanged();
    }
  };

  const handleClearLeaderboard = () => {
    if (
      window.confirm(
        'Leaderboard zawng zawng hi clear vek i duh tak tak em? Member zawng zawng point a bo vek ang.'
      )
    ) {
      Storage.clearAllLeagueScores();
      onDataChanged();
    }
  };

  // Toggle publish / draft status
  const handleTogglePublish = (comp: Competition) => {
    const nextStatus = comp.status === 'Draft' ? 'Active' : 'Draft';
    Storage.updateCompetition({
      ...comp,
      status: nextStatus,
    });
    onDataChanged();
  };

  // Admin form states
  const [compTitle, setCompTitle] = useState('Bible League: Week 1 📖');
  const [compType, setCompType] = useState<BibleCompetitionType>('mcq_classic');
  const [compDesc, setCompDesc] = useState('Karmel P Group Bible Inelna');
  const [compDeadline, setCompDeadline] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [timerSeconds, setTimerSeconds] = useState(20);
  const [pointsPerQ, setPointsPerQ] = useState(10);
  const [compStatus, setCompStatus] = useState<'Draft' | 'Active'>('Active');
  const [rawPasteBox, setRawPasteBox] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<BibleQuestion[]>([]);
  const [pasteError, setPasteError] = useState('');

  // Test mode flag (for developer test draft)
  const [isTestMode, setIsTestMode] = useState(false);

  // Game Engine States
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [wordScrambleInput, setWordScrambleInput] = useState('');
  const [verseDetectiveChoice, setVerseDetectiveChoice] = useState<boolean | null>(null);
  const [twoTruthsChoice, setTwoTruthsChoice] = useState<number | null>(null);
  const [fillBlankInput, setFillBlankInput] = useState('');
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [selectedLeftPair, setSelectedLeftPair] = useState<string | null>(null);

  // Question State
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showVerseDetail, setShowVerseDetail] = useState(false);
  const [earnedPointsThisQ, setEarnedPointsThisQ] = useState(0);

  // Running Game Totals
  const [totalGameScore, setTotalGameScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [isFinished, setIsFinished] = useState(false);

  // League Data
  const leagueScores = Storage.getLeagueScores();
  const userLeague = currentUser ? Storage.getLeagueScoreForUser(currentUser.id) : null;
  const userRankIndex = currentUser
    ? leagueScores.findIndex((s) => s.userId === currentUser.id)
    : -1;

  // Check if current user already played this competition
  const alreadyPlayed =
    currentUser && activeComp
      ? Storage.hasUserPlayedCompetition(currentUser.id, activeComp.id)
      : false;
  const pastSubmission =
    currentUser && activeComp
      ? Storage.getUserSubmissionForCompetition(currentUser.id, activeComp.id)
      : null;

  // Sync selectedCompId if list changes
  useEffect(() => {
    if (availableComps.length > 0 && !availableComps.some((c) => c.id === selectedCompId)) {
      setSelectedCompId(availableComps[0].id);
    }
  }, [availableComps.length]);

  // Question timer
  useEffect(() => {
    if (viewMode !== 'game' || isAnswered || isFinished) return;

    setSecondsLeft(activeComp?.quizData?.timerSeconds || activeComp?.timerSeconds || 20);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time's up - trigger auto reveal as wrong
          handleAutoTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQIndex, viewMode, isAnswered, isFinished]);

  const handleAutoTimeUp = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setIsCorrect(false);
    setEarnedPointsThisQ(0);
  };

  // 8 Separate Templates & Placeholders per Competition Type (including Mixed Mode)
  const COMPETITION_TYPE_CONFIG: Record<
    BibleCompetitionType,
    {
      formatTitle: string;
      placeholder: string;
      template: string;
    }
  > = {
    mixed_mode: {
      formatTitle: 'BIG PASTE BOX - MIXED MODE (MIX VEK) FORMAT',
      placeholder:
        'MCQ: Question | A | B | C | D | Answer | VerseRef | VerseText\nSCRAMBLE: ScrambledWord | CorrectWord | Hint | VerseRef\nDETECTIVE: VerseText | True/False | CorrectText | VerseRef\nPAIR: LeftItem | RightItem\nEMOJI: EmojiClue | Question | A | B | C | D | Answer\nLIE: Statement1 | Statement2 | Statement3 | LieNumber | Explanation\nBLANK: Sentence with ___ | CorrectWord | Wrong1 | Wrong2 | VerseRef',
      template:
        'MCQ: Pathianin engnge a siam hmasa ber? | Lei | Van | Eng | Tuialhthei | C | Genesis 1:3 | Pathianin Eng awm rawh se a ti a\nSCRAMBLE: NAPTHIA | PATHIAN | Khawvel siamtu | Genesis 1:1\nDETECTIVE: Lalpa chu mi vengtu a ni | False | Lalpa chu ka beram vengtu a ni | Sam 23:1\nPAIR: Mosea | Exodus\nPAIR: Davida | Sam\nPAIR: Petera | Tirhkoh\nPAIR: Paula | Rome\nEMOJI: Tui chunga kal emoji | Tu nge tui chunga kal? | Mosea | Elia | Isua | Jona | C\nLIE: Davida chu Goliatha thattu a ni | Davida chu Saula fapa a ni | Davida chu Bethlehem a piang a ni | 2 | Davida chu Isai-a fapa a ni\nBLANK: Amah chu ___ leh Omega a ni | Alpha | Beta | Gamma | Thupuan 22:13',
    },
    mcq_classic: {
      formatTitle: 'BIG PASTE BOX - MCQ CLASSIC FORMAT',
      placeholder: 'Question | A | B | C | D | Answer | VerseRef | VerseText',
      template:
        'Pathianin engnge a siam hmasa ber? | Lei | Van | Eng | Tuialhthei | C | Genesis 1:3 | Pathianin Eng awm rawh se a ti a',
    },
    verse_detective: {
      formatTitle: 'BIG PASTE BOX - VERSE DETECTIVE FORMAT',
      placeholder: 'VerseText | True/False | CorrectText | VerseRef',
      template:
        'Lalpa chu mi vengtu a ni | False | Lalpa chu ka beram vengtu a ni | Sam 23:1',
    },
    word_scramble: {
      formatTitle: 'BIG PASTE BOX - WORD SCRAMBLE FORMAT',
      placeholder: 'ScrambledWord | CorrectWord | Hint | VerseRef',
      template: 'NAPTHIA | PATHIAN | Khawvel siamtu | Genesis 1:1',
    },
    connect_pair: {
      formatTitle: 'BIG PASTE BOX - CONNECT THE PAIR FORMAT',
      placeholder: 'LeftItem | RightItem',
      template: 'Mosea | Exodus\nDavida | Sam\nPetera | Tirhkoh\nPaula | Rome',
    },
    emoji_story: {
      formatTitle: 'BIG PASTE BOX - EMOJI STORY FORMAT',
      placeholder: 'EmojiClue | Question | A | B | C | D | Answer',
      template:
        'Tui chunga kal emoji | Tu nge tui chunga kal? | Mosea | Elia | Isua | Jona | C',
    },
    two_truths_one_lie: {
      formatTitle: 'BIG PASTE BOX - 2 TRUTHS 1 LIE FORMAT',
      placeholder: 'Statement1 | Statement2 | Statement3 | LieNumber | Explanation',
      template:
        'Davida chu Goliatha thattu a ni | Davida chu Saula fapa a ni | Davida chu Bethlehem a piang a ni | 2 | Davida chu Isai-a fapa a ni',
    },
    fill_blank: {
      formatTitle: 'BIG PASTE BOX - FILL THE BLANK FORMAT',
      placeholder: 'Sentence with blank | CorrectWord | Wrong1 | Wrong2 | VerseRef',
      template: 'Amah chu ___ leh Omega a ni | Alpha | Beta | Gamma | Thupuan 22:13',
    },
  };

  const currentTypeConfig =
    COMPETITION_TYPE_CONFIG[compType] || COMPETITION_TYPE_CONFIG.mcq_classic;

  // Helper to show total count by type in preview (e.g., "5 MCQ, 5 Scramble, 5 Detective")
  const getQuestionTypeBreakdown = (qList: BibleQuestion[]): string => {
    const counts: Record<string, number> = {
      MCQ: 0,
      Scramble: 0,
      Detective: 0,
      Pair: 0,
      Emoji: 0,
      Lie: 0,
      Blank: 0,
    };

    qList.forEach((q) => {
      switch (q.type) {
        case 'mcq_classic':
          counts.MCQ++;
          break;
        case 'word_scramble':
          counts.Scramble++;
          break;
        case 'verse_detective':
          counts.Detective++;
          break;
        case 'connect_pair':
          counts.Pair++;
          break;
        case 'emoji_story':
          counts.Emoji++;
          break;
        case 'two_truths_one_lie':
          counts.Lie++;
          break;
        case 'fill_blank':
          counts.Blank++;
          break;
        default:
          counts.MCQ++;
          break;
      }
    });

    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => `${count} ${label}`)
      .join(', ');
  };

  // Validate and parse a single non-pair question line for a given question type
  const parseSingleQuestionLine = (
    targetType: Exclude<BibleCompetitionType, 'mixed_mode' | 'connect_pair'>,
    parts: string[],
    lineNum: number,
    qIndex: number
  ): { question?: BibleQuestion; error?: string } => {
    if (targetType === 'mcq_classic') {
      // Format: Question | A | B | C | D | Answer | VerseRef | VerseText
      if (parts.length < 8 || parts.slice(0, 8).some((p) => !p)) {
        return {
          error: `Line ${lineNum} format a dik lo. MCQ format tur: Question | A | B | C | D | Answer | VerseRef | VerseText`,
        };
      }
      const question = parts[0];
      const options = [parts[1], parts[2], parts[3], parts[4]];
      const ansKey = parts[5].toUpperCase();
      let correctIdx = -1;
      if (ansKey === 'A' || ansKey === '1') correctIdx = 0;
      else if (ansKey === 'B' || ansKey === '2') correctIdx = 1;
      else if (ansKey === 'C' || ansKey === '3') correctIdx = 2;
      else if (ansKey === 'D' || ansKey === '4') correctIdx = 3;
      else {
        correctIdx = options.findIndex(
          (o) => o.toLowerCase() === parts[5].toLowerCase()
        );
      }

      if (correctIdx === -1) {
        return {
          error: `Line ${lineNum}-ah Answer ("${parts[5]}") a dik lo. A, B, C, emaw D chhu lut rawh.`,
        };
      }

      return {
        question: {
          id: `q-paste-${qIndex}`,
          type: 'mcq_classic',
          question,
          options,
          correctAnswer: correctIdx,
          verseRef: parts[6],
          verseText: parts[7],
          points: pointsPerQ,
          hasHiddenChest: qIndex === 1,
        },
      };
    }

    if (targetType === 'verse_detective') {
      // Format: VerseText | True/False | CorrectText | VerseRef
      if (parts.length !== 4 || parts.slice(0, 4).some((p) => !p)) {
        return {
          error: `Line ${lineNum} format a dik lo. DETECTIVE format tur: VerseText | True/False | CorrectText | VerseRef`,
        };
      }
      const tfRaw = parts[1].toLowerCase();
      const isValidBool = ['true', 'false', 'dik', 'diklo', 'dik lo'].includes(tfRaw);
      if (!isValidBool) {
        return {
          error: `Line ${lineNum}-ah True/False ("${parts[1]}") a dik lo. True emaw False chhu lut rawh.`,
        };
      }
      const isTrue = tfRaw === 'true' || tfRaw === 'dik';

      return {
        question: {
          id: `q-paste-${qIndex}`,
          type: 'verse_detective',
          question: parts[0],
          isCorrect: isTrue,
          correctionNote: parts[2],
          verseRef: parts[3],
          verseText: parts[2],
          points: pointsPerQ,
          hasHiddenChest: qIndex === 1,
        },
      };
    }

    if (targetType === 'word_scramble') {
      // Format: ScrambledWord | CorrectWord | Hint | VerseRef
      if (parts.length !== 4 || parts.slice(0, 4).some((p) => !p)) {
        return {
          error: `Line ${lineNum} format a dik lo. SCRAMBLE format tur: ScrambledWord | CorrectWord | Hint | VerseRef`,
        };
      }
      return {
        question: {
          id: `q-paste-${qIndex}`,
          type: 'word_scramble',
          question: `Hint: ${parts[2]}`,
          scrambledWord: parts[0].toUpperCase(),
          correctWord: parts[1].toUpperCase(),
          verseRef: parts[3],
          verseText: `${parts[2]} (${parts[1].toUpperCase()})`,
          points: pointsPerQ,
          hasHiddenChest: qIndex === 1,
        },
      };
    }

    if (targetType === 'emoji_story') {
      // Format: EmojiClue | Question | A | B | C | D | Answer
      if (parts.length !== 7 || parts.slice(0, 7).some((p) => !p)) {
        return {
          error: `Line ${lineNum} format a dik lo. EMOJI format tur: EmojiClue | Question | A | B | C | D | Answer`,
        };
      }
      const emojiClue = parts[0];
      const questionText = parts[1];
      const options = [parts[2], parts[3], parts[4], parts[5]];
      const ansKey = parts[6].toUpperCase();
      let correctIdx = -1;
      if (ansKey === 'A' || ansKey === '1') correctIdx = 0;
      else if (ansKey === 'B' || ansKey === '2') correctIdx = 1;
      else if (ansKey === 'C' || ansKey === '3') correctIdx = 2;
      else if (ansKey === 'D' || ansKey === '4') correctIdx = 3;
      else {
        correctIdx = options.findIndex(
          (o) => o.toLowerCase() === parts[6].toLowerCase()
        );
      }

      if (correctIdx === -1) {
        return {
          error: `Line ${lineNum}-ah Answer ("${parts[6]}") a dik lo. A, B, C, emaw D chhu lut rawh.`,
        };
      }

      return {
        question: {
          id: `q-paste-${qIndex}`,
          type: 'emoji_story',
          question: `${emojiClue} — ${questionText}`,
          options,
          correctAnswer: correctIdx,
          verseRef: 'Emoji Bible Story',
          verseText: `${questionText} — Chhanna dik: ${options[correctIdx]}`,
          points: pointsPerQ,
          hasHiddenChest: qIndex === 1,
        },
      };
    }

    if (targetType === 'two_truths_one_lie') {
      // Format: Statement1 | Statement2 | Statement3 | LieNumber | Explanation
      if (parts.length !== 5 || parts.slice(0, 5).some((p) => !p)) {
        return {
          error: `Line ${lineNum} format a dik lo. LIE format tur: Statement1 | Statement2 | Statement3 | LieNumber | Explanation`,
        };
      }
      const lieNumRaw = parts[3].toUpperCase();
      let lieIdx = -1;
      if (lieNumRaw === '1' || lieNumRaw === 'A') lieIdx = 0;
      else if (lieNumRaw === '2' || lieNumRaw === 'B') lieIdx = 1;
      else if (lieNumRaw === '3' || lieNumRaw === 'C') lieIdx = 2;

      if (lieIdx === -1) {
        return {
          error: `Line ${lineNum}-ah LieNumber ("${parts[3]}") a dik lo. 1, 2, emaw 3 chhu lut rawh.`,
        };
      }

      return {
        question: {
          id: `q-paste-${qIndex}`,
          type: 'two_truths_one_lie',
          question: 'He thu 3 zinga a DAW (Lie) ber thlang chhuak rawh:',
          statements: [
            { text: parts[0], isLie: lieIdx === 0 },
            { text: parts[1], isLie: lieIdx === 1 },
            { text: parts[2], isLie: lieIdx === 2 },
          ],
          lieExplanation: parts[4],
          verseRef: '2 Truths 1 Lie',
          verseText: parts[4],
          points: pointsPerQ,
          hasHiddenChest: qIndex === 1,
        },
      };
    }

    // fill_blank
    // Format: Sentence with blank | CorrectWord | Wrong1 | Wrong2 | VerseRef
    if (parts.length !== 5 || parts.slice(0, 5).some((p) => !p)) {
      return {
        error: `Line ${lineNum} format a dik lo. BLANK format tur: Sentence with ___ | CorrectWord | Wrong1 | Wrong2 | VerseRef`,
      };
    }
    const sentence = parts[0];
    const correctWord = parts[1];
    const rawOptions = [correctWord, parts[2], parts[3]];
    const shuffledOptions = [...rawOptions].sort(() => Math.random() - 0.5);
    const correctIdx = shuffledOptions.indexOf(correctWord);

    return {
      question: {
        id: `q-paste-${qIndex}`,
        type: 'fill_blank',
        question: sentence,
        options: shuffledOptions,
        correctAnswer: correctIdx >= 0 ? correctIdx : 0,
        correctWord,
        verseRef: parts[4],
        verseText: sentence.includes('___')
          ? sentence.replace('___', correctWord)
          : `${sentence} (${correctWord})`,
        points: pointsPerQ,
        hasHiddenChest: qIndex === 1,
      },
    };
  };

  // Convert raw paste box into BibleQuestion array (strictly validating selected type or Mixed Mode tags)
  const handleParsePasteBox = () => {
    setPasteError('');
    setParsedQuestions([]);

    if (!rawPasteBox.trim()) {
      setPasteError('Paste box a ruak. Khawngaihin thu chhu lut rawh.');
      return;
    }

    const lines = rawPasteBox
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('#'));

    if (lines.length === 0) {
      setPasteError('Paste box a ruak. Khawngaihin thu chhu lut rawh.');
      return;
    }

    const parsed: BibleQuestion[] = [];

    // 1. MIXED MODE: Each line starts with TYPE tag (MCQ:, SCRAMBLE:, DETECTIVE:, PAIR:, EMOJI:, LIE:, BLANK:)
    if (compType === 'mixed_mode') {
      const tagMap: Record<string, Exclude<BibleCompetitionType, 'mixed_mode'>> = {
        MCQ: 'mcq_classic',
        SCRAMBLE: 'word_scramble',
        DETECTIVE: 'verse_detective',
        PAIR: 'connect_pair',
        EMOJI: 'emoji_story',
        LIE: 'two_truths_one_lie',
        BLANK: 'fill_blank',
      };

      let pendingPairs: { left: string; right: string }[] = [];

      const flushPendingPairs = () => {
        if (pendingPairs.length === 0) return;
        const chunkSize = pendingPairs.length <= 6 ? pendingPairs.length : 4;
        for (let c = 0; c < pendingPairs.length; c += chunkSize) {
          const chunk = pendingPairs.slice(c, c + chunkSize);
          parsed.push({
            id: `q-paste-${parsed.length + 1}`,
            type: 'connect_pair',
            question: 'A hnuaia mi te hi a inmil zelin zawm rawh le:',
            pairs: chunk,
            verseRef: 'Bible Inzawmna',
            verseText: chunk.map((p) => `${p.left} ➔ ${p.right}`).join(' • '),
            points: pointsPerQ,
            hasHiddenChest: parsed.length === 0,
          });
        }
        pendingPairs = [];
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) {
          setPasteError(
            `Line ${i + 1}-ah TYPE tag a awm lo. Mixed Mode-ah chuan line tin hi MCQ:, SCRAMBLE:, DETECTIVE:, PAIR:, EMOJI:, LIE:, emaw BLANK: in a intan tur a ni.`
          );
          return;
        }

        const rawTag = line.slice(0, colonIdx).trim().toUpperCase();
        const mappedType = tagMap[rawTag];
        if (!mappedType) {
          setPasteError(
            `Line ${i + 1}-ah TYPE tag ("${rawTag}:") a dik lo. Tag hman theihte: MCQ:, SCRAMBLE:, DETECTIVE:, PAIR:, EMOJI:, LIE:, BLANK:`
          );
          return;
        }

        const contentAfterTag = line.slice(colonIdx + 1).trim();
        const parts = contentAfterTag.split('|').map((p) => p.trim());

        if (mappedType === 'connect_pair') {
          if (parts.length !== 2 || !parts[0] || !parts[1]) {
            setPasteError(
              `Line ${i + 1} format a dik lo. PAIR format tur: PAIR: LeftItem | RightItem`
            );
            return;
          }
          pendingPairs.push({ left: parts[0], right: parts[1] });
        } else {
          flushPendingPairs();
          const result = parseSingleQuestionLine(
            mappedType,
            parts,
            i + 1,
            parsed.length + 1
          );
          if (result.error) {
            setPasteError(result.error);
            return;
          }
          if (result.question) {
            parsed.push(result.question);
          }
        }
      }

      flushPendingPairs();

      if (parsed.length === 0) {
        setPasteError('Zawhna convert theih a awm lo. Khawngaihin format enfiah rawh.');
        return;
      }

      setParsedQuestions(parsed);
      setPasteError('');
      return;
    }

    // 2. SINGLE-TYPE CONNECT THE PAIR: each line is "LeftItem | RightItem"
    if (compType === 'connect_pair') {
      const pairList: { left: string; right: string }[] = [];
      for (let i = 0; i < lines.length; i++) {
        const cleanLine = lines[i].replace(/^PAIR\s*:\s*/i, '');
        const parts = cleanLine.split('|').map((p) => p.trim());
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
          setPasteError(
            `Line ${i + 1} format a dik lo. Connect The Pair format tur: LeftItem | RightItem`
          );
          return;
        }
        pairList.push({ left: parts[0], right: parts[1] });
      }

      if (pairList.length < 2) {
        setPasteError(
          'Connect The Pair-ah hian inmil tur (LeftItem | RightItem) line 2 tal a awm tur a ni.'
        );
        return;
      }

      const chunkSize = pairList.length <= 6 ? pairList.length : 4;
      for (let c = 0; c < pairList.length; c += chunkSize) {
        const chunk = pairList.slice(c, c + chunkSize);
        parsed.push({
          id: `q-paste-${parsed.length + 1}`,
          type: 'connect_pair',
          question: 'A hnuaia mi te hi a inmil zelin zawm rawh le:',
          pairs: chunk,
          verseRef: 'Bible Inzawmna',
          verseText: chunk.map((p) => `${p.left} ➔ ${p.right}`).join(' • '),
          points: pointsPerQ,
          hasHiddenChest: c === 0,
        });
      }

      setParsedQuestions(parsed);
      setPasteError('');
      return;
    }

    // 3. SINGLE-TYPE VALIDATION FOR THE OTHER 6 TYPES
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split('|').map((p) => p.trim());
      const result = parseSingleQuestionLine(compType, parts, i + 1, i + 1);
      if (result.error) {
        setPasteError(result.error);
        return;
      }
      if (result.question) {
        parsed.push(result.question);
      }
    }

    if (parsed.length === 0) {
      setPasteError(
        `Thu chhut luh hi ${currentTypeConfig.formatTitle} nen a inmil lo. Format: ${currentTypeConfig.placeholder}`
      );
    } else {
      setParsedQuestions(parsed);
      setPasteError('');
    }
  };

  // Provide quick paste template specific to selected competition type
  const handleLoadTemplate = () => {
    setPasteError('');
    setParsedQuestions([]);
    setRawPasteBox(currentTypeConfig.template);
  };

  // Save or Publish competition
  const handleSaveCompetition = (targetStatus: 'Draft' | 'Active') => {
    if (!compTitle.trim()) {
      alert('Khawngaihin Intihsiakna hming chhu lut rawh.');
      return;
    }

    const questionsToSave =
      parsedQuestions.length > 0
        ? parsedQuestions
        : [
            {
              id: 'q-sample-1',
              type: compType,
              question: 'Bible thu zawhna',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 0,
              verseRef: 'Genesis 1:1',
              verseText: 'A tirin Pathianin lei leh van a siam a.',
              points: pointsPerQ,
            },
          ];

    if (editingCompId) {
      const existing = allComps.find((c) => c.id === editingCompId);
      if (existing) {
        Storage.updateCompetition({
          ...existing,
          title: compTitle.trim(),
          type: compType,
          competitionType: compType,
          description: compDesc.trim(),
          lastDate: compDeadline,
          status: targetStatus,
          timerSeconds,
          pointsPerQuestion: pointsPerQ,
          quizData: {
            timerSeconds,
            pointsPerQuestion: pointsPerQ,
            competitionType: compType,
            questions: questionsToSave,
          },
        });
      }
    } else {
      const created = Storage.addCompetition({
        title: compTitle.trim(),
        type: compType,
        competitionType: compType,
        description: compDesc.trim(),
        lastDate: compDeadline,
        createdBy: currentUser ? `${currentUser.hming} (Developer)` : 'Developer',
        status: targetStatus,
        timerSeconds,
        pointsPerQuestion: pointsPerQ,
        quizData: {
          timerSeconds,
          pointsPerQuestion: pointsPerQ,
          competitionType: compType,
          questions: questionsToSave,
        },
      });
      setSelectedCompId(created.id);
    }

    setShowAdminModal(false);
    setEditingCompId(null);
    onDataChanged();
  };

  // Start Playing Game
  const handleStartGame = (testMode = false) => {
    if (!currentUser && !testMode) {
      onOpenLogin();
      return;
    }

    if (alreadyPlayed && !testMode) {
      alert('He competition hi i chhang tawh a ni! Leaderboard lamah i dinhmun en rawh le.');
      return;
    }

    setIsTestMode(testMode);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setWordScrambleInput('');
    setVerseDetectiveChoice(null);
    setTwoTruthsChoice(null);
    setFillBlankInput('');
    setMatchedPairs({});
    setSelectedLeftPair(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setShowVerseDetail(false);
    setEarnedPointsThisQ(0);
    setTotalGameScore(0);
    setIsFinished(false);
    setViewMode('game');
  };

  // Questions for active competition
  const questions: BibleQuestion[] =
    activeComp?.quizData?.questions || [
      {
        id: 'q-default-1',
        type: 'mcq_classic',
        question: 'Pathianin a tir bera a siam chu eng nge ni?',
        options: ['Lei leh Van', 'Ni leh Thla', 'Mihringte', 'Rannungte'],
        correctAnswer: 0,
        verseRef: 'Genesis 1:1',
        verseText: 'A tirin Pathianin lei leh van a siam a.',
        points: 10,
      },
    ];

  const currentQ = questions[currentQIndex] || questions[0];

  // Submit Answer for Current Question
  const handleAnswerSubmit = (givenAnswer?: any) => {
    if (isAnswered) return;

    let correct = false;

    if (currentQ.type === 'word_scramble') {
      const rawStr = typeof givenAnswer === 'string' ? givenAnswer : wordScrambleInput;
      const cleanGiven = String(rawStr || '').trim().toUpperCase();
      const cleanExpected = String(currentQ.correctWord || '').trim().toUpperCase();
      correct = cleanGiven === cleanExpected;
    } else if (currentQ.type === 'verse_detective') {
      const choice = givenAnswer !== undefined ? givenAnswer : verseDetectiveChoice;
      correct = choice === currentQ.isCorrect;
    } else if (currentQ.type === 'two_truths_one_lie') {
      const lieIndex = currentQ.statements?.findIndex((s) => s.isLie);
      correct = givenAnswer === lieIndex;
    } else if (currentQ.type === 'fill_blank') {
      if (typeof givenAnswer === 'number') {
        const chosenOpt = String(currentQ.options?.[givenAnswer] || '').trim().toLowerCase();
        const expected = String(currentQ.correctWord || '').trim().toLowerCase();
        correct =
          givenAnswer === currentQ.correctAnswer ||
          (expected !== '' && chosenOpt === expected);
      } else {
        const given = String(givenAnswer ?? fillBlankInput ?? '').trim().toLowerCase();
        const expected = String(currentQ.correctWord || '').trim().toLowerCase();
        correct = expected !== '' && given === expected;
      }
    } else if (currentQ.type === 'connect_pair') {
      const allPairs = currentQ.pairs || [];
      const correctMatches = allPairs.filter((p) => matchedPairs[p.left] === p.right);
      correct = correctMatches.length === allPairs.length;
    } else {
      // Default MCQ / Emoji Story
      correct = givenAnswer === currentQ.correctAnswer;
    }

    setIsCorrect(correct);
    setIsAnswered(true);

    const basePts = currentQ.points || activeComp?.pointsPerQuestion || 10;
    const earned = correct ? basePts : 0;

    setEarnedPointsThisQ(earned);
    setTotalGameScore((prev) => prev + earned);

    setTimeout(() => {
      answerRevealRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  // Next Question or Finish
  const handleNextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setWordScrambleInput('');
      setVerseDetectiveChoice(null);
      setTwoTruthsChoice(null);
      setFillBlankInput('');
      setMatchedPairs({});
      setSelectedLeftPair(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setShowVerseDetail(false);
      setEarnedPointsThisQ(0);
    } else {
      handleFinishGame();
    }
  };

  // Finish game & record to League Memory (No bonus points - pure question points only)
  const handleFinishGame = () => {
    setIsFinished(true);

    const totalEarned = totalGameScore;

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 },
      });
    } catch {}

    // Save to permanent League Memory if not in test mode
    if (currentUser && !isTestMode && activeComp) {
      Storage.recordLeaguePlay({
        userId: currentUser.id,
        userName: currentUser.hming,
        userVeng: currentUser.veng,
        competitionId: activeComp.id,
        weekTitle: activeComp.title,
        type: activeComp.competitionType || activeComp.type || 'mcq_classic',
        score: totalGameScore,
        maxScore: questions.reduce((sum, q) => sum + (q.points || 10), 0),
        speedBonus: 0,
        hiddenChestBonus: 0,
        streakBonus: 0,
        totalEarned,
      });

      onDataChanged();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ========================================================================= */}
      {/* TOP HEADER & LEAGUE BANNER                                                */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-900 via-blue-900 to-purple-900 p-5 sm:p-7 text-white shadow-xl border border-blue-700/40">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-black text-amber-300 border border-amber-400/30 backdrop-blur-md mb-2">
              <Trophy className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>KARMEL BIBLE LEAGUE 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Bible Inelna & Chhiarbelh 📖
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
              League Memory & Verse Reveal: Zawhna zawng zawngah Pathian Thu chhiarbelh tura buatsaih a ni.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setViewMode(viewMode === 'leaderboard' ? 'overview' : 'leaderboard')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md ${
                viewMode === 'leaderboard'
                  ? 'bg-amber-400 text-slate-900 hover:bg-amber-300'
                  : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>{viewMode === 'leaderboard' ? 'Intihsiakna En Rawh' : 'Leaderboard 👑'}</span>
            </button>

            {/* DEVELOPER ONLY: Set or Make Competition */}
            {isDeveloper && (
              <button
                onClick={() => {
                  setEditingCompId(null);
                  setCompTitle(`Bible League: Week ${allComps.length + 1} 📖`);
                  setRawPasteBox('');
                  setParsedQuestions([]);
                  setShowAdminModal(true);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Intihsiakna Siam (Developer)</span>
              </button>
            )}
          </div>
        </div>

        {/* User League Personal Card (If Logged In) */}
        {currentUser && userLeague && (
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="bg-amber-400/20 text-amber-300 font-black px-2.5 py-1 rounded-lg border border-amber-400/30">
                I Dinhmun: #{userRankIndex >= 0 ? userRankIndex + 1 : '—'}
              </span>
              <span className="flex items-center gap-1 font-bold text-amber-200">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                {userLeague.currentStreak || 0} Week Streak
              </span>
              <span className="text-blue-200">
                Kumpuan: <strong>{userLeague.weeksPlayed || 0}</strong> Weeks
              </span>
            </div>

            <div className="bg-white/10 px-3.5 py-1 rounded-xl font-mono font-black text-amber-300 text-sm border border-white/15">
              I point zawng zawng: {userLeague.totalPoints || 0} pts
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW: LEADERBOARD                                                         */}
      {/* ========================================================================= */}
      {viewMode === 'leaderboard' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Karmel Bible League - Top Standings 🏆
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Point a pung zel a, a bo ngai lo (Permanent cumulative season score)
                </p>
              </div>

              {isDeveloper && leagueScores.length > 0 && (
                <button
                  onClick={handleClearLeaderboard}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black flex items-center gap-1.5 transition self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Leaderboard 🗑️</span>
                </button>
              )}
            </div>

            {/* Developer Inline Score Editor Modal / Card */}
            {isDeveloper && editingScore && (
              <form
                onSubmit={handleSaveEditScore}
                className="mb-5 p-4 rounded-2xl bg-blue-50/70 border-2 border-blue-200 space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                    ✏️ Leaderboard Point & Hming Siamthatna (Developer)
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingScore(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hming:</label>
                    <input
                      type="text"
                      value={editScoreName}
                      onChange={(e) => setEditScoreName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Veng:</label>
                    <input
                      type="text"
                      value={editScoreVeng}
                      onChange={(e) => setEditScoreVeng(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Total Points:</label>
                    <input
                      type="number"
                      value={editScorePoints}
                      onChange={(e) => setEditScorePoints(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-black text-blue-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs items-end">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Weeks Played:</label>
                    <input
                      type="number"
                      value={editScoreWeeks}
                      onChange={(e) => setEditScoreWeeks(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Streak:</label>
                    <input
                      type="number"
                      value={editScoreStreak}
                      onChange={(e) => setEditScoreStreak(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition"
                    >
                      Save Rawh ✅
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingScore(null)}
                      className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {leagueScores.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                <Trophy className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p>Tuman league point an la nei lo. Intihsiakna chhang hmasa ber rawh le!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {leagueScores.map((score, idx) => {
                  const isUser = currentUser && score.userId === currentUser.id;
                  return (
                    <div
                      key={score.id || idx}
                      className={`flex items-center justify-between p-3.5 rounded-2xl transition border gap-3 ${
                        idx === 0
                          ? 'bg-linear-to-r from-amber-500/15 via-amber-100/40 to-white border-amber-200 shadow-xs'
                          : idx === 1
                          ? 'bg-linear-to-r from-slate-200/50 via-slate-100/30 to-white border-slate-200'
                          : idx === 2
                          ? 'bg-linear-to-r from-amber-700/10 via-amber-600/5 to-white border-amber-700/20'
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      } ${isUser ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/30'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-700/20 text-amber-900 border border-amber-700/30'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 truncate flex items-center gap-1.5">
                            {score.userName}
                            {isUser && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                Nangmah
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{score.userVeng || 'Darlawn'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-orange-600 font-bold">
                              <Flame className="w-3 h-3 fill-orange-500" />
                              {score.currentStreak || 0} Streak
                            </span>
                            <span>•</span>
                            <span>{score.weeksPlayed || 0} Weeks</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right">
                          <div className="text-base font-black font-mono text-blue-900">
                            {score.totalPoints || 0}
                            <span className="text-xs font-semibold text-slate-400 ml-1">pts</span>
                          </div>
                        </div>

                        {isDeveloper && (
                          <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleOpenEditScore(score)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 bg-white transition"
                              title="Edit Score"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteScoreEntry(score)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 bg-white transition"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* User Personal League History Card */}
          {currentUser && userLeague && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100">
              <h3 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                I Chhanna Hmasate (History) 📜
              </h3>

              {userLeague.history && userLeague.history.length > 0 ? (
                <div className="space-y-2">
                  {userLeague.history.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{h.weekTitle}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {h.date} • {h.type.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-black text-emerald-600">+{h.totalEarned} pts</div>
                        <div className="text-[10px] text-slate-400">Score: {h.score}/{h.maxScore}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">A hma a mi a la awm lo.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: OVERVIEW & COMPETITIONS LIST                                        */}
      {/* ========================================================================= */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Active / Draft Competition Selector */}
          {availableComps.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {availableComps.map((comp) => {
                const isSelected = comp.id === activeComp?.id;
                const isCompDraft = comp.status === 'Draft';
                return (
                  <button
                    key={comp.id}
                    onClick={() => setSelectedCompId(comp.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{comp.title}</span>
                    {isCompDraft && (
                      <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded-md font-black">
                        DRAFT 🔒
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Competition Detail Card */}
          {activeComp ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                      {(activeComp.competitionType || activeComp.type) === 'mixed_mode'
                        ? '🔀 Mixed Mode (Mix vek)'
                        : activeComp.competitionType || activeComp.type || 'MCQ Classic'}
                    </span>
                    {questions.length > 0 && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                        {getQuestionTypeBreakdown(questions)}
                      </span>
                    )}
                    {activeComp.status === 'Draft' && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                        Draft Mode (Developer Chauhvin a hmu thei)
                      </span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      Tawp ni: {activeComp.lastDate}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-slate-900">
                    {activeComp.title}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                    {activeComp.description}
                  </p>
                </div>

                {/* Developer Controls for Active Competition */}
                {isDeveloper && (
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* One-Tap Publish / Unpublish Toggle */}
                    <button
                      onClick={() => handleTogglePublish(activeComp)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                        activeComp.status === 'Draft'
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                      }`}
                      title={activeComp.status === 'Draft' ? 'Publish to Members' : 'Move to Draft'}
                    >
                      {activeComp.status === 'Draft' ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Publish Live 🚀</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Draft-ah Dah Rawh 🔒</span>
                        </>
                      )}
                    </button>

                    {/* Question Inspector Toggle */}
                    <button
                      onClick={() => setShowQuestionInspector((prev) => !prev)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                        showQuestionInspector
                          ? 'bg-blue-50 text-blue-700 border-blue-300 font-black'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                      <span>{showQuestionInspector ? 'Inspector Khar' : 'Inspect Questions 🔍'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingCompId(activeComp.id);
                        setCompTitle(activeComp.title);
                        setCompType((activeComp.competitionType as any) || 'mcq_classic');
                        setCompDesc(activeComp.description);
                        setCompDeadline(activeComp.lastDate);
                        setTimerSeconds(activeComp.timerSeconds || 20);
                        setPointsPerQ(activeComp.pointsPerQuestion || 10);
                        setCompStatus(activeComp.status as any);
                        setParsedQuestions(activeComp.quizData?.questions || []);
                        setShowAdminModal(true);
                      }}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition"
                      title="Edit Competition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Intihsiakna "${activeComp.title}" hi delete i duh tak tak em?`)) {
                          Storage.deleteCompetition(activeComp.id);
                          onDataChanged();
                        }
                      }}
                      className="p-2 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 transition"
                      title="Delete Competition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Game Metadata Badges */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-5 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="text-slate-400 font-medium">Zawhna zat</div>
                    <div className="font-black text-slate-900">
                      {activeComp.quizData?.questions?.length || 3} Zawhna
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-slate-400 font-medium">Timer / zawhna</div>
                    <div className="font-black text-slate-900">
                      {activeComp.quizData?.timerSeconds || activeComp.timerSeconds || 20}s
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                  <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-slate-400 font-medium">Point / zawhna</div>
                    <div className="font-black text-slate-900">
                      {activeComp.quizData?.pointsPerQuestion || activeComp.pointsPerQuestion || 10} pts
                    </div>
                  </div>
                </div>
              </div>

              {/* DEVELOPER QUESTION INSPECTOR ACCORDION */}
              {isDeveloper && showQuestionInspector && (
                <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Developer Question Inspector & Verse Audit ({questions.length} Zawhna)
                      </h4>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                      Developer Chauhvin a hmu thei
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {questions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black shrink-0">
                              {qIdx + 1}
                            </span>
                            <span>{q.question}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono font-bold uppercase shrink-0">
                            {q.type || 'mcq'}
                          </span>
                        </div>

                        {/* Options / Answers check */}
                        {q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-7">
                            {q.options.map((opt, optIdx) => {
                              const isCorrectOpt = optIdx === q.correctAnswer;
                              return (
                                <div
                                  key={optIdx}
                                  className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between ${
                                    isCorrectOpt
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                      : 'bg-slate-50 border-slate-100 text-slate-500'
                                  }`}
                                >
                                  <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                  {isCorrectOpt && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'word_scramble' && (
                          <div className="pl-7 flex items-center gap-2 font-mono">
                            <span className="text-slate-500">Scrambled: {q.scrambledWord}</span>
                            <span>➔</span>
                            <span className="text-emerald-700 font-bold">Correct: {q.correctWord}</span>
                          </div>
                        )}

                        {q.type === 'verse_detective' && (
                          <div className="pl-7 flex items-center gap-2">
                            <span className="font-bold">Chhanna Dik:</span>
                            <span className={q.isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                              {q.isCorrect ? 'A DIK E ✅' : 'A DIK LO ❌'}
                            </span>
                            {q.correctionNote && <span className="text-slate-500">({q.correctionNote})</span>}
                          </div>
                        )}

                        {q.type === 'connect_pair' && q.pairs && (
                          <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {q.pairs.map((p, pIdx) => (
                              <div
                                key={pIdx}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between"
                              >
                                <span>{p.left}</span>
                                <span className="text-emerald-600">➔</span>
                                <span>{p.right}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {q.type === 'two_truths_one_lie' && q.statements && (
                          <div className="pl-7 space-y-1">
                            {q.statements.map((st, stIdx) => (
                              <div
                                key={stIdx}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between ${
                                  st.isLie
                                    ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                                    : 'bg-slate-50 border-slate-100 text-slate-600'
                                }`}
                              >
                                <span>{stIdx + 1}. {st.text}</span>
                                {st.isLie && (
                                  <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-black">
                                    LIE (DAW)
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Verse Reveal Preview */}
                        <div className="pl-7 pt-1 border-t border-slate-100 flex items-start gap-2 text-slate-600 italic">
                          <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="not-italic text-amber-900 font-mono text-[11px] mr-1.5">
                              {q.verseRef}:
                            </strong>
                            "{q.verseText}"
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Play Action or Already Played Notice */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                {alreadyPlayed ? (
                  <div className="flex items-center gap-3 bg-emerald-50 text-emerald-900 p-4 rounded-2xl border border-emerald-200 w-full sm:w-auto">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-black text-sm">I lo chhang tawh e ✅</div>
                      <div className="text-xs text-emerald-700">
                        Score: {pastSubmission?.score} pts • Total Earned: {pastSubmission?.totalEarned} pts. Vawikhat chauh chhan theih a ni.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    * Vawikhat chauh chhan theih a ni ang (One play only rule).
                  </div>
                )}

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
                  {/* Developer Test Draft Mode (Can test play anytime) */}
                  {isDeveloper && (
                    <button
                      onClick={() => handleStartGame(true)}
                      className="px-4 py-3 rounded-2xl text-xs font-black bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition flex items-center gap-2 active:scale-95"
                      title="Developer Test Mode: Chhan chhinna (League score a tawk lo vang)"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Test Draft Play 🧪</span>
                    </button>
                  )}

                  {!alreadyPlayed ? (
                    <button
                      onClick={() => handleStartGame(false)}
                      className="px-6 py-3 rounded-2xl text-sm font-black bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 w-full sm:w-auto"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Tan Rawh 🚀</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setViewMode('leaderboard')}
                      className="px-6 py-3 rounded-2xl text-sm font-black bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>Leaderboard En Rawh</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 text-slate-500 max-w-lg mx-auto p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
                <BookOpen className="w-8 h-8" />
              </div>
              {isDeveloper ? (
                <div className="space-y-3">
                  <h3 className="text-base font-black text-slate-900">
                    Intihsiakna siam a la awm lo
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Developer i nih angin, a chunga <strong>"Intihsiakna Siam (Developer)"</strong> hmet la, Big Paste Box hmangin inelna thar siam rawh le. Draft-ah i save phawt thei a, i test zawhah chauh mipui tan i publish dawn nia!
                  </p>
                  <button
                    onClick={() => {
                      setEditingCompId(null);
                      setCompTitle(`Bible League: Week 1 📖`);
                      setRawPasteBox('');
                      setParsedQuestions([]);
                      setShowAdminModal(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md shadow-emerald-500/25 active:scale-95 inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Intihsiakna Siam Rawh (Developer)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-base font-black text-slate-900">
                    Intihsiakna chhan tur a la awm rih lo e
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Developer-in inelna thar a publish hunah notification i dawng ang a, point hlawhchhuak tur leh Bible zir turin lo lut ve rawh le! 📖
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: LIVE GAMEPLAY & VERSE REVEAL                                        */}
      {/* ========================================================================= */}
      {viewMode === 'game' && !isFinished && (
        <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-lg border border-blue-100 relative overflow-hidden">
          {/* Test Mode Warning Banner */}
          {isTestMode && (
            <div className="mb-4 -mt-2 -mx-2 bg-amber-400/20 text-amber-900 border border-amber-400/40 p-2.5 rounded-xl text-xs font-black flex items-center justify-between">
              <span>🧪 TEST DRAFT MODE (Developer Chhinna) - League Memory-ah a lut lo vang.</span>
              <button
                onClick={() => setViewMode('overview')}
                className="underline text-amber-950 font-bold"
              >
                Tawpna
              </button>
            </div>
          )}

          {/* Top Bar: Progress & Timer */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
              <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg">
                Zawhna {currentQIndex + 1} / {questions.length}
              </span>
              <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg font-black uppercase tracking-wide">
                {currentQ.type === 'word_scramble'
                  ? '🔤 Word Scramble'
                  : currentQ.type === 'verse_detective'
                  ? '🔍 Verse Detective'
                  : currentQ.type === 'connect_pair'
                  ? '🧩 Connect The Pair'
                  : currentQ.type === 'emoji_story'
                  ? '😇 Emoji Story'
                  : currentQ.type === 'two_truths_one_lie'
                  ? '🤥 2 Truths 1 Lie'
                  : currentQ.type === 'fill_blank'
                  ? '✍️ Fill The Blank'
                  : '🧠 MCQ Classic'}
              </span>
              <span>•</span>
              <span className="font-mono text-emerald-600 font-bold">
                Point: {totalGameScore} pts
              </span>
            </div>

            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black font-mono border ${
                secondsLeft <= 5
                  ? 'bg-rose-50 text-rose-600 border-rose-200 animate-bounce'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{secondsLeft}s</span>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* QUESTION TYPE INTERFACES                                      */}
          {/* ------------------------------------------------------------- */}

          {/* 1. WORD SCRAMBLE UI */}
          {currentQ.type === 'word_scramble' && (
            <div className="space-y-4 mb-6">
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 text-center space-y-3">
                <div className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                  Thumal chhiarlet tur (Hawrawp hmetin rem rawh emaw chhu lut rawh):
                </div>
                <div className="text-3xl sm:text-4xl font-black tracking-widest text-amber-900 font-mono">
                  {currentQ.scrambledWord}
                </div>

                {!isAnswered && currentQ.scrambledWord && (
                  <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                    {currentQ.scrambledWord.split('').map((char, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => setWordScrambleInput((prev) => (prev + char).toUpperCase())}
                        className="w-10 h-10 rounded-xl bg-white border-2 border-amber-300 hover:border-amber-500 text-amber-950 font-black font-mono text-base shadow-xs active:scale-95 transition"
                      >
                        {char}
                      </button>
                    ))}
                    {wordScrambleInput.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setWordScrambleInput('')}
                        className="px-3 h-10 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition"
                      >
                        Clear ✕
                      </button>
                    )}
                  </div>
                )}
              </div>

              {!isAnswered ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={wordScrambleInput}
                    onChange={(e) => setWordScrambleInput(e.target.value.toUpperCase())}
                    placeholder="Chhanna dik chhu lut rawh..."
                    className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-slate-200 font-bold uppercase tracking-wider text-base focus:border-blue-600 focus:outline-hidden"
                    autoFocus
                  />
                  <button
                    onClick={() => handleAnswerSubmit()}
                    disabled={!wordScrambleInput.trim()}
                    className="px-6 py-3.5 rounded-2xl bg-blue-600 text-white font-black text-sm disabled:opacity-50 hover:bg-blue-700 transition"
                  >
                    Theh Lut
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* 2. VERSE DETECTIVE UI */}
          {currentQ.type === 'verse_detective' && (
            <div className="space-y-3 mb-6">
              {!isAnswered ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setVerseDetectiveChoice(true);
                      handleAnswerSubmit(true);
                    }}
                    className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-900 font-black text-lg flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span>A DIK E ✅</span>
                  </button>
                  <button
                    onClick={() => {
                      setVerseDetectiveChoice(false);
                      handleAnswerSubmit(false);
                    }}
                    className="p-5 rounded-2xl border-2 border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-900 font-black text-lg flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <XCircle className="w-6 h-6 text-rose-600" />
                    <span>A DIK LO ❌</span>
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* 3. 2 TRUTHS 1 LIE UI */}
          {currentQ.type === 'two_truths_one_lie' && (
            <div className="space-y-3 mb-6">
              <div className="text-xs font-bold text-slate-500 mb-1">
                A hnuaia thu 3 zinga a DAW (Lie) ber hi hmet rawh le:
              </div>
              {currentQ.statements?.map((stmt, idx) => {
                const isLie = stmt.isLie;
                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => {
                      setTwoTruthsChoice(idx);
                      handleAnswerSubmit(idx);
                    }}
                    className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-sm transition flex items-center justify-between gap-3 ${
                      !isAnswered
                        ? 'border-slate-200 hover:border-blue-400 bg-white'
                        : isLie
                        ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400'
                        : twoTruthsChoice === idx
                        ? 'border-slate-300 bg-slate-100 text-slate-500 opacity-60'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    }`}
                  >
                    <span>{stmt.text}</span>
                    {isAnswered && isLie && (
                      <span className="text-xs bg-rose-600 text-white font-black px-2 py-0.5 rounded-md">
                        HEI HI A DAW!
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 4. CONNECT THE PAIRS UI */}
          {currentQ.type === 'connect_pair' && (
            <div className="space-y-4 mb-6">
              <div className="text-xs font-bold text-slate-500">
                A veilam hmet la, a dinglam a inmil zawn zawm rawh le:
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  {currentQ.pairs?.map((p, idx) => (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => setSelectedLeftPair(p.left)}
                      className={`w-full p-3 rounded-xl border-2 text-left text-xs font-black transition ${
                        selectedLeftPair === p.left
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : matchedPairs[p.left]
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {p.left} {matchedPairs[p.left] && `➔ ${matchedPairs[p.left]}`}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {[...(currentQ.pairs || [])]
                    .sort((a, b) => a.right.localeCompare(b.right))
                    .map((p, idx) => (
                      <button
                        key={idx}
                        disabled={isAnswered || !selectedLeftPair}
                        onClick={() => {
                          if (selectedLeftPair) {
                            setMatchedPairs((prev) => ({
                              ...prev,
                              [selectedLeftPair]: p.right,
                            }));
                            setSelectedLeftPair(null);
                          }
                        }}
                        className="w-full p-3 rounded-xl border-2 text-left text-xs font-bold border-slate-200 bg-white hover:border-blue-400 transition"
                      >
                        {p.right}
                      </button>
                    ))}
                </div>
              </div>

              {!isAnswered && (
                <button
                  onClick={() => handleAnswerSubmit()}
                  disabled={Object.keys(matchedPairs).length < (currentQ.pairs?.length || 0)}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-black text-sm disabled:opacity-40"
                >
                  Zawm zawh a ni e (Theh lut rawh)
                </button>
              )}
            </div>
          )}

          {/* 5. MCQ CLASSIC, EMOJI STORY & FILL THE BLANK UI */}
          {(currentQ.type === 'mcq_classic' ||
            currentQ.type === 'emoji_story' ||
            currentQ.type === 'fill_blank' ||
            !currentQ.type) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {currentQ.options?.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrectOption = idx === currentQ.correctAnswer;
                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => {
                      setSelectedOption(idx);
                      handleAnswerSubmit(idx);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left font-bold text-sm transition flex items-center justify-between gap-3 active:scale-98 ${
                      !isAnswered
                        ? 'border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/30'
                        : isCorrectOption
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400'
                        : isSelected
                        ? 'border-rose-400 bg-rose-50 text-rose-950'
                        : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </span>

                    {isAnswered && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VERSE REVEAL ANIMATED CARD (MUST HAVE FEATURE)                           */}
          {/* ========================================================================= */}
          {isAnswered && (
            <div ref={answerRevealRef} className="space-y-4 animate-in fade-in duration-300">
              {/* Immediate Feedback Banner */}
              <div
                className={`p-4 rounded-2xl flex items-center justify-between gap-3 font-black text-sm border ${
                  isCorrect
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 shrink-0" />
                  )}
                  <span>
                    {isCorrect
                      ? `A DIK E! 🎉 (+${earnedPointsThisQ} pts)`
                      : 'A DIK LO E! ❌'}
                  </span>
                </div>
              </div>

              {/* The Dedicated Verse Reveal Box */}
              <div className="rounded-3xl bg-linear-to-br from-amber-500/10 via-amber-100/30 to-blue-50/50 p-5 sm:p-6 border-2 border-amber-300/80 shadow-md relative overflow-hidden">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                    <BookOpen className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black tracking-wider text-amber-900 uppercase">
                        He Chang Hi En Rawh:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400/30 text-amber-950 font-black text-xs font-mono">
                        {currentQ.verseRef}
                      </span>
                    </div>

                    <p className="mt-2 text-sm sm:text-base font-serif italic text-slate-800 leading-relaxed bg-white/70 p-3.5 rounded-2xl border border-amber-200">
                      "{currentQ.verseText}"
                    </p>

                    {/* Additional word scramble or lie explanation */}
                    {currentQ.type === 'word_scramble' && (
                      <div className="mt-2 text-xs text-amber-900 font-bold">
                        Thumal Dik: <span className="font-mono text-sm">{currentQ.correctWord}</span>
                      </div>
                    )}
                    {currentQ.type === 'two_truths_one_lie' && (
                      <div className="mt-2 text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                        <strong>Hrilhfiahna:</strong> {currentQ.lieExplanation}
                      </div>
                    )}
                    {currentQ.type === 'verse_detective' && currentQ.correctionNote && (
                      <div className="mt-2 text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                        <strong>Hriattirna:</strong> {currentQ.correctionNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Next Question */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm transition flex items-center gap-2 shadow-lg active:scale-95"
                >
                  <span>
                    {currentQIndex < questions.length - 1
                      ? 'Zawhna Dawtleh ➡️'
                      : 'Theh Lut & En Rawh 🏆'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: FINISH CELEBRATION & SCORECARD                                      */}
      {/* ========================================================================= */}
      {viewMode === 'game' && isFinished && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100 text-center max-w-lg mx-auto space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-400/30 text-3xl">
            👑
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">
              I zo fel ta e! Chibai le! 🎉
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pathian Thu i zirbelh a, point pawh i hlawhchhuak e.
            </p>
          </div>

          {/* Points Breakdown */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-3 text-left">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">Zawhna Score:</span>
              <span className="font-mono font-bold text-slate-900">{totalGameScore} pts</span>
            </div>
            {totalSpeedBonus > 0 && (
              <div className="flex justify-between items-center text-sm text-yellow-700">
                <span className="flex items-center gap-1 font-medium">
                  <Zap className="w-4 h-4 fill-yellow-500" /> Speed Bonus (&lt;5s):
                </span>
                <span className="font-mono font-bold">+{totalSpeedBonus} pts</span>
              </div>
            )}
            {totalChestBonus > 0 && (
              <div className="flex justify-between items-center text-sm text-purple-700">
                <span className="flex items-center gap-1 font-medium">
                  <Gift className="w-4 h-4 fill-purple-500" /> Bawm Thup (Hidden Chest):
                </span>
                <span className="font-mono font-bold">+{totalChestBonus} pts</span>
              </div>
            )}
            {streakBonus > 0 && (
              <div className="flex justify-between items-center text-sm text-orange-700">
                <span className="flex items-center gap-1 font-medium">
                  <Flame className="w-4 h-4 fill-orange-500" /> 4-Week Streak Bonus:
                </span>
                <span className="font-mono font-bold">+{streakBonus} pts</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="font-black text-slate-900 text-sm">Point Hlawhchhuah Zawng:</span>
              <span className="font-mono font-black text-blue-600 text-xl">
                +{totalGameScore + totalSpeedBonus + totalChestBonus + streakBonus} pts
              </span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setViewMode('leaderboard')}
              className="flex-1 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Leaderboard En Rawh</span>
            </button>
            <button
              onClick={() => setViewMode('overview')}
              className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
            >
              Kirmir Rawh
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DEVELOPER ONLY: BIG PASTE BOX & COMPETITION CREATOR MODAL                 */}
      {/* ========================================================================= */}
      {showAdminModal && isDeveloper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingCompId ? 'Intihsiakna Siamthatna' : 'Intihsiakna Thar Siam (Developer Only)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Big Paste Box hmangin Quiz leh Inelna awlsam takin siam rawh
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Competition Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                1. Intihsiakna Chi (Type thlang rawh):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'mixed_mode', label: '🔀 Mixed Mode (Mix vek)', sub: 'Type hrang hrang mix' },
                  { id: 'mcq_classic', label: '🧠 MCQ Classic', sub: 'Zawhna pangngai' },
                  { id: 'verse_detective', label: '🔍 Verse Detective', sub: 'Chang dik/diklo' },
                  { id: 'word_scramble', label: '🔤 Word Scramble', sub: 'Thumal chhiarlet' },
                  { id: 'connect_pair', label: '🧩 Connect The Pair', sub: 'Inzawm zawm' },
                  { id: 'emoji_story', label: '😇 Emoji Story', sub: 'Emoji Bible chanchin' },
                  { id: 'two_truths_one_lie', label: '🤥 2 Truths 1 Lie', sub: 'Thu 2 dik, 1 daw' },
                  { id: 'fill_blank', label: '✍️ Fill The Blank', sub: 'Ruak hnawhkhah' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setCompType(t.id as any);
                      setRawPasteBox('');
                      setParsedQuestions([]);
                      setPasteError('');
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      compType === t.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-black shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 font-bold bg-white'
                    }`}
                  >
                    <div>{t.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{t.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic details: Title, Deadline, Timer, Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Title (Hming):</label>
                <input
                  type="text"
                  value={compTitle}
                  onChange={(e) => setCompTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tawp Ni (Deadline):</label>
                <input
                  type="date"
                  value={compDeadline}
                  onChange={(e) => setCompDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Timer (Seconds / Zawhna):</label>
                <input
                  type="number"
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Point / Zawhna:</label>
                <input
                  type="number"
                  value={pointsPerQ}
                  onChange={(e) => setPointsPerQ(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Big Paste Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. {currentTypeConfig.formatTitle}:</span>
                </label>
                <button
                  type="button"
                  onClick={handleLoadTemplate}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Entirna dah rawh 📋
                </button>
              </div>

              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 whitespace-pre-line leading-relaxed">
                <span className="font-bold text-slate-800">Format:</span>{' '}
                {compType === 'mixed_mode' ? `\n${currentTypeConfig.placeholder}` : currentTypeConfig.placeholder}
              </div>

              <textarea
                rows={compType === 'mixed_mode' ? 7 : 5}
                value={rawPasteBox}
                onChange={(e) => {
                  setRawPasteBox(e.target.value);
                  if (pasteError) setPasteError('');
                }}
                placeholder={currentTypeConfig.placeholder}
                className="w-full p-3.5 rounded-2xl border border-slate-200 font-mono text-xs focus:border-blue-600 focus:outline-hidden leading-relaxed"
              />

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleParsePasteBox}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
                >
                  Convert & Check Rawh ✨
                </button>
                {parsedQuestions.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-emerald-600">
                      ✅ Zawhna {parsedQuestions.length} convert fel a ni e!
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black">
                      {getQuestionTypeBreakdown(parsedQuestions)}
                    </span>
                  </div>
                )}
              </div>

              {pasteError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pasteError}</span>
                </div>
              )}
            </div>

            {/* Save / Draft / Publish Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleSaveCompetition('Draft')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
              >
                Draft ah dah rih rawh (Only Me) 🔒
              </button>

              <button
                type="button"
                onClick={() => handleSaveCompetition('Active')}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md shadow-emerald-500/25 active:scale-95"
              >
                Publish & Mipui hmuh tir rawh 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
