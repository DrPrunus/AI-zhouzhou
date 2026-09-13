import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  MoreHorizontal,
  Mic,
  Smile,
  PlusCircle,
  Send,
  Sparkles,
  Heart,
  Volume2,
  Share2,
  Edit3,
  Coffee,
  Gift,
  HelpCircle,
  RotateCcw,
  Wand2,
  X,
  Check,
} from "lucide-react";
import { BoyfriendPersona, ChatMessage, ChatSettings, PersonaCorrection } from "../types";
import { playSendSound, playReceiveSound } from "../utils/audio";

interface WeChatChatViewProps {
  persona: BoyfriendPersona;
  settings: ChatSettings;
  onUpdatePersona?: (newPersona: BoyfriendPersona) => void;
  onOpenDrawer: () => void;
  onOpenShare: () => void;
  onOpenImport: () => void;
}

const CUTE_EMOJIS = [
  "🥰", "🥺", "😘", "❤️", "🌹", "🐱", "✨", "🥟", "🧋", "🍲",
  "抱抱", "亲亲", "摸摸头", "哼~", "委屈巴巴", "超想你", "吃饱啦", "乖乖",
];

const QUICK_TOPICS = [
  "阿峻，想你了~🥺",
  "周周，今天下班来接我好不好？",
  "阿峻，今天中午吃什么好呢？",
  "下班啦好累好累呀🥺",
  "肚子有点痛，不舒服呜呜",
  "今天领导又在发神经，好气！",
  "周末我们去吃火锅好不好？",
];

// Smart diverse generator for client-side fallback to avoid repetitive phrases
function getDiverseClientReply(msg: string, persona: BoyfriendPersona): { replies: string[]; mood: string } {
  const herCall = (persona.petNamesToHer && persona.petNamesToHer.includes("可人"))
    ? "可人"
    : ((persona.petNamesToHer && persona.petNamesToHer[0]) || (persona.girlfriendName || "可人"));
  const bfName = persona.boyfriendName || "阿峻";
  const nickname = persona.nickname || "周周";
  const text = (msg || "").trim();

  const pick = (list: { replies: string[]; mood: string }[]) => list[Math.floor(Math.random() * list.length)];

  if (text.includes("阿峻") || text.includes("周周") || text.includes("张溯峻") || text.includes("峻峻")) {
    return pick([
      { replies: [`在呢在呢！一听${herCall}叫${bfName}，手头的事瞬间全放下了🥰`, `今天遇到什么好玩的事啦？快跟我讲讲~`], mood: "温柔心动" },
      { replies: [`周周在呢！今天我家${herCall}有没有想我呀？`], mood: "宠溺笑" },
      { replies: [`张溯峻随时就绪，可人有什么事情尽管跟我说~`], mood: "认真体贴" },
      { replies: [`阿峻在呢，听到可人叫我心里就暖洋洋的~`], mood: "深情温暖" },
    ]);
  }

  if (text.includes("累") || text.includes("烦") || text.includes("加班") || text.includes("气") || text.includes("领导")) {
    return pick([
      { replies: [`摸摸头，抱抱我家${herCall}🥺`, `辛苦啦，别跟那些烦心事生气，晚点阿峻带可人去吃好吃的解解压！`], mood: "心疼体贴" },
      { replies: [`抱紧紧！谁惹我家宝宝不高兴了？阿峻永远站在可人这边！`, `晚上给你好好捏捏肩放松一下好不好？`], mood: "温柔守护" },
      { replies: [`可人乖，今天辛苦了。下班阿峻去接你，别想烦心事啦~`], mood: "温暖陪伴" },
    ]);
  }

  if (text.includes("想你") || text.includes("爱你") || text.includes("抱抱") || text.includes("亲亲")) {
    return pick([
      { replies: [`${bfName}也超级超级想${herCall}！🥰`, `待会儿下班就想飞奔过去把你抱在怀里~`], mood: "甜蜜心动" },
      { replies: [`听到可人说想我，整个人都甜化了！`, `啵一个，今晚见面的拥抱先给你预存着！`], mood: "心花怒放" },
      { replies: [`我也爱你呀宝宝，满脑子都是你~`], mood: "深情款款" },
    ]);
  }

  if (text.includes("在干嘛") || text.includes("在做什么") || text.includes("在忙吗")) {
    return pick([
      { replies: [`刚忙完手头一点事，正拿着手机想我家${herCall}呢，你就发过来了！`], mood: "心有灵犀" },
      { replies: [`随时守着可人的微信呀，一看到消息就秒回啦~`], mood: "随时待命" },
      { replies: [`正在看晚上下班带你去吃什么呢，今天可人想吃什么都听你的！`], mood: "温柔体贴" },
    ]);
  }

  if (text.includes("吃") || text.includes("饿") || text.includes("饭") || text.includes("奶茶")) {
    return pick([
      { replies: [`${herCall}饿啦？想吃什么，阿峻晚上带你去大吃一顿！`], mood: "宠溺笑" },
      { replies: [`记得按时吃饭嗷，照顾好自己不许饿肚子~`], mood: "细心关怀" },
    ]);
  }

  return pick([
    { replies: [`听到啦！阿峻正专心听${herCall}讲话呢，然后呢？继续跟我说说~🥰`], mood: "认真倾听" },
    { replies: [`哈哈哈真有你的，我家${herCall}怎么这么可爱呀！`], mood: "宠溺笑" },
    { replies: [`可人说的我都认真记下啦，今天过得开心吗？`], mood: "温柔陪伴" },
    { replies: [`阿峻在呢！刚才看手机走神了一小会儿，看到可人的消息立刻就来啦🥰`], mood: "温柔微笑" },
  ]);
}

