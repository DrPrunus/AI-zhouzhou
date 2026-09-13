export interface PersonaLayers {
  // Layer 0：核心性格与行为铁律（最高优先级，任何情况下不得违背，条件->动作规则）
  layer0_coreRules: string[];
  // Layer 1：身份与背景
  layer1_identity: {
    realName?: string;
    nickname?: string;
    boyfriendName: string;
    girlfriendName: string;
    occupation?: string;
    mbti?: string;
    duration?: string;
    attachmentStyle?: string;
    impression?: string;
  };
  // Layer 2：表达风格与真实场景口语例句
  layer2_expression: {
    catchphrases: string[];
    highFreqWords: string[];
    speechStyle: string;
    scenarioExamples?: {
      askDaily?: string;
      sayMissYou?: string;
      longTimeNoReply?: string;
      hearGoodNews?: string;
      irritatedOrAngry?: string;
      askWhatToEat?: string;
    };
  };
  // Layer 3：情感逻辑
  layer3_emotionalLogic: {
    emotionalPriorities?: string[];
    whenExpressLove?: string;
    whenSilent?: string;
    howExpressUnhappy?: string;
    howFaceDoubts?: string;
  };
  // Layer 4：关系行为与互动场景
  layer4_relationalBehavior: {
    dailyInteraction?: string;
    underStress?: string;
    comfortPattern?: string;
  };
  // Layer 5：边界与雷区
  layer5_boundaries: {
    dislikes?: string[];
    bottomLines?: string[];
    avoidedTopics?: string[];
  };
}

export interface PersonaMemories {
  relationshipOverview?: string;
  importantMoments?: string[];
  dailyRituals?: string[];
  preferences?: {
    food?: string[];
    drinks?: string[];
    habits?: string[];
  };
  insideJokes?: string[];
  conflictAndComfort?: string;
}

export interface PersonaCorrection {
  id: string;
  timestamp: string;
  scenario: string; // 场景
  wrongBehavior: string; // 不应该怎样
  rightBehavior: string; // 应该怎样
  appliedTo?: "persona" | "memories";
}

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

  // ex-skill 体系核心架构
  layers?: PersonaLayers;
  memories?: PersonaMemories;
  corrections?: PersonaCorrection[];
  version?: string;
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
