import React, { useState } from "react";
import { X, Copy, Check, Heart, Sparkles, Send, Smartphone } from "lucide-react";
import { BoyfriendPersona } from "../types";

interface ShareGirlfriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: BoyfriendPersona;
}

export const ShareGirlfriendModal: React.FC<ShareGirlfriendModalProps> = ({
  isOpen,
  onClose,
  persona,
}) => {
  const [copied, setCopied] = useState(false);
  const bfDisplay = persona.boyfriendName || "阿峻";
  const bfSub = persona.nickname ? `（${persona.nickname}）` : "";
  const [customGreeting, setCustomGreeting] = useState(
    `宝贝，这是我用咱们平时的微信聊天记录生成的专属【电子${bfDisplay}${bfSub}】！我忙的时候或者你想我了，就随时跟它聊天，它会用阿峻（周周）平时的语气和口癖陪你嗷❤️`
  );

  if (!isOpen) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    const fullText = `${customGreeting}\n\n👉 专属入口：${currentUrl}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative animate-fade-in">
        {/* Close */}
        <button
          id="close-share-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6 fill-pink-600" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">
            把电子分身送给【{persona.girlfriendName}】
          </h3>
          <p className="text-xs text-neutral-500">
            复制链接与甜蜜留言发给她，即可进入微信聊天模式
          </p>
        </div>

        {/* Card preview */}
        <div className="bg-gradient-to-br from-pink-50 to-emerald-50 rounded-xl p-4 border border-pink-100/80 space-y-2.5 text-xs text-neutral-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              {persona.boyfriendName.slice(0, 1)}
            </div>
            <div>
              <div className="font-bold text-neutral-900">
                {persona.boyfriendName} 的恋爱数字分身
              </div>
              <div className="text-[10px] text-emerald-700">
                专属昵称：{(persona.petNamesToHer || []).join(" / ")}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
              发给她的甜蜜留言：
            </label>
            <textarea
              rows={3}
              value={customGreeting}
              onChange={(e) => setCustomGreeting(e.target.value)}
              className="w-full p-2 bg-white/90 border border-neutral-200 rounded-lg text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            id="copy-share-text-btn"
            onClick={handleCopyLink}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                已复制邀请留言与专属链接！
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                一键复制留言与微信聊天链接
              </>
            )}
          </button>

          <button
            id="test-girlfriend-mode-btn"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Smartphone className="w-4 h-4 text-neutral-500" />
            留在当前页面直接体验女朋友聊天
          </button>
        </div>
      </div>
    </div>
  );
};
