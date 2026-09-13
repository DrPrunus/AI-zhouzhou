import React, { useState, useEffect } from "react";
import { BoyfriendPersona, ChatSettings } from "./types";
import { PRESET_CHATS } from "./data/presetChats";
import { WeChatChatView } from "./components/WeChatChatView";
import { ChatImportView } from "./components/ChatImportView";
import { BoyfriendProfileDrawer } from "./components/BoyfriendProfileDrawer";
import { ShareGirlfriendModal } from "./components/ShareGirlfriendModal";
import {
  Heart,
  MessageCircle,
  Sparkles,
  Upload,
  Settings,
  Share2,
  HelpCircle,
  Smartphone,
} from "lucide-react";

export default function App() {
  const [persona, setPersona] = useState<BoyfriendPersona>(() => {
    try {
      const saved = localStorage.getItem("electronic_boyfriend_persona");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.boyfriendName !== "阿哲") {
          return {
            ...parsed,
            realName: parsed.realName || "张溯峻",
            nickname: parsed.nickname || "周周",
            girlfriendName: parsed.girlfriendName === "宝宝" ? "尚可人" : (parsed.girlfriendName || "尚可人"),
            petNamesToHer: parsed.petNamesToHer && parsed.petNamesToHer.includes("可人")
              ? parsed.petNamesToHer
              : ["可人", "可人宝", "我家可人", ...(parsed.petNamesToHer || ["宝贝", "乖乖"])],
          };
        }
      }
    } catch (e) {
      // ignore
    }
    return PRESET_CHATS[0].samplePersona;
  });

  const [settings, setSettings] = useState<ChatSettings>(() => {
    try {
      const saved = localStorage.getItem("electronic_boyfriend_settings");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }
    return {
      sweetness: 85,
      humor: 80,
      splitBubbles: true,
      typingDelay: true,
      soundEffects: true,
      backgroundTheme: "default",
    };
  });

  const [currentView, setCurrentView] = useState<"chat" | "import">("chat");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("electronic_boyfriend_persona", JSON.stringify(persona));
    } catch (e) {
      // ignore
    }
  }, [persona]);

  useEffect(() => {
    try {
      localStorage.setItem("electronic_boyfriend_settings", JSON.stringify(settings));
    } catch (e) {
      // ignore
    }
  }, [settings]);

  const handlePersonaGenerated = (newPersona: BoyfriendPersona) => {
    setPersona(newPersona);
    setCurrentView("chat");
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center">
      {/* Top Desktop Helper Nav (visible on md screens to guide boyfriend / girlfriend) */}
      <nav className="w-full max-w-5xl px-4 py-3 hidden md:flex items-center justify-between text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-2xs">
            <Heart className="w-4 h-4 fill-white" />
          </div>
          <div>
            <span className="font-bold text-neutral-800 text-sm">
              电子男友 AI 微信分身
            </span>
            <span className="text-neutral-400 ml-2">
              基于真实微信记录深度克隆
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="nav-chat-view-btn"
            onClick={() => setCurrentView("chat")}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              currentView === "chat"
                ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            女朋友聊天视角
          </button>

          <button
            id="nav-import-view-btn"
            onClick={() => setCurrentView("import")}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              currentView === "import"
                ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            导入新的微信记录
          </button>

          <button
            id="nav-settings-btn"
            onClick={() => setIsDrawerOpen(true)}
            className="px-3 py-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            微调分身人设
          </button>

          <button
            id="nav-share-btn"
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-1.5 bg-pink-50 text-pink-700 hover:bg-pink-100 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-pink-600" />
            发给女朋友
          </button>
        </div>
      </nav>

      {/* Main View Container */}
      <div className="w-full flex-1 flex justify-center items-center">
        {currentView === "import" ? (
          <div className="w-full py-6">
            <ChatImportView
              onPersonaGenerated={handlePersonaGenerated}
              onCancel={() => setCurrentView("chat")}
              currentPersona={persona}
            />
          </div>
        ) : (
          <WeChatChatView
            persona={persona}
            settings={settings}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenShare={() => setIsShareModalOpen(true)}
            onOpenImport={() => setCurrentView("import")}
          />
        )}
      </div>

      {/* Boyfriend Persona & Settings Drawer */}
      <BoyfriendProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        persona={persona}
        onUpdatePersona={(p) => setPersona(p)}
        settings={settings}
        onUpdateSettings={(s) => setSettings(s)}
        onReimport={() => setCurrentView("import")}
      />

      {/* Share Modal */}
      <ShareGirlfriendModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        persona={persona}
      />
    </div>
  );
}
