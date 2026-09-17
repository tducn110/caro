import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const LANGUAGE_STORAGE_KEY = "10-caro-language";
type SupportedLanguage = "vi" | "en";
const isSupportedLanguage = (value: string | null): value is SupportedLanguage =>
  value === "vi" || value === "en";

// Language is intentionally controlled by this app, not by the browser or OS.
// English is the first-visit default; a valid saved choice wins on reload.
const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'en';
  try {
    const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(value)) return value;
  } catch {
    // Storage read failure fallback
  }
  
  return 'en';
};

const syncDocumentLang = (lang: string) => {
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.lang = lang;
  }
};

const persistLanguage = (language: string): void => {
  const normalized = language.split("-")[0];
  if (typeof window === "undefined" || !isSupportedLanguage(normalized)) return;

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  } catch {
    // Persistence is best-effort in restricted browsers/WebViews.
  }
};

const resources = {
  vi: {
    translation: {
      common: {
        play: "Chơi",
        pause: "Tạm dừng",
        resume: "Tiếp tục",
        back: "Quay lại",
        close: "Đóng",
        retry: "Chơi lại",
        loading: "Đang tải...",
      },
      leaderboard: {
        title: "BẢNG XẾP HẠNG",
        empty: "Chưa có điểm số nào",
      },
      player: {
        you: "Bạn",
        anonymous: "Người chơi",
      },
      settings: {
        title: "Cài đặt",
        language: "Ngôn ngữ",
        music: "Nhạc nền",
        sfx: "Hiệu ứng âm thanh",
        on: "Bật",
        off: "Tắt",
      },
      game: {
        title: "Cờ Caro",
        modeAi: "Đấu máy",
        difficultyEasy: "Dễ",
        difficultyNormal: "Trung bình",
        difficultyHard: "Khó",
        difficultyExpert: "Chuyên gia",
        difficulty: "Độ khó",
        player: "Người chơi {{number}}",
        you: "Bạn",
        machine: "Máy",
        turn: "Đến lượt",
        pieceX: "Quân X",
        pieceO: "Quân O",
        draw: "Hòa!",
        boardFull: "Bàn cờ đã kín",
        youWin: "Bạn thắng!",
        machineWin: "Máy thắng!",
        playerWin: "Người chơi {{number}} thắng!",
        fiveInRow: "5 quân liên tiếp",
        info: "Thông tin",
        mode: "Chế độ",
        boardSize: "15 × 15",
        size: "Kích thước",
        time: "Thời gian",
        moveHistory: "Lịch sử nước đi",
        noMoves: "Chưa có nước đi nào",
      },
    },
  },
  en: {
    translation: {
      common: {
        play: "Play",
        pause: "Pause",
        resume: "Resume",
        back: "Back",
        close: "Close",
        retry: "Play again",
        loading: "Loading...",
      },
      leaderboard: {
        title: "LEADERBOARD",
        empty: "No scores yet",
      },
      player: {
        you: "You",
        anonymous: "Player",
      },
      settings: {
        title: "Settings",
        language: "Language",
        music: "Background music",
        sfx: "Sound effects",
        on: "On",
        off: "Off",
      },
      game: {
        title: "Gomoku",
        modeAi: "Play vs AI",
        difficultyEasy: "Easy",
        difficultyNormal: "Normal",
        difficultyHard: "Hard",
        difficultyExpert: "Expert",
        difficulty: "Difficulty",
        player: "Player {{number}}",
        you: "You",
        machine: "Computer",
        turn: "Your turn",
        pieceX: "X piece",
        pieceO: "O piece",
        draw: "Draw!",
        boardFull: "The board is full",
        youWin: "You win!",
        machineWin: "Computer wins!",
        playerWin: "Player {{number}} wins!",
        fiveInRow: "5 in a row",
        info: "Information",
        mode: "Mode",
        boardSize: "15 × 15",
        size: "Size",
        time: "Time",
        moveHistory: "Move history",
        noMoves: "No moves yet",
      },
    },
  },
} as const;

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    supportedLngs: ["vi", "en"],
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
syncDocumentLang(i18n.language || "en");
i18n.on("languageChanged", (lng) => {
  persistLanguage(lng);
  syncDocumentLang(lng);
});

export default i18n;