export const WeChatChatView: React.FC<WeChatChatViewProps> = ({
  persona,
  settings,
  onUpdatePersona,
  onOpenDrawer,
  onOpenShare,
  onOpenImport,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const bfCall = persona.boyfriendName || "阿峻";
    const nick = persona.nickname ? `（${persona.nickname}）` : "";
    const herCall = (persona.petNamesToHer && persona.petNamesToHer.includes("可人"))
      ? "可人"
      : ((persona.petNamesToHer && persona.petNamesToHer[0]) || (persona.girlfriendName || "可人"));
    return [
      {
        id: "init-1",
        sender: "boyfriend",
        text: `${herCall}，你的专属${bfCall}${nick}已在线啦~ 今天过得怎么样，有没有想我？🥰`,
        timestamp: "刚刚",
        mood: "温柔微笑",
      },
    ];
  });

  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [activeVoicePlaying, setActiveVoicePlaying] = useState<string | null>(null);

  // ex-skill Correction State
  const [correctionTarget, setCorrectionTarget] = useState<{ id: string; text: string } | null>(null);
  const [correctionInput, setCorrectionInput] = useState("");
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [learnedNotice, setLearnedNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingWatchdogRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (typingWatchdogRef.current) clearTimeout(typingWatchdogRef.current);
    };
  }, []);

  const handleSubmitCorrection = async () => {
    if (!correctionInput.trim() || !correctionTarget) return;
    setIsSubmittingCorrection(true);
    try {
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          wrongMessage: correctionTarget.text,
          correctionInput: correctionInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.persona) {
        if (onUpdatePersona) {
          onUpdatePersona(data.persona);
        }
        const time = `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`;
        const ackMsg: ChatMessage = {
          id: `bf-ack-${Date.now()}`,
          sender: "boyfriend",
          text: data.boyfriendAck || `收到长官批评！都是${persona.realName || "张溯峻"}不好，阿峻把可人的话记在脑门上啦，以后坚决改！🥰`,
          timestamp: time,
          mood: "光速认错改好",
        };
        setMessages((prev) => [...prev, ackMsg]);
        setLearnedNotice(`✨ 纠偏成功！已作为最高优先级铁律写入 ${data.persona.boyfriendName || "阿峻"} 的行为库`);
        setTimeout(() => setLearnedNotice(null), 4000);
        setCorrectionTarget(null);
        setCorrectionInput("");
      }
    } catch (e: any) {
      console.error("Correction failed:", e);
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    // If already typing, clear previous stuck timer so this new send is not blocked
    if (typingWatchdogRef.current) {
      clearTimeout(typingWatchdogRef.current);
    }

    if (settings.soundEffects) {
      playSendSound();
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "girlfriend",
      text,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setShowEmojis(false);
    setShowPlusMenu(false);
    setIsTyping(true);

    // Typing watchdog: allow adequate time for LLM generation without premature cutoff
    typingWatchdogRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 28000);

    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), 25000);

    try {
      const chatHistoryForApi = [...messages, userMsg].map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          chatHistory: chatHistoryForApi,
          persona,
          settings: {
            sweetness: settings.sweetness,
            humor: settings.humor,
            splitBubbles: settings.splitBubbles,
          },
        }),
      });

      clearTimeout(abortTimeout);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "电子男友暂时走神了");
      }

      // If backend detected an organic correction from girlfriend
      if (data.learnedCorrection && onUpdatePersona) {
        const autoCor: PersonaCorrection = {
          id: `cor-auto-${Date.now()}`,
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
          scenario: data.learnedCorrection.scenario || "对话互动中",
          wrongBehavior: data.learnedCorrection.wrongBehavior || "言行不够贴合",
          rightBehavior: data.learnedCorrection.rightBehavior || "按可人习惯调整",
          appliedTo: "persona",
        };
        const updated = {
          ...persona,
          corrections: [autoCor, ...(persona.corrections || [])],
        };
        onUpdatePersona(updated);
        setLearnedNotice(`⚡ 阿峻已把你的提醒记下：【${autoCor.scenario}】${autoCor.rightBehavior}`);
        setTimeout(() => setLearnedNotice(null), 4500);
      }

      const replies: string[] = data.replies && data.replies.length > 0 ? data.replies : ["宝贝抱抱，刚没看手机！我来啦~"];
      const mood: string = data.mood || "温柔陪伴";
      const voiceSimText: string = data.voiceSimText || replies[0];

      // Realistic typing cadence (brief)
      if (settings.typingDelay) {
        await new Promise((r) => setTimeout(r, 400));
      }

      // If split bubbles enabled, send each bubble with a slight delay
      if (settings.splitBubbles && replies.length > 1) {
        for (let i = 0; i < replies.length; i++) {
          const bubbleText = replies[i];
          const botMsg: ChatMessage = {
            id: `bf-${Date.now()}-${i}`,
            sender: "boyfriend",
            text: bubbleText,
            timestamp: timeStr,
            mood: i === 0 ? mood : undefined,
            voiceSimText: i === 0 ? voiceSimText : undefined,
          };

          setMessages((prev) => [...prev, botMsg]);
          if (settings.soundEffects) {
            playReceiveSound();
          }

          if (i < replies.length - 1) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }
      } else {
        const botMsg: ChatMessage = {
          id: `bf-${Date.now()}`,
          sender: "boyfriend",
          text: replies.join("\n"),
          timestamp: timeStr,
          mood,
          voiceSimText,
        };
        setMessages((prev) => [...prev, botMsg]);
        if (settings.soundEffects) {
          playReceiveSound();
        }
      }
    } catch (err: any) {
      clearTimeout(abortTimeout);
      // Avoid repetitive fixed text: intelligently generate varied contextual reply
      const fallbackResult = getDiverseClientReply(text, persona);
      for (let i = 0; i < fallbackResult.replies.length; i++) {
        const botMsg: ChatMessage = {
          id: `err-${Date.now()}-${i}`,
          sender: "boyfriend",
          text: fallbackResult.replies[i],
          timestamp: timeStr,
          mood: i === 0 ? fallbackResult.mood : undefined,
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } finally {
      clearTimeout(abortTimeout);
      if (typingWatchdogRef.current) {
        clearTimeout(typingWatchdogRef.current);
      }
      setIsTyping(false);
    }
  };

  const handleSendSpecial = (type: "tea" | "hug" | "redpacket" | "water") => {
    switch (type) {
      case "tea":
        handleSendMessage("给你点了一杯最爱的热奶茶！要乖乖喝嗷🧋");
        break;
      case "hug":
        handleSendMessage("[飞扑抱住！狂蹭宝贝胸口🥰]");
        break;
      case "redpacket":
        handleSendMessage("💰 [微信红包] 专属恋爱零食基金 520.00 元");
        break;
      case "water":
        handleSendMessage("来自专属监督官的提醒：该喝温水啦，不许偷懒！🥛");
        break;
    }
  };

  const playSimulatedVoice = (msgId: string) => {
    if (activeVoicePlaying === msgId) {
      setActiveVoicePlaying(null);
      return;
    }
    setActiveVoicePlaying(msgId);
    playReceiveSound();
    setTimeout(() => {
      setActiveVoicePlaying(null);
    }, 2500);
  };

  const handleClearHistory = () => {
    if (window.confirm("确定清空当前聊天记录吗？")) {
      const bfCall = persona.boyfriendName || "阿峻";
      const herCall = (persona.petNamesToHer && persona.petNamesToHer.includes("可人"))
        ? "可人"
        : ((persona.petNamesToHer && persona.petNamesToHer[0]) || (persona.girlfriendName || "可人"));
      setMessages([
        {
          id: "restart-1",
          sender: "boyfriend",
          text: `${herCall}，${bfCall}在呢！有什么想跟我聊聊的嘛？🥰`,
          timestamp: "刚刚",
          mood: "随时待命",
        },
      ]);
    }
  };

  return (
    <div id="wechat-container" className="flex flex-col h-[100dvh] max-w-md mx-auto bg-[#ededed] shadow-2xl relative select-none">
      {/* Phone Status Bar */}
      <div className="bg-[#ededed] text-neutral-800 px-5 pt-2 pb-1 flex justify-between items-center text-xs font-semibold z-20">
        <span>20:30</span>
        <div className="flex items-center gap-1.5 text-neutral-700">
          <span className="text-[10px] tracking-tight">5G</span>
          <div className="w-5 h-2.5 border border-neutral-700 rounded-xs p-0.5 flex items-center">
            <div className="w-full h-full bg-neutral-700 rounded-2xs" />
          </div>
        </div>
      </div>

      {/* WeChat Header */}
      <header className="bg-[#ededed] border-b border-neutral-300/80 px-3 py-2 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-1 cursor-pointer" onClick={onOpenImport} title="重新导入聊天记录">
          <ChevronLeft className="w-6 h-6 text-neutral-800" />
          <span className="text-sm font-medium text-neutral-800">微信</span>
          <span className="text-xs text-neutral-500 bg-neutral-300/60 px-1.5 py-0.5 rounded-full">
            8
          </span>
        </div>

        <div className="text-center flex-1 mx-2">
          <div className="flex items-center justify-center gap-1">
            <h1 className="text-base font-bold text-neutral-900 truncate max-w-[150px]">
              {persona.boyfriendName || "阿峻"}
            </h1>
            {persona.nickname && (
              <span className="text-[11px] text-neutral-500 font-normal">
                ({persona.nickname})
              </span>
            )}
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-medium">
              电子男友
            </span>
          </div>
          <div className="text-[11px] text-neutral-500">
            {isTyping ? (
              <button
                type="button"
                onClick={() => {
                  if (typingWatchdogRef.current) clearTimeout(typingWatchdogRef.current);
                  setIsTyping(false);
                }}
                title="若长时间未回复可点击唤醒"
                className="text-emerald-600 font-medium animate-pulse hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>对方正在输入...</span>
                <span className="text-[10px] text-neutral-400 font-normal">(点击催促)</span>
              </button>
            ) : (
              <span>
                {persona.realName ? `${persona.realName} · 在线随时接听` : "(在线 · 随时接听)"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="share-with-girlfriend-btn"
            onClick={onOpenShare}
            title="分享给女朋友体验"
            className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-700 transition-colors"
          >
            <Share2 className="w-4 h-4 text-pink-600" />
          </button>
          <button
            id="open-boyfriend-settings-btn"
            onClick={onOpenDrawer}
            title="男友性格与记忆设定"
            className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-700 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mode Sub-banner */}
      <div className="bg-emerald-50/90 border-b border-emerald-100 px-3 py-1.5 text-[11px] text-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-1 truncate">
          <Heart className="w-3 h-3 text-pink-500 fill-pink-500 shrink-0" />
          <span className="truncate">
            【女朋友聊天视角】与专属电子男友对话中
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="quick-tune-btn"
            onClick={onOpenDrawer}
            className="text-emerald-700 hover:underline font-semibold flex items-center gap-0.5"
          >
            <Edit3 className="w-3 h-3" /> 微调语气
          </button>
          <button
            id="clear-chat-btn"
            onClick={handleClearHistory}
            className="text-neutral-400 hover:text-neutral-600"
            title="清空记录"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Learned Correction Notice */}
        {learnedNotice && (
          <div className="sticky top-2 z-20 flex justify-center animate-fade-in">
            <span className="bg-purple-900/90 text-white text-[11px] px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              {learnedNotice}
            </span>
          </div>
        )}

        {/* Date pill */}
        <div className="flex justify-center">
          <span className="bg-[#dadada] text-neutral-600 text-[10px] px-2 py-0.5 rounded-md">
            今天 20:28
          </span>
        </div>

        {/* Message items */}
        {messages.map((msg) => {
          const isMe = msg.sender === "girlfriend";

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-md shrink-0 flex items-center justify-center font-bold text-sm shadow-2xs ${
                  isMe
                    ? "bg-pink-500 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {isMe
                  ? persona.girlfriendName.slice(0, 1) || "宝"
                  : persona.boyfriendName.slice(0, 1) || "男"}
              </div>

              {/* Message Bubble + Mood tag */}
              <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[74%]`}>
                {/* Boyfriend mood tag */}
                {!isMe && msg.mood && (
                  <span className="text-[10px] text-neutral-400 mb-1 px-1 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    男友心声：{msg.mood}
                  </span>
                )}

                {/* Bubble Container */}
                <div className="relative group">
                  <div
                    className={`rounded-lg p-3 text-sm leading-relaxed break-words shadow-2xs select-text ${
                      isMe
                        ? "bg-[#95ec69] text-neutral-900 rounded-tr-xs"
                        : "bg-white text-neutral-900 border border-neutral-200/60 rounded-tl-xs"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Simulated audio voice play trigger & ex-skill Correction button */}
                  {!isMe && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <button
                        onClick={() => playSimulatedVoice(msg.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200/60 transition-colors"
                      >
                        <Volume2 className={`w-3 h-3 ${activeVoicePlaying === msg.id ? "animate-bounce text-emerald-600" : ""}`} />
                        <span>
                          {activeVoicePlaying === msg.id ? "正在播放语音..." : "语音条 4\""}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setCorrectionTarget({ id: msg.id, text: msg.text });
                          setCorrectionInput("");
                        }}
                        title="告诉阿峻平时应该怎么说（ex-skill 纠偏调教）"
                        className="inline-flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50/90 hover:bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200/70 transition-colors"
                      >
                        <Wand2 className="w-2.5 h-2.5 text-purple-600" />
                        <span>纠偏</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator bubble */}
        {isTyping && (
          <div className="flex items-start gap-2.5">
            <div className="w-10 h-10 rounded-md bg-emerald-600 text-white font-bold text-sm shrink-0 flex items-center justify-center">
              {persona.boyfriendName.slice(0, 1) || "阿"}
            </div>
            <div className="bg-white border border-neutral-200/60 rounded-lg rounded-tl-xs p-3 shadow-2xs space-y-1.5 max-w-[280px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                <span className="text-[11px] text-neutral-400 ml-1 font-normal">{persona.boyfriendName || "阿峻"}正在输入回复...</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typingWatchdogRef.current) clearTimeout(typingWatchdogRef.current);
                  setIsTyping(false);
                  const time = `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`;
                  const lastUserMsg = [...messages].reverse().find((m) => m.sender === "girlfriend")?.text || "想你啦";
                  const pokeFallback = getDiverseClientReply(lastUserMsg, persona);
                  const newPokeMsgs: ChatMessage[] = pokeFallback.replies.map((replyText, idx) => ({
                    id: `bf-poke-${Date.now()}-${idx}`,
                    sender: "boyfriend",
                    text: replyText,
                    timestamp: time,
                    mood: idx === 0 ? pokeFallback.mood : undefined,
                  }));
                  setMessages((prev) => [...prev, ...newPokeMsgs]);
                }}
                className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200/60 transition-colors inline-block"
              >
                等急了？戳一下{persona.boyfriendName || "阿峻"}立即回复
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Quick Topic Suggestions */}
      <div className="bg-[#ededed] px-3 pt-2 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
        {QUICK_TOPICS.map((topic, i) => (
          <button
            key={i}
            id={`quick-topic-chip-${i}`}
            onClick={() => handleSendMessage(topic)}
            className="inline-block px-3 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 text-xs rounded-full shadow-2xs transition-colors shrink-0"
          >
            {topic}
          </button>
        ))}
      </div>

      {/* Bottom WeChat Input Bar */}
      <footer className="bg-[#f7f7f7] border-t border-neutral-300 p-2.5 space-y-2">
        <div className="flex items-center gap-2">
          {/* Voice toggle */}
          <button
            id="voice-mode-toggle-btn"
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-700 transition-colors shrink-0"
            title={isVoiceMode ? "切换键盘" : "语音输入"}
          >
            <Mic className={`w-6 h-6 ${isVoiceMode ? "text-emerald-600" : ""}`} />
          </button>

          {/* Text input or press-to-speak button */}
          {isVoiceMode ? (
            <button
              id="press-to-speak-btn"
              onMouseDown={() => handleSendMessage("宝贝我按住语音说话啦：超想你！")}
              className="flex-1 py-2 bg-white border border-neutral-300 hover:bg-neutral-100 active:bg-neutral-200 rounded-md text-xs font-bold text-neutral-800 text-center select-none transition-colors"
            >
              按住 说话（点击发送语音）
            </button>
          ) : (
            <input
              id="wechat-message-input"
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`发消息给 ${persona.boyfriendName}...`}
              className="flex-1 bg-white border border-neutral-300 rounded-md px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-neutral-400"
            />
          )}

          {/* Emoji toggle */}
          <button
            id="emoji-picker-toggle-btn"
            onClick={() => {
              setShowEmojis(!showEmojis);
              setShowPlusMenu(false);
            }}
            className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-700 transition-colors shrink-0"
          >
            <Smile className="w-6 h-6" />
          </button>

          {/* Send button or Plus menu */}
          {inputVal.trim().length > 0 ? (
            <button
              id="send-message-btn"
              onClick={() => handleSendMessage()}
              className="px-3.5 py-1.5 bg-[#07c160] hover:bg-[#06ad56] text-white text-xs font-bold rounded-md shrink-0 transition-colors shadow-2xs"
            >
              发送
            </button>
          ) : (
            <button
              id="plus-menu-toggle-btn"
              onClick={() => {
                setShowPlusMenu(!showPlusMenu);
                setShowEmojis(false);
              }}
              className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-700 transition-colors shrink-0"
            >
              <PlusCircle className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Emojis Drawer */}
        {showEmojis && (
          <div className="bg-white rounded-lg p-3 border border-neutral-200 grid grid-cols-6 gap-2 text-center text-lg animate-fade-in">
            {CUTE_EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputVal((prev) => prev + emoji);
                  inputRef.current?.focus();
                }}
                className="p-1.5 hover:bg-neutral-100 rounded text-xs md:text-sm transition-colors flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Plus Expansion Menu */}
        {showPlusMenu && (
          <div className="bg-white rounded-xl p-4 border border-neutral-200 grid grid-cols-4 gap-4 text-center animate-fade-in">
            <button
              id="plus-send-tea-btn"
              onClick={() => handleSendSpecial("tea")}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 group-hover:bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center transition-colors">
                <Coffee className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-neutral-700">请喝奶茶</span>
            </button>

            <button
              id="plus-send-hug-btn"
              onClick={() => handleSendSpecial("hug")}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-pink-50 group-hover:bg-pink-100 border border-pink-200 text-pink-600 flex items-center justify-center transition-colors">
                <Heart className="w-6 h-6 fill-pink-500" />
              </div>
              <span className="text-[11px] text-neutral-700">飞扑抱抱</span>
            </button>

            <button
              id="plus-send-redpacket-btn"
              onClick={() => handleSendSpecial("redpacket")}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 group-hover:bg-red-100 border border-red-200 text-red-600 flex items-center justify-center transition-colors">
                <Gift className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-neutral-700">恋爱红包</span>
            </button>

            <button
              id="plus-send-water-btn"
              onClick={() => handleSendSpecial("water")}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center transition-colors">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-neutral-700">提醒喝水</span>
            </button>
          </div>
        )}
      </footer>

      {/* ex-skill Correction Modal */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3 animate-fade-in border border-purple-100">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-purple-900 text-xs">
                <Wand2 className="w-4 h-4 text-purple-600" />
                纠偏调教 (ex-skill 动态进化)
              </div>
              <button
                onClick={() => setCorrectionTarget(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-neutral-50 rounded-lg p-2.5 border border-neutral-200/80 text-[11px] text-neutral-600 space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold block">阿峻刚才这句回复不够地道：</span>
              <p className="italic text-neutral-800 line-through">“{correctionTarget.text}”</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-800 block">
                告诉{persona.boyfriendName || "阿峻"}平时应该怎么说或怎么做：
              </label>
              <textarea
                rows={3}
                placeholder="例如：阿峻才不会说多喝热水呢，你应该说晚上带我去吃潮汕牛肉火锅，多点我爱的吊龙和炸腐竹！"
                value={correctionInput}
                onChange={(e) => setCorrectionInput(e.target.value)}
                className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden leading-relaxed"
              />
              <p className="text-[10px] text-neutral-400">
                💡 提交后将作为最高优先级规则写入 Prompt，阿峻会立即服软道歉并永久记住！
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setCorrectionTarget(null)}
                className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl text-xs transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitCorrection}
                disabled={isSubmittingCorrection || !correctionInput.trim()}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                {isSubmittingCorrection ? "正在写入行为法则..." : "确定纠偏"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
