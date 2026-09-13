export interface BoyfriendPersona {
  boyfriendName: string; // 常用显示名称/昵称，如 阿峻
  realName?: string; // 本名，如 张溯峻
  nickname?: string; // 小名，如 周周
  girlfriendName: string;
  petNamesToHer: string[];
  petNamesToHim: string[];
  personalityTraits: string[];
  speechStyle: string;
  catchphrases: string[];
  memoriesAndTopics: string[];
  emotionalResponseGuide?: {
    comfortWork?: string;
    comfortSick?: string;
    replyAffection?: string;
    replyAnger?: string;
  };
  summaryIntro: string;
  systemPrompt: string;
  avatarUrl?: string;
  girlfriendAvatarUrl?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: "girlfriend" | "boyfriend" | "system";
  text: string;
  timestamp: string;
  isVoice?: boolean;
  voiceDuration?: number;
  mood?: string;
  voiceSimText?: string;
}

export interface ChatSettings {
  sweetness: number; // 0 - 100
  humor: number; // 0 - 100
  splitBubbles: boolean;
  typingDelay: boolean;
  soundEffects: boolean;
  backgroundTheme: "default" | "warm" | "clean" | "night";
}

export interface PresetChat {
  id: string;
  title: string;
  tag: string;
  description: string;
  boyfriendName: string;
  girlfriendName: string;
  samplePersona: BoyfriendPersona;
  rawText: string;
}

export interface ParsedChatStats {
  totalMessages: number;
  senders: { name: string; count: number }[];
  sampleSnippets: { sender: string; text: string; time?: string }[];
}
