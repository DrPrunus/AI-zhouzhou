import React, { useState } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  Heart,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MessageSquareQuote,
  Flame,
  User,
  ShieldCheck,
} from "lucide-react";
import { BoyfriendPersona, PresetChat } from "../types";
import { parseWeChatChat } from "../utils/wechatParser";
import { PRESET_CHATS } from "../data/presetChats";

interface ChatImportViewProps {
  onPersonaGenerated: (persona: BoyfriendPersona) => void;
  onCancel?: () => void;
  currentPersona?: BoyfriendPersona;
}

export const ChatImportView: React.FC<ChatImportViewProps> = ({
  onPersonaGenerated,
  onCancel,
  currentPersona,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "preset">("upload");
  const [rawChat, setRawChat] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [boyfriendName, setBoyfriendName] = useState(currentPersona?.boyfriendName || "阿峻");
  const [girlfriendName, setGirlfriendName] = useState(currentPersona?.girlfriendName || "尚可人");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // Parse stats
  const parsedStats = React.useMemo(() => {
    return parseWeChatChat(rawChat);
  }, [rawChat]);

  // If senders detected and names empty, auto fill
  React.useEffect(() => {
    if (parsedStats.senders.length >= 2) {
      if (!boyfriendName) setBoyfriendName(parsedStats.senders[0].name);
      if (!girlfriendName) setGirlfriendName(parsedStats.senders[1].name);
    } else if (parsedStats.senders.length === 1 && !boyfriendName) {
      setBoyfriendName(parsedStats.senders[0].name);
    }
  }, [parsedStats.senders]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawChat(content);
        setErrorMsg("");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawChat(content);
        setErrorMsg("");
      }
    };
    reader.readAsText(file);
  };

  const handleSelectPreset = (preset: PresetChat) => {
    setRawChat(preset.rawText);
    setBoyfriendName(preset.boyfriendName);
    setGirlfriendName(preset.girlfriendName);
    setActiveTab("upload");
  };

  const handleStartAnalysis = async () => {
    if (!rawChat.trim() || rawChat.trim().length < 20) {
      setErrorMsg("请至少输入或上传 20 字以上的微信聊天记录，内容越多，电子男友越还原！");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg("");
    setAnalysisStep(1);

    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1200);

    try {
      const res = await fetch("/api/analyze-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawChat,
          boyfriendName: boyfriendName.trim(),
          girlfriendName: girlfriendName.trim(),
        }),
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "分析失败，请重试");
      }

      setAnalysisStep(4);
      setTimeout(() => {
        setIsAnalyzing(false);
        const effectiveGfName = girlfriendName.trim() || data.persona.girlfriendName || "尚可人";
        const rawPetNamesToHer: string[] = Array.isArray(data.persona.petNamesToHer)
          ? data.persona.petNamesToHer
          : [];
        // Ensure "可人" is present and prioritized when gf is 尚可人 or 可人
        const enrichedPetNames = rawPetNamesToHer.includes("可人")
          ? rawPetNamesToHer
          : (effectiveGfName.includes("可人")
              ? ["可人", "可人宝", ...rawPetNamesToHer.filter((n) => n !== "可人")]
              : rawPetNamesToHer);

        onPersonaGenerated({
          ...data.persona,
          boyfriendName: data.persona.boyfriendName || boyfriendName || "阿峻",
          realName: data.persona.realName || currentPersona?.realName || "张溯峻",
          nickname: data.persona.nickname || currentPersona?.nickname || "周周",
          girlfriendName: effectiveGfName,
          petNamesToHer: enrichedPetNames.length > 0 ? enrichedPetNames : ["可人", "可人宝", "宝贝", "乖乖"],
          petNamesToHim: data.persona.petNamesToHim && data.persona.petNamesToHim.length > 0
            ? data.persona.petNamesToHim
            : ["阿峻", "周周", "张溯峻", "峻峻", "老公"],
        });
      }, 600);
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      setErrorMsg(err.message || "分析聊天记录时发生错误，请稍后再试");
    }
  };

  return (
    <div id="chat-import-container" className="w-full max-w-4xl mx-auto p-4 md:p-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              微信恋爱分身 AI 建模引擎
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              导入微信聊天记录，生成电子男友
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              AI 深度分析你的语气口吻、专属昵称、习惯口头禅与恋爱回忆，高拟真复刻你的微信聊天风格
            </p>
          </div>
          {onCancel && (
            <button
              id="back-to-chat-btn"
              onClick={onCancel}
              className="text-neutral-600 hover:text-neutral-900 text-sm font-medium px-4 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              返回聊天
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 mt-6 gap-6">
          <button
            id="tab-upload-btn"
            onClick={() => setActiveTab("upload")}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === "upload"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            自定义导入微信聊天
          </button>
          <button
            id="tab-preset-btn"
            onClick={() => setActiveTab("preset")}
            className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 ${
              activeTab === "preset"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Flame className="w-4 h-4 text-orange-500" />
            精选真实情侣预设 (快速体验)
          </button>
        </div>
      </div>

      {activeTab === "preset" ? (
        /* Presets Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {PRESET_CHATS.map((preset) => (
            <div
              key={preset.id}
              className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-3">
                  {preset.tag}
                </div>
                <h3 className="text-base font-bold text-neutral-900 mb-1">
                  {preset.title}
                </h3>
                <p className="text-xs text-neutral-500 mb-4 line-clamp-2">
                  {preset.description}
                </p>
                <div className="bg-neutral-50 rounded-lg p-3 text-xs text-neutral-600 mb-4 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">男友角色：</span>
                    <span className="font-semibold text-neutral-800">{preset.boyfriendName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">女友称谓：</span>
                    <span className="font-semibold text-neutral-800">{preset.girlfriendName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">口头禅示例：</span>
                    <span className="text-emerald-700 truncate max-w-[140px]">
                      {preset.samplePersona.catchphrases[0]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  id={`apply-preset-direct-${preset.id}`}
                  onClick={() => onPersonaGenerated(preset.samplePersona)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  直接使用此前缀分身
                </button>
                <button
                  id={`load-preset-text-${preset.id}`}
                  onClick={() => handleSelectPreset(preset)}
                  className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  载入聊天记录并微调
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Upload & Input Area */
        <div className="space-y-6">
          {/* Top tips & help toggle */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100 flex items-start justify-between gap-3 text-xs text-emerald-800">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">隐私与安全提示：</span>
                你的聊天记录仅在后端调用 Gemini 模型生成专属性格提示词，不会公开或泄漏，请放心使用。
              </div>
            </div>
            <button
              id="toggle-help-guide-btn"
              onClick={() => setShowHelp(!showHelp)}
              className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 shrink-0 underline"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              如何导出微信记录？
            </button>
          </div>

          {/* Guide drawer if opened */}
          {showHelp && (
            <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm text-xs text-neutral-600 space-y-3">
              <h4 className="font-bold text-neutral-800 text-sm flex items-center gap-1.5">
                <MessageSquareQuote className="w-4 h-4 text-emerald-600" />
                获取微信聊天记录的 3 种简单方法
              </h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong className="text-neutral-800">直接多选复制（最推荐）：</strong>
                  在电脑或手机微信中，长按或右键任意消息 → 点击【多选】 → 勾选你平时和女朋友说话典型的几十条对话 → 点击右下角【邮件/逐条转发】或直接复制，粘贴到下方文本框。
                </li>
                <li>
                  <strong className="text-neutral-800">电脑微信导出：</strong>
                  在微信电脑端选中两人对话，Ctrl+A 全选并 Ctrl+C 复制，直接粘贴即可。系统会自动解析时间戳和姓名！
                </li>
                <li>
                  <strong className="text-neutral-800">txt/json 文件上传：</strong>
                  如果你使用了微信备份或第三方备份导出的 .txt 或 .json 文件，可直接拖入下方上传区。
                </li>
              </ol>
            </div>
          )}

          {/* Drag & Drop File Upload & Text Area */}
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-neutral-300 hover:border-emerald-500 rounded-xl p-6 text-center bg-neutral-50/50 transition-colors"
            >
              <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-700">
                拖拽微信聊天记录文本文件（.txt / .json / .csv）到此处
              </p>
              <p className="text-xs text-neutral-400 mt-1">或者</p>
              <label
                htmlFor="file-upload-input"
                className="mt-2 inline-block px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-lg cursor-pointer shadow-2xs transition-colors"
              >
                选择文件上传
              </label>
              <input
                id="file-upload-input"
                type="file"
                accept=".txt,.json,.csv,.log"
                onChange={handleFileUpload}
                className="hidden"
              />
              {selectedFile && (
                <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 已加载：{selectedFile.name} (
                  {(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="raw-chat-textarea" className="text-xs font-bold text-neutral-700">
                  或者直接粘贴微信聊天文本记录：
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">
                    已输入 {rawChat.length} 字
                  </span>
                  {rawChat && (
                    <button
                      id="clear-chat-text-btn"
                      onClick={() => setRawChat("")}
                      className="text-xs text-red-500 hover:underline"
                    >
                      清空
                    </button>
                  )}
                </div>
              </div>
              <textarea
                id="raw-chat-textarea"
                rows={8}
                value={rawChat}
                onChange={(e) => setRawChat(e.target.value)}
                placeholder={`示例格式（直接从微信复制即可）：
2024-03-12 18:20:00 [阿哲]: 宝贝下班了吗？今天降温了记得多穿点嗷
2024-03-12 18:21:10 [棠棠]: 刚出公司地铁站，冻死我了呜呜呜
2024-03-12 18:21:40 [阿哲]: 摸摸头抱抱！快进屋，我给你点了热奶茶马上到！
...`}
                className="w-full p-3.5 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-neutral-800 leading-relaxed"
              />
            </div>

            {/* Smart Detection & Speaker Assignment */}
            {parsedStats.totalMessages > 0 && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    已自动识别 {parsedStats.totalMessages} 条对话记录
                  </span>
                  <span className="text-xs text-neutral-500">
                    检测到 {parsedStats.senders.length} 个角色
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label htmlFor="boyfriend-name-input" className="block text-xs font-medium text-neutral-600 mb-1">
                      我是男方（待克隆的电子男友）：
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="boyfriend-name-input"
                        type="text"
                        value={boyfriendName}
                        onChange={(e) => setBoyfriendName(e.target.value)}
                        placeholder="例如：阿哲 / 微信昵称"
                        className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    {parsedStats.senders.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="text-[11px] text-neutral-400">快捷选择：</span>
                        {parsedStats.senders.map((s) => (
                          <button
                            key={s.name}
                            type="button"
                            onClick={() => setBoyfriendName(s.name)}
                            className={`text-[11px] px-2 py-0.5 rounded ${
                              boyfriendName === s.name
                                ? "bg-emerald-600 text-white font-medium"
                                : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                            }`}
                          >
                            {s.name} ({s.count}条)
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="girlfriend-name-input" className="block text-xs font-medium text-neutral-600 mb-1">
                      我的女朋友（聊天对象）：
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="girlfriend-name-input"
                        type="text"
                        value={girlfriendName}
                        onChange={(e) => setGirlfriendName(e.target.value)}
                        placeholder="例如：棠棠 / 宝贝"
                        className="w-full text-xs px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    {parsedStats.senders.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="text-[11px] text-neutral-400">快捷选择：</span>
                        {parsedStats.senders.map((s) => (
                          <button
                            key={s.name}
                            type="button"
                            onClick={() => setGirlfriendName(s.name)}
                            className={`text-[11px] px-2 py-0.5 rounded ${
                              girlfriendName === s.name
                                ? "bg-pink-600 text-white font-medium"
                                : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                            }`}
                          >
                            {s.name} ({s.count}条)
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action button */}
            <div className="pt-2">
              <button
                id="start-analyze-btn"
                disabled={isAnalyzing || !rawChat.trim()}
                onClick={handleStartAnalysis}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>AI 正在全盘分析微信记录...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    开始生成我的电子男友分身
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis overlay modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Heart className="w-8 h-8 fill-emerald-600" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-neutral-900">
                正在提炼你的电子男友数字分身
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Gemini 模型正在逐条扫描两人的互动模式与爱意表达
              </p>
            </div>

            <div className="space-y-3 text-left bg-neutral-50 rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    analysisStep >= 1 ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {analysisStep > 1 ? "✓" : "1"}
                </div>
                <span className={analysisStep >= 1 ? "text-emerald-900 font-medium" : "text-neutral-400"}>
                  扫描日常聊天习惯与高频口癖...
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    analysisStep >= 2 ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {analysisStep > 2 ? "✓" : "2"}
                </div>
                <span className={analysisStep >= 2 ? "text-emerald-900 font-medium" : "text-neutral-400"}>
                  提取专属昵称（“宝贝”、“小猪”）与口头禅...
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    analysisStep >= 3 ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {analysisStep > 3 ? "✓" : "3"}
                </div>
                <span className={analysisStep >= 3 ? "text-emerald-900 font-medium" : "text-neutral-400"}>
                  学习情绪应对方式（疲惫安慰、生病关心、小打小闹）...
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    analysisStep >= 4 ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {analysisStep >= 4 ? "✓" : "4"}
                </div>
                <span className={analysisStep >= 4 ? "text-emerald-900 font-medium" : "text-neutral-400"}>
                  生成定制化微信角色 Prompt 与记忆库...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
