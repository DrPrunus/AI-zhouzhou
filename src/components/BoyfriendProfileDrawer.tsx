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
} from "lucide-react";
import { BoyfriendPersona, ChatSettings } from "../types";

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
  const [activeTab, setActiveTab] = useState<"persona" | "settings">("persona");
  const [editedPersona, setEditedPersona] = useState<BoyfriendPersona>(persona);
  const [newPetName, setNewPetName] = useState("");
  const [newPetNameToHim, setNewPetNameToHim] = useState("");
  const [newMemory, setNewMemory] = useState("");
  const [newCatchphrase, setNewCatchphrase] = useState("");
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

  const handleAddPetName = () => {
    if (!newPetName.trim()) return;
    setEditedPersona({
      ...editedPersona,
      petNamesToHer: [...(editedPersona.petNamesToHer || []), newPetName.trim()],
    });
    setNewPetName("");
  };

  const handleRemovePetName = (index: number) => {
    const updated = [...editedPersona.petNamesToHer];
    updated.splice(index, 1);
    setEditedPersona({ ...editedPersona, petNamesToHer: updated });
  };

  const handleAddPetNameToHim = () => {
    if (!newPetNameToHim.trim()) return;
    setEditedPersona({
      ...editedPersona,
      petNamesToHim: [...(editedPersona.petNamesToHim || []), newPetNameToHim.trim()],
    });
    setNewPetNameToHim("");
  };

  const handleRemovePetNameToHim = (index: number) => {
    const updated = [...(editedPersona.petNamesToHim || [])];
    updated.splice(index, 1);
    setEditedPersona({ ...editedPersona, petNamesToHim: updated });
  };

  const handleAddMemory = () => {
    if (!newMemory.trim()) return;
    setEditedPersona({
      ...editedPersona,
      memoriesAndTopics: [...(editedPersona.memoriesAndTopics || []), newMemory.trim()],
    });
    setNewMemory("");
  };

  const handleRemoveMemory = (index: number) => {
    const updated = [...editedPersona.memoriesAndTopics];
    updated.splice(index, 1);
    setEditedPersona({ ...editedPersona, memoriesAndTopics: updated });
  };

  const handleAddCatchphrase = () => {
    if (!newCatchphrase.trim()) return;
    setEditedPersona({
      ...editedPersona,
      catchphrases: [...(editedPersona.catchphrases || []), newCatchphrase.trim()],
    });
    setNewCatchphrase("");
  };

  const handleRemoveCatchphrase = (index: number) => {
    const updated = [...editedPersona.catchphrases];
    updated.splice(index, 1);
    setEditedPersona({ ...editedPersona, catchphrases: updated });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Top Header */}
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {editedPersona.boyfriendName.slice(0, 1) || "男"}
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                  {editedPersona.boyfriendName} 的电子分身设定
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                    已激活
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-500">
                  女朋友称呼：{editedPersona.girlfriendName}
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

          {/* Sub Navigation */}
          <div className="flex border-b border-neutral-200 bg-white px-4">
            <button
              id="profile-tab-persona-btn"
              onClick={() => setActiveTab("persona")}
              className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 ${
                activeTab === "persona"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              性格与恋爱记忆
            </button>
            <button
              id="profile-tab-settings-btn"
              onClick={() => setActiveTab("settings")}
              className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 ${
                activeTab === "settings"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              聊天体验与参数微调
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-neutral-700">
            {activeTab === "persona" ? (
              <>
                {/* Intro summary card */}
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    分身自述 (AI根据聊天分析生成)
                  </div>
                  <p className="text-neutral-600 leading-relaxed italic">
                    "{editedPersona.summaryIntro}"
                  </p>
                </div>

                {/* Names */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-800 block">基础姓名与身份</label>
                    <span className="text-[11px] text-neutral-400">已设定为张溯峻(阿峻/周周)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-neutral-500 block mb-1">女友常叫名称 (如: 阿峻)</span>
                      <input
                        type="text"
                        value={editedPersona.boyfriendName}
                        onChange={(e) =>
                          setEditedPersona({ ...editedPersona, boyfriendName: e.target.value })
                        }
                        placeholder="如：阿峻"
                        className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block mb-1">男友本名 (如: 张溯峻)</span>
                      <input
                        type="text"
                        value={editedPersona.realName || ""}
                        onChange={(e) =>
                          setEditedPersona({ ...editedPersona, realName: e.target.value })
                        }
                        placeholder="如：张溯峻"
                        className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block mb-1">男友小名 (如: 周周)</span>
                      <input
                        type="text"
                        value={editedPersona.nickname || ""}
                        onChange={(e) =>
                          setEditedPersona({ ...editedPersona, nickname: e.target.value })
                        }
                        placeholder="如：周周"
                        className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-500 block mb-1">女友真实姓名 (如: 尚可人)</span>
                      <input
                        type="text"
                        value={editedPersona.girlfriendName}
                        onChange={(e) =>
                          setEditedPersona({ ...editedPersona, girlfriendName: e.target.value })
                        }
                        placeholder="如：尚可人"
                        className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Pet names to him (What she calls him) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-800">女友对男友的称呼</label>
                    <span className="text-[11px] text-neutral-400">听到这些称呼自然应答</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(editedPersona.petNamesToHim || ["阿峻", "周周", "张溯峻", "峻峻", "老公"]).map((pet, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
                      >
                        {pet}
                        <button
                          type="button"
                          onClick={() => handleRemovePetNameToHim(idx)}
                          className="hover:text-emerald-950 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newPetNameToHim}
                      onChange={(e) => setNewPetNameToHim(e.target.value)}
                      placeholder="添加她对你的叫法，如：峻哥"
                      onKeyDown={(e) => e.key === "Enter" && handleAddPetNameToHim()}
                      className="flex-1 px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddPetNameToHim}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> 添加
                    </button>
                  </div>
                </div>

                {/* Pet names to her */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-800">对她的专属昵称</label>
                    <span className="text-[11px] text-neutral-400">回复时会随机亲昵称呼</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {editedPersona.petNamesToHer.map((pet, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-100 text-xs font-medium"
                      >
                        {pet}
                        <button
                          type="button"
                          onClick={() => handleRemovePetName(idx)}
                          className="hover:text-pink-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      value={newPetName}
                      onChange={(e) => setNewPetName(e.target.value)}
                      placeholder="添加专属爱称，如：笨蛋宝"
                      onKeyDown={(e) => e.key === "Enter" && handleAddPetName()}
                      className="flex-1 px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddPetName}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> 添加
                    </button>
                  </div>
                </div>

                {/* Personality traits */}
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-800 block">性格特征标签</label>
                  <div className="flex flex-wrap gap-1.5">
                    {editedPersona.personalityTraits.map((trait, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-medium"
                      >
                        #{trait}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Catchphrases */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-800">常说口头禅与高频口癖</label>
                    <span className="text-[11px] text-neutral-400">还原打字习惯</span>
                  </div>
                  <div className="space-y-1">
                    {editedPersona.catchphrases.map((phrase, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-200"
                      >
                        <span className="text-neutral-700">“{phrase}”</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCatchphrase(idx)}
                          className="text-neutral-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newCatchphrase}
                      onChange={(e) => setNewCatchphrase(e.target.value)}
                      placeholder="新增口头禅，如：收到长官！"
                      onKeyDown={(e) => e.key === "Enter" && handleAddCatchphrase()}
                      className="flex-1 px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCatchphrase}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> 添加
                    </button>
                  </div>
                </div>

                {/* Memories & shared topics */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-neutral-800">共同恋爱记忆库</label>
                    <span className="text-[11px] text-neutral-400">AI 会主动在对话中提起</span>
                  </div>
                  <div className="space-y-1.5">
                    {editedPersona.memoriesAndTopics.map((mem, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between bg-neutral-50 p-2 rounded-lg border border-neutral-200"
                      >
                        <span className="text-neutral-700 leading-relaxed text-[11px]">{mem}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMemory(idx)}
                          className="text-neutral-400 hover:text-red-500 shrink-0 ml-2 mt-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <textarea
                      rows={2}
                      value={newMemory}
                      onChange={(e) => setNewMemory(e.target.value)}
                      placeholder="添加你们专属的回忆，如：她最爱吃哪家店、养的宠物叫什么、约好国庆一起去哪..."
                      className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddMemory}
                      className="w-full py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> 补充恋爱记忆细节
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Settings Tab */
              <div className="space-y-6">
                {/* Sweetness Slider */}
                <div className="space-y-2 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-pink-500" />
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
                        顶部显示“对方正在输入...”，等待800ms后逐条弹出消息
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
                    重新导入新的微信聊天记录
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
