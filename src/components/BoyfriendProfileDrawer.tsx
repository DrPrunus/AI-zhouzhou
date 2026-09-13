import React, { useState } from "react";
import {
  X,
  Heart,
  Sparkles,
  Smile,
  BookOpen,
  Sliders,
  Plus,
  Trash2,
  Save,
  MessageSquare,
  Check,
  RefreshCw,
  Layers,
  BrainCircuit,
  Wand2,
  ShieldAlert,
  Coffee,
  Calendar,
  History,
  Send,
  HelpCircle,
} from "lucide-react";
import { BoyfriendPersona, ChatSettings, PersonaCorrection } from "../types";

interface BoyfriendProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  persona: BoyfriendPersona;
  onUpdatePersona: (newPersona: BoyfriendPersona) => void;
  settings: ChatSettings;
  onUpdateSettings: (newSettings: ChatSettings) => void;
  onReimport: () => void;
}

export const BoyfriendProfileDrawer: React.FC<BoyfriendProfileDrawerProps> = ({
  isOpen,
  onClose,
  persona,
  onUpdatePersona,
  settings,
  onUpdateSettings,
  onReimport,
}) => {
  const [activeTab, setActiveTab] = useState<"layers" | "memories" | "corrections" | "evolution" | "settings">("layers");
  const [editedPersona, setEditedPersona] = useState<BoyfriendPersona>(persona);

  // Quick inputs
  const [newPetName, setNewPetName] = useState("");
  const [newPetNameToHim, setNewPetNameToHim] = useState("");
  const [newCoreRule, setNewCoreRule] = useState("");
  const [newFoodPref, setNewFoodPref] = useState("");
  const [newDrinkPref, setNewDrinkPref] = useState("");
  const [newHabit, setNewHabit] = useState("");
  const [newInsideJoke, setNewInsideJoke] = useState("");

  // Correction input
  const [corScenario, setCorScenario] = useState("");
  const [corWrong, setCorWrong] = useState("");
  const [corRight, setCorRight] = useState("");

  // Incremental append state
  const [appendChatText, setAppendChatText] = useState("");
  const [isAppending, setIsAppending] = useState(false);
  const [appendNotice, setAppendNotice] = useState<string | null>(null);

  const [showSavedToast, setShowSavedToast] = useState(false);

  React.useEffect(() => {
    setEditedPersona(persona);
  }, [persona]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdatePersona(editedPersona);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 1800);
  };

  // Correction handling
  const handleAddCorrection = () => {
    if (!corRight.trim()) return;
    const newCor: PersonaCorrection = {
      id: `cor-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      scenario: corScenario.trim() || "日常相处场景",
      wrongBehavior: corWrong.trim() || "不够体贴或说话套路化",
      rightBehavior: corRight.trim(),
      appliedTo: "persona",
    };
    const updated = {
      ...editedPersona,
      corrections: [newCor, ...(editedPersona.corrections || [])],
    };
    setEditedPersona(updated);
    onUpdatePersona(updated);
    setCorScenario("");
    setCorWrong("");
    setCorRight("");
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 1800);
  };

  const handleRemoveCorrection = (id: string) => {
    const updated = {
      ...editedPersona,
      corrections: (editedPersona.corrections || []).filter((c) => c.id !== id),
    };
    setEditedPersona(updated);
    onUpdatePersona(updated);
  };

  // Incremental evolution call
  const handleRunAppendChat = async () => {
    if (!appendChatText.trim() || appendChatText.length < 5) return;
    setIsAppending(true);
    setAppendNotice(null);
    try {
      const res = await fetch("/api/append-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: editedPersona,
          newRawChat: appendChatText,
        }),
      });
      const data = await res.json();
      if (data.success && data.persona) {
        setEditedPersona(data.persona);
        onUpdatePersona(data.persona);
        setAppendChatText("");
        setAppendNotice(`✨ 进化成功！${data.summary || "已增量吸收最新生活记忆"}，版本升级至 ${data.persona.version || "v1.1"}`);
      } else {
        setAppendNotice(data.error || "增量提取失败，请重试");
      }
    } catch (e: any) {
      setAppendNotice(e.message || "请求超时");
    } finally {
      setIsAppending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
          {/* Top Header */}
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {editedPersona.boyfriendName.slice(0, 1) || "阿"}
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                  {editedPersona.boyfriendName} 的 ex-skill 数字分身
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    {editedPersona.version || "v1.0"}
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-500">
                  女朋友：{editedPersona.girlfriendName}（常唤【{editedPersona.petNamesToHer?.[0] || "可人"}】）
                </p>
              </div>
            </div>
            <button
              id="close-profile-drawer-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation with 5 ex-skill tabs */}
          <div className="flex border-b border-neutral-200 bg-white px-3 overflow-x-auto scrollbar-none">
            <button
              id="tab-layers-btn"
              onClick={() => setActiveTab("layers")}
              className={`py-2.5 px-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === "layers"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              五层人格 (5-Layers)
            </button>
            <button
              id="tab-memories-btn"
              onClick={() => setActiveTab("memories")}
              className={`py-2.5 px-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === "memories"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              共同记忆库 (Memories)
            </button>
            <button
              id="tab-corrections-btn"
              onClick={() => setActiveTab("corrections")}
              className={`py-2.5 px-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === "corrections"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              动态纠偏 (Corrections)
              {(editedPersona.corrections?.length || 0) > 0 && (
                <span className="bg-pink-100 text-pink-700 text-[10px] px-1 rounded-full font-bold">
                  {editedPersona.corrections?.length}
                </span>
              )}
            </button>
            <button
              id="tab-evolution-btn"
              onClick={() => setActiveTab("evolution")}
              className={`py-2.5 px-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === "evolution"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              增量进化 (Merger)
            </button>
            <button
              id="tab-settings-btn"
              onClick={() => setActiveTab("settings")}
              className={`py-2.5 px-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === "settings"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              体验设置
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-neutral-700">
            {/* TAB 1: 5-LAYERS */}
            {activeTab === "layers" && (
              <div className="space-y-4">
                {/* Architecture banner */}
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    ex-skill 五层人格模型 (Layer 0 ~ Layer 5)
                  </div>
                  <p className="text-neutral-600 leading-relaxed text-[11px]">
                    根据 perkfly/ex-skill 架构，人格由底层的“行为铁律”贯穿至“表达习惯与边界”，保证男友回复既有灵魂细节，又绝对符合真人习惯。
                  </p>
                </div>

                {/* Layer 0: Core Rules */}
                <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      Layer 0: 核心性格铁律（最高优先级条件-行为）
                    </div>
                    <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded font-medium">
                      不可违背
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {(editedPersona.layers?.layer0_coreRules || [
                      "当女友倾诉工作累或难过时，坚决用行动与拥抱解决，绝不说教或只说多喝热水",
                      "当女友亲昵称呼'阿峻'或'周周'时，必须有极度强烈的安全感与甜蜜归属感回应",
                      "绝不冷战，任何小摩擦必须在当天主动先哄好可人",
                    ]).map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 p-2 bg-white rounded-lg border border-amber-200/60 text-[11px] text-neutral-800"
                      >
                        <span className="flex-1">⚡ {rule}</span>
                        <button
                          onClick={() => {
                            const cur = [...(editedPersona.layers?.layer0_coreRules || [])];
                            cur.splice(idx, 1);
                            setEditedPersona({
                              ...editedPersona,
                              layers: { ...(editedPersona.layers || {}), layer0_coreRules: cur },
                            });
                          }}
                          className="text-neutral-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="新增一条核心铁律（如：可人生病时坚决点好外卖和温水）..."
                      value={newCoreRule}
                      onChange={(e) => setNewCoreRule(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newCoreRule.trim()) {
                          const cur = [...(editedPersona.layers?.layer0_coreRules || [])];
                          cur.push(newCoreRule.trim());
                          setEditedPersona({
                            ...editedPersona,
                            layers: { ...(editedPersona.layers || {}), layer0_coreRules: cur },
                          });
                          setNewCoreRule("");
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                    />
                    <button
                      onClick={() => {
                        if (!newCoreRule.trim()) return;
                        const cur = [...(editedPersona.layers?.layer0_coreRules || [])];
                        cur.push(newCoreRule.trim());
                        setEditedPersona({
                          ...editedPersona,
                          layers: { ...(editedPersona.layers || {}), layer0_coreRules: cur },
                        });
                        setNewCoreRule("");
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-xs shrink-0"
                    >
                      添加
                    </button>
                  </div>
                </div>

                {/* Layer 1: Identity */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2.5">
                  <span className="font-bold text-neutral-800 block text-xs">
                    Layer 1: 身份锚定 (Identity)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-neutral-500 block mb-1">女友叫他</span>
                      <input
                        type="text"
                        value={editedPersona.boyfriendName}
                        onChange={(e) => setEditedPersona({ ...editedPersona, boyfriendName: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block mb-1">男友本名</span>
                      <input
                        type="text"
                        value={editedPersona.realName || ""}
                        onChange={(e) => setEditedPersona({ ...editedPersona, realName: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block mb-1">男友小名</span>
                      <input
                        type="text"
                        value={editedPersona.nickname || ""}
                        onChange={(e) => setEditedPersona({ ...editedPersona, nickname: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block mb-1">女友姓名</span>
                      <input
                        type="text"
                        value={editedPersona.girlfriendName}
                        onChange={(e) => setEditedPersona({ ...editedPersona, girlfriendName: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Layer 2: Expression & Scenario Examples */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800 block text-xs">
                      Layer 2: 表达风格与真实情境例句 (Scenario Examples)
                    </span>
                    <span className="text-[10px] text-neutral-400">杜绝AI机器人味</span>
                  </div>

                  {editedPersona.layers?.layer2_expression?.scenarioExamples ? (
                    <div className="space-y-2">
                      {Object.entries(editedPersona.layers.layer2_expression.scenarioExamples).map(([key, val]) => (
                        <div key={key} className="bg-white p-2.5 rounded-lg border border-neutral-200 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {key === "askDaily" && "日常过得如何"}
                            {key === "sayMissYou" && "被说想你了"}
                            {key === "longTimeNoReply" && "没及时回消息"}
                            {key === "hearGoodNews" && "听到女友开心事"}
                            {key === "irritatedOrAngry" && "惹可人生气时"}
                            {key === "askWhatToEat" && "被问吃什么"}
                            {!["askDaily", "sayMissYou", "longTimeNoReply", "hearGoodNews", "irritatedOrAngry", "askWhatToEat"].includes(key) && key}
                          </span>
                          <p className="text-[11px] text-neutral-700 italic">“{val}”</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-400 italic">
                      当前使用的是系统预设的高拟真微信语料句库。
                    </p>
                  )}
                </div>

                {/* Layer 3: Emotional Logic */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2">
                  <span className="font-bold text-neutral-800 block text-xs">
                    Layer 3: 情感逻辑 (何时示爱 / 面对质疑时)
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-neutral-200">
                      <span className="font-bold text-neutral-600 block mb-0.5">面对可人质疑或撒娇查岗：</span>
                      <span>{editedPersona.layers?.layer3_emotionalLogic?.howFaceDoubts || "大大方方拍照报备，给足100%安全感，主动逗她开心"}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-neutral-200">
                      <span className="font-bold text-neutral-600 block mb-0.5">表达爱意方式：</span>
                      <span>{editedPersona.layers?.layer3_emotionalLogic?.whenExpressLove || "行动派为主，随时微信秒回，下班接送，买好吃的"}</span>
                    </div>
                  </div>
                </div>

                {/* Layer 5: Boundaries */}
                <div className="bg-red-50/40 border border-red-200/60 rounded-xl p-3.5 space-y-1.5">
                  <span className="font-bold text-red-900 block text-xs">
                    Layer 5: 行为底线与雷区
                  </span>
                  <p className="text-[11px] text-red-800">
                    - 绝不对可人说教或居高临下；
                    - 绝不冷落或隔夜冷战；
                    - 绝不与任何异性暧昧，边界感分明。
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: MEMORIES */}
            {activeTab === "memories" && (
              <div className="space-y-4">
                <div className="bg-pink-50/70 border border-pink-200/70 rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 text-pink-900 font-bold mb-1">
                    <Heart className="w-3.5 h-3.5 text-pink-600 fill-pink-600" />
                    ex-skill Part A: 共同记忆库 (Memories)
                  </div>
                  <p className="text-neutral-600 leading-relaxed text-[11px]">
                    包含恋爱故事、日常习惯、爱吃爱喝的偏好细节与只有两人懂的专属暗号。大模型在对话时会自动检索这些记忆，聊起来充满真实的默契。
                  </p>
                </div>

                {/* Relationship overview */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-1.5">
                  <label className="font-bold text-neutral-800 block text-xs">爱情故事概览</label>
                  <textarea
                    rows={2}
                    value={editedPersona.memories?.relationshipOverview || "阿峻和可人相识相伴，阿峻细心体贴，把可人捧在手心里疼爱"}
                    onChange={(e) =>
                      setEditedPersona({
                        ...editedPersona,
                        memories: {
                          ...(editedPersona.memories || {}),
                          relationshipOverview: e.target.value,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs leading-relaxed"
                  />
                </div>

                {/* Food Preferences */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800 flex items-center gap-1.5 text-xs">
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      饮食与饮品偏好细节
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-neutral-500 block mb-1">爱吃的美食：</span>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {(editedPersona.memories?.preferences?.food || ["潮汕牛肉火锅（必点吊龙、匙柄、炸腐竹）", "烤肉", "热腾腾的汤粉"]).map((food, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-white border border-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md text-[11px]">
                            {food}
                            <button
                              onClick={() => {
                                const cur = [...(editedPersona.memories?.preferences?.food || [])];
                                cur.splice(i, 1);
                                setEditedPersona({
                                  ...editedPersona,
                                  memories: {
                                    ...(editedPersona.memories || {}),
                                    preferences: { ...(editedPersona.memories?.preferences || { drinks: [], habits: [] }), food: cur },
                                  },
                                });
                              }}
                              className="text-neutral-400 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="添加爱吃的美食..."
                          value={newFoodPref}
                          onChange={(e) => setNewFoodPref(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newFoodPref.trim()) {
                              const cur = [...(editedPersona.memories?.preferences?.food || [])];
                              cur.push(newFoodPref.trim());
                              setEditedPersona({
                                ...editedPersona,
                                memories: {
                                  ...(editedPersona.memories || {}),
                                  preferences: { ...(editedPersona.memories?.preferences || { drinks: [], habits: [] }), food: cur },
                                },
                              });
                              setNewFoodPref("");
                            }
                          }}
                          className="flex-1 px-2 py-1 bg-white border border-neutral-300 rounded text-xs"
                        />
                        <button
                          onClick={() => {
                            if (!newFoodPref.trim()) return;
                            const cur = [...(editedPersona.memories?.preferences?.food || [])];
                            cur.push(newFoodPref.trim());
                            setEditedPersona({
                              ...editedPersona,
                              memories: {
                                ...(editedPersona.memories || {}),
                                preferences: { ...(editedPersona.memories?.preferences || { drinks: [], habits: [] }), food: cur },
                              },
                            });
                            setNewFoodPref("");
                          }}
                          className="px-2.5 py-1 bg-neutral-200 hover:bg-neutral-300 rounded text-xs"
                        >
                          加美食
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-neutral-500 block mb-1">奶茶饮品与生活细节：</span>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {(editedPersona.memories?.preferences?.drinks || ["奶茶喜欢半糖温热", "生理期不能喝冰"]).map((drink, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-white border border-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md text-[11px]">
                            {drink}
                            <button
                              onClick={() => {
                                const cur = [...(editedPersona.memories?.preferences?.drinks || [])];
                                cur.splice(i, 1);
                                setEditedPersona({
                                  ...editedPersona,
                                  memories: {
                                    ...(editedPersona.memories || {}),
                                    preferences: { ...(editedPersona.memories?.preferences || { food: [], habits: [] }), drinks: cur },
                                  },
                                });
                              }}
                              className="text-neutral-400 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="添加饮品习惯（如：半糖少冰、温开水）..."
                          value={newDrinkPref}
                          onChange={(e) => setNewDrinkPref(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newDrinkPref.trim()) {
                              const cur = [...(editedPersona.memories?.preferences?.drinks || [])];
                              cur.push(newDrinkPref.trim());
                              setEditedPersona({
                                ...editedPersona,
                                memories: {
                                  ...(editedPersona.memories || {}),
                                  preferences: { ...(editedPersona.memories?.preferences || { food: [], habits: [] }), drinks: cur },
                                },
                              });
                              setNewDrinkPref("");
                            }
                          }}
                          className="flex-1 px-2 py-1 bg-white border border-neutral-300 rounded text-xs"
                        />
                        <button
                          onClick={() => {
                            if (!newDrinkPref.trim()) return;
                            const cur = [...(editedPersona.memories?.preferences?.drinks || [])];
                            cur.push(newDrinkPref.trim());
                            setEditedPersona({
                              ...editedPersona,
                              memories: {
                                ...(editedPersona.memories || {}),
                                preferences: { ...(editedPersona.memories?.preferences || { food: [], habits: [] }), drinks: cur },
                              },
                            });
                            setNewDrinkPref("");
                          }}
                          className="px-2.5 py-1 bg-neutral-200 hover:bg-neutral-300 rounded text-xs"
                        >
                          加习惯
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Rituals & Inside Jokes */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2">
                  <span className="font-bold text-neutral-800 block text-xs">专属暗号与情侣梗</span>
                  <div className="space-y-1.5">
                    {(editedPersona.memories?.insideJokes || ["迟到罚剥虾一只", "叫'张溯峻'就是要立刻乖乖认错立正站好", "报告长官"]).map((joke, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white rounded border border-neutral-200 text-[11px]">
                        <span>🤫 {joke}</span>
                        <button
                          onClick={() => {
                            const cur = [...(editedPersona.memories?.insideJokes || [])];
                            cur.splice(i, 1);
                            setEditedPersona({
                              ...editedPersona,
                              memories: { ...(editedPersona.memories || {}), insideJokes: cur },
                            });
                          }}
                          className="text-neutral-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="新增两人专属暗号..."
                      value={newInsideJoke}
                      onChange={(e) => setNewInsideJoke(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                    />
                    <button
                      onClick={() => {
                        if (!newInsideJoke.trim()) return;
                        const cur = [...(editedPersona.memories?.insideJokes || [])];
                        cur.push(newInsideJoke.trim());
                        setEditedPersona({
                          ...editedPersona,
                          memories: { ...(editedPersona.memories || {}), insideJokes: cur },
                        });
                        setNewInsideJoke("");
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CORRECTIONS */}
            {activeTab === "corrections" && (
              <div className="space-y-4">
                <div className="bg-purple-50/70 border border-purple-200/70 rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 text-purple-900 font-bold mb-1">
                    <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                    ex-skill Correction 动态纠偏机制
                  </div>
                  <p className="text-neutral-600 leading-relaxed text-[11px]">
                    当男友分身回复不够符合你的真实期望或说了不该说的话时，纠偏指令会作为【最高优先级规则】被写入模型 Prompt。永久生效，越聊越像！
                  </p>
                </div>

                {/* Form to add correction */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2.5">
                  <span className="font-bold text-neutral-800 block text-xs">新增纠偏指令 (调教分身)</span>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-neutral-500 block mb-1">触发场景（如：被可人叫大名时 / 可人生病时）</span>
                      <input
                        type="text"
                        placeholder="例如：可人说肚子疼不舒服时"
                        value={corScenario}
                        onChange={(e) => setCorScenario(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block mb-1">不应该做什么（错误言行）</span>
                      <input
                        type="text"
                        placeholder="例如：只说'多喝热水好好休息'这类套话"
                        value={corWrong}
                        onChange={(e) => setCorWrong(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block mb-1">必须怎么做（正确行为，最高优执行）</span>
                      <input
                        type="text"
                        placeholder="例如：立刻问要不要点红糖水和跑腿送药，并主动提出下班飞奔过来陪可人"
                        value={corRight}
                        onChange={(e) => setCorRight(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddCorrection}
                    disabled={!corRight.trim()}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> 保存纠偏规则
                  </button>
                </div>

                {/* List of corrections */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800 text-xs">已生效纠偏条目 (按时间倒序)</span>
                    <span className="text-[10px] text-neutral-400">
                      共 {editedPersona.corrections?.length || 0} 条
                    </span>
                  </div>

                  {(editedPersona.corrections || []).length === 0 ? (
                    <div className="p-4 text-center text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
                      暂无纠偏记录。在聊天时点击气泡下方的“纠偏”按钮即可随时教阿峻更懂你！
                    </div>
                  ) : (
                    (editedPersona.corrections || []).map((cor) => (
                      <div
                        key={cor.id}
                        className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-1.5 text-[11px]"
                      >
                        <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                          <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            场景: {cor.scenario}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>{cor.timestamp}</span>
                            <button
                              onClick={() => handleRemoveCorrection(cor.id)}
                              className="text-neutral-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-red-600/90 line-through">
                          ❌ {cor.wrongBehavior}
                        </div>
                        <div className="text-emerald-700 font-medium">
                          ✅ {cor.rightBehavior}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: EVOLUTION (Incremental Merger) */}
            {activeTab === "evolution" && (
              <div className="space-y-4">
                <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold mb-1">
                    <BrainCircuit className="w-3.5 h-3.5 text-blue-600" />
                    ex-skill Merger 增量记忆提取与进化
                  </div>
                  <p className="text-neutral-600 leading-relaxed text-[11px]">
                    情侣的生活每天都在更新！无需重新训练，只需把你们这几天最新的微信聊天片段、日记或美食打卡记录粘贴在下方，系统会自动提取新的习惯、梗与纪念时刻并无缝融合！
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-neutral-800 block text-xs">
                    粘贴最新微信聊天记录或生活随笔
                  </label>
                  <textarea
                    rows={6}
                    placeholder="如：
2026/09/12 21:00
可人：今天下班我们去吃那家新开的潮汕生腌吧！
阿峻：收到！下班我开车去接你，记得带外套降温啦~"
                    value={appendChatText}
                    onChange={(e) => setAppendChatText(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono leading-relaxed"
                  />
                  <button
                    onClick={handleRunAppendChat}
                    disabled={isAppending || appendChatText.trim().length < 5}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    {isAppending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        AI正在增量蒸馏并融合最新生活细节...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        增量吸收记忆并升级分身版本
                      </>
                    )}
                  </button>
                </div>

                {appendNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs leading-relaxed">
                    {appendNotice}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: SETTINGS */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                {/* Sweetness Slider */}
                <div className="space-y-2 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                      恋爱甜度模式
                    </span>
                    <span className="text-xs font-bold text-pink-600">{settings.sweetness}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={settings.sweetness}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, sweetness: Number(e.target.value) })
                    }
                    className="w-full accent-pink-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>沉稳靠谱</span>
                    <span>温暖体贴</span>
                    <span>极度宠溺/肉麻</span>
                  </div>
                </div>

                {/* Humor Slider */}
                <div className="space-y-2 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                      <Smile className="w-3.5 h-3.5 text-amber-500" />
                      幽默接梗程度
                    </span>
                    <span className="text-xs font-bold text-amber-600">{settings.humor}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={settings.humor}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, humor: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>沉着认真</span>
                    <span>适度幽默</span>
                    <span>爆笑接梗逗乐</span>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer">
                    <div>
                      <div className="font-bold text-neutral-800">微信真实分句连发</div>
                      <div className="text-[11px] text-neutral-400">
                        像真人打字一样，一次回复2~3条简短有温度的消息气泡
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.splitBubbles}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, splitBubbles: e.target.checked })
                      }
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer">
                    <div>
                      <div className="font-bold text-neutral-800">打字延迟与“正在输入”</div>
                      <div className="text-[11px] text-neutral-400">
                        顶部显示“对方正在输入...”，模拟真人敲键盘节奏
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.typingDelay}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, typingDelay: e.target.checked })
                      }
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer">
                    <div>
                      <div className="font-bold text-neutral-800">微信提示音效</div>
                      <div className="text-[11px] text-neutral-400">
                        发送和接收消息时播放清脆提示音
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.soundEffects}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, soundEffects: e.target.checked })
                      }
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                  </label>
                </div>

                {/* Re-import trigger */}
                <div className="pt-4 border-t border-neutral-200">
                  <button
                    id="drawer-reimport-btn"
                    onClick={() => {
                      onClose();
                      onReimport();
                    }}
                    className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-neutral-500" />
                    重新导入完整的微信聊天记录
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Save Actions */}
          <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3">
            <button
              id="save-persona-btn"
              onClick={handleSave}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" /> 保存分身修改
            </button>
            <button
              id="close-persona-drawer-btn"
              onClick={onClose}
              className="py-2.5 px-4 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 rounded-xl font-medium transition-colors"
            >
              完成
            </button>
          </div>

          {showSavedToast && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-neutral-900/90 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> 分身设定已保存更新
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
