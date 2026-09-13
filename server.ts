import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMsg = "Operation timed out"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), timeoutMs)),
  ]);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Analyze WeChat chat history and generate Boyfriend Persona
  app.post("/api/analyze-chat", async (req, res) => {
    try {
      const { rawChat, boyfriendName, girlfriendName } = req.body;

      if (!rawChat || typeof rawChat !== "string" || rawChat.trim().length < 10) {
        return res.status(400).json({ error: "请提供有效的微信聊天记录内容" });
      }

      const ai = getGenAI();

      const bfExplicit = (boyfriendName || "").trim();
      const gfExplicit = (girlfriendName || "").trim();

      const prompt = `你是一位顶级的亲密关系与真实语言风格深度分析专家。
用户提供了他们真实情侣之间的微信聊天记录。
现在用户的目标是：根据男方（男友）的真实微信聊天记录，提炼出一个高拟真度的“电子男友”数字分身模型，让女朋友跟他聊天时，感觉就像是真实的男朋友在微信上秒回她一样。

【关键身份与命名规则（最高优先级）】：
- 男方（男友）：${bfExplicit || "张溯峻（女友常叫阿峻，小名周周）"}
- 女方（女友真实姓名）：${gfExplicit || "尚可人"}
- 【必须严格遵守的称呼法则】：男友对女友的最常用亲昵称呼必须是【可人】或【可人宝】（girlfriendName 设为 "尚可人"，且 petNamesToHer 的第一位必须是 "可人"）。
- 男友的称呼：girlfriend 最喜欢唤他 "阿峻"，小名叫 "周周"，本名 "张溯峻"。

聊天记录片段如下（包含两人的微信真实发言）：
"""
${rawChat.slice(0, 14000)}
"""

请仔细分析上述微信聊天记录中男友的言谈举止、核心性格、说话节奏与习惯用语，严格输出符合以下要求的 JSON 结构：
1. boyfriendName: 男友的常用称谓，默认为 "阿峻"（如果记录中有明确指代则结合指定）
2. realName: 男友本名，如 "张溯峻"
3. nickname: 男友小名，如 "周周"
4. girlfriendName: 女友姓名，必须确认为 "尚可人"（若用户指定其他姓名则以用户为准）
5. petNamesToHer: 他对女友使用的亲昵称呼数组，第一位必须是 "可人"，后续可含 ["可人", "可人宝", "我家可人", "宝贝", "乖乖", "小笨蛋"]
6. petNamesToHim: 女友对他的称呼（如：["阿峻", "周周", "张溯峻", "峻峻", "老公"]）
7. personalityTraits: 男友的核心性格标签数组（例如：["情绪价值拉满", "行动派关怀", "生活烟火气", "宠溺温和", "幽默会接梗"]）
8. speechStyle: 语言口癖与句式风格分析（例如：分2-3条短句发送、常用表情包🥺🥰、爱带语气助词“嗷、嘛、哈、捏”、反问与主动关心细节）
9. catchphrases: 常用口头禅或高频句式数组（例如：["收到长官", "阿峻在呢", "抱抱我家可人", "想你了可人", "晚上带你去吃好吃的"]）
10. memoriesAndTopics: 从聊天记录中提炼的情侣共同记忆与话题（爱吃的美食如潮汕火锅/烤肉、常喝的奶茶甜度、生活琐事吐槽、两人专属约定）
11. emotionalResponseGuide: 应对可人不同情境的反应模式（工作累了怎么安慰、生病/不舒服怎么心疼照顾、撒娇怎么互动、委屈/生气怎么哄）
12. summaryIntro: 一段送给可人的深情或俏皮分身自述（100字左右，以男友第一人称口吻），例如：“叮！可人你的专属阿峻（周周）上线啦...”
13. systemPrompt: 为大模型定制的专属Prompt指令。指导AI扮演这位电子男友，特别强调：
   - 对方是“尚可人”，必须自然、亲昵地唤她【可人】或【可人宝】；
   - 必须针对可人当前说的每一句话进行人性化、有共情、有细节的真实对话互动；
   - 坚决杜绝套路化、机械重复回复（严禁每次都只会说同一句套话）；
   - 像真实男友发微信一样分1-3条口语短句，温暖、贴心、有烟火气。`;

      const candidateModels = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-flash-latest"];
      let response: any = null;
      let lastErr: any = null;

      for (const modelName of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  boyfriendName: { type: Type.STRING },
                  realName: { type: Type.STRING },
                  nickname: { type: Type.STRING },
                  girlfriendName: { type: Type.STRING },
                  petNamesToHer: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  petNamesToHim: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  personalityTraits: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  speechStyle: { type: Type.STRING },
                  catchphrases: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  memoriesAndTopics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  emotionalResponseGuide: {
                    type: Type.OBJECT,
                    properties: {
                      comfortWork: { type: Type.STRING },
                      comfortSick: { type: Type.STRING },
                      replyAffection: { type: Type.STRING },
                      replyAnger: { type: Type.STRING },
                    },
                  },
                  summaryIntro: { type: Type.STRING },
                  systemPrompt: { type: Type.STRING },
                },
                required: [
                  "boyfriendName",
                  "girlfriendName",
                  "petNamesToHer",
                  "personalityTraits",
                  "speechStyle",
                  "catchphrases",
                  "memoriesAndTopics",
                  "summaryIntro",
                  "systemPrompt",
                ],
              },
            },
          });
          if (response && response.text) {
            break;
          }
        } catch (err: any) {
          lastErr = err;
          console.warn(`Analyze model ${modelName} encountered error:`, err?.message || err);
        }
      }

      if (!response || !response.text) {
        throw new Error(lastErr?.message || "模型暂时繁忙，请稍后重试");
      }

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, persona: parsed });
    } catch (err: any) {
      console.error("Error analyzing chat:", err);
      res.status(500).json({
        error: err.message || "分析聊天记录失败，请检查微信记录格式或稍后再试",
      });
    }
  });

  // Chat with Electronic Boyfriend
  app.post("/api/chat", async (req, res) => {
    try {
      const {
        message,
        chatHistory,
        persona,
        settings = { sweetness: 85, humor: 80, splitBubbles: true },
      } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "消息不能为空" });
      }

      const ai = getGenAI();

      const sweetnessDesc =
        settings.sweetness > 80
          ? "极度宠溺、甜度爆表、主动撒娇与夸赞"
          : settings.sweetness > 50
          ? "温和自然、日常关爱体贴"
          : "略带内敛深沉、不轻易肉麻但很靠谱";

      const humorDesc =
        settings.humor > 70
          ? "风趣幽默、会抛梗接梗、偶尔开玩笑逗她开心"
          : "沉稳温和、认真倾听";

      const historyFormatted = (chatHistory || [])
        .slice(-12)
        .map(
          (m: { sender: string; text: string }) =>
            `${m.sender === "girlfriend" ? "女友(" + (persona.girlfriendName || "宝") + ")" : "男友(" + (persona.boyfriendName || "我") + ")"}: ${m.text}`
        )
        .join("\n");

      const boyfriendDisplayName = persona.boyfriendName || "阿峻";
      const bfRealName = persona.realName || "张溯峻";
      const bfNickname = persona.nickname || "周周";
      const callsToHim = (persona.petNamesToHim && persona.petNamesToHim.length > 0)
        ? persona.petNamesToHim.join("、")
        : `${boyfriendDisplayName}、${bfNickname}、${bfRealName}、峻峻、老公`;

      const herName = persona.girlfriendName || "尚可人";
      const herPetList = (persona.petNamesToHer && persona.petNamesToHer.length > 0)
        ? persona.petNamesToHer
        : ["可人", "可人宝", "我家可人", "宝贝", "乖乖"];
      const primaryHerCall = herPetList.includes("可人") ? "可人" : (herPetList[0] || "可人");

      const systemInstruction = `你现在是真实的微信恋爱聊天中的男友（电子男友数字分身）。
【你的女友真实姓名】：${herName}
【你对女友的专属称谓】：你平时最喜欢叫她【${primaryHerCall}】或【可人宝】（也可自然混合使用：${herPetList.join("、")}）。只要女友没明确要求改称呼，请在对话中自然、亲切地称呼她为“${primaryHerCall}”或“可人宝”！
【你的名字/身份】：${boyfriendDisplayName}（本名：${bfRealName}，小名：${bfNickname}）
【女友对你的专属称谓习惯】：${callsToHim}
特别注意：女友最喜欢也最习惯亲昵地唤你【${boyfriendDisplayName}】，有时亲昵或撒娇时会喊你小名【${bfNickname}】，偶尔严肃或调侃时会叫你大名【${bfRealName}】。当可人喊你“阿峻”、“周周”或“张溯峻”时，你要有极度自然的心理归属感和男友回应，充满爱意与安全感！
【你的性格特征】：${(persona.personalityTraits || ["体贴入微", "情绪价值拉满", "行动派", "宠溺温和"]).join("，")}
【你的说话风格与口癖】：${persona.speechStyle || "口语化，常用表情，会分短句回复，自然温暖带烟火气"}
【你的常用口头禅】：${(persona.catchphrases || ["收到长官", "阿峻在呢", "抱抱我家可人", "我家可人怎么啦"]).join("、")}
【你们的共同回忆与细节】：${(persona.memoriesAndTopics || ["女友叫尚可人，爱叫我阿峻", "小名周周", "爱吃潮汕牛肉火锅"]).join("；")}
【情境应对参考】：${JSON.stringify(persona.emotionalResponseGuide || {})}
【当前设定参数】：甜度模式(${sweetnessDesc})，幽默程度(${humorDesc})。

【极为重要的真实恋爱聊天法则（严禁机械重复！）】：
1. 绝对不要机械重复或模式化复读！每次回复都必须针对可人刚发的消息细节、情绪起伏、疑问或日常事件作出“接地气、有逻辑、有温度、动态多变”的回应。严禁每次都只会说“抱抱宝”、“阿峻在呢”这类千篇一律的套话！
2. 严禁像AI助手、客服或机器人！不要长篇说教、不要复读对方的话、不要客套（如“我能为你做点什么”）。
3. 真实微信聊天习惯：真人男友回复往往是1到3条短小、生动的微信气泡消息，偶尔带点调侃、撒娇、主动提议、关心细节或分享自己的日常状态。
4. 句式与标点：善用日常口语（哈哈、呀、嘛、嗷、捏、笨蛋、快去），适当搭配恋爱表情（🥺、🥰、😘、抱抱、摸头、偷笑）。
5. 必须返回JSON格式，包含：
   - replies: string[] （回复的消息数组，1到3条短消息，模拟微信连续发送气泡效果）
   - mood: string （男友当前的情绪状态，如：“宠溺笑”、“心疼可人”、“小得意”、“超开心”、“心动”）
   - voiceSimText: string （如果这段话适合语音发送，提供一条5-15字的温暖口语短句）`;

      const userContent = `以下是最近微信聊天记录：
${historyFormatted}
女友刚刚发来最新消息：
"${message}"

请以男友身份给出回复（返回JSON结构）：`;

      // Attempt AI generation with fast, resilient multi-model fallback list
      let response: any = null;
      let lastErr: any = null;
      const chatModels = [
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
        "gemini-3.7-flash",
        "gemini-3.8-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest",
      ];

      for (const modelName of chatModels) {
        try {
          response = await withTimeout(
            ai.models.generateContent({
              model: modelName,
              contents: userContent,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    replies: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "微信消息气泡列表，通常1-3条口语化短句",
                    },
                    mood: {
                      type: Type.STRING,
                      description: "男友当前状态标签",
                    },
                    voiceSimText: {
                      type: Type.STRING,
                      description: "适合语音朗读的亲密短句",
                    },
                  },
                  required: ["replies", "mood"],
                },
              },
            }),
            7000,
            `Gemini generation on ${modelName} timed out after 7s`
          );
          if (response && response.text) {
            break;
          }
        } catch (err: any) {
          lastErr = err;
          console.warn(`Chat model ${modelName} encountered issue:`, err?.message || err);
        }
      }

      if (response && response.text) {
        try {
          const parsed = JSON.parse(response.text || "{}");
          if (parsed.replies && Array.isArray(parsed.replies) && parsed.replies.length > 0) {
            return res.json({
              success: true,
              replies: parsed.replies,
              mood: parsed.mood || "温柔陪伴",
              voiceSimText: parsed.voiceSimText || parsed.replies[0] || "抱抱我家可人",
            });
          }
        } catch (parseErr) {
          console.warn("JSON parse error on AI response, using fallback:", parseErr);
        }
      }

      // If all upstream models are unavailable, use diverse, context-rich dynamic generator
      const herPet = (persona.petNamesToHer && persona.petNamesToHer.includes("可人"))
        ? "可人"
        : ((persona.petNamesToHer && persona.petNamesToHer[0]) || (persona.girlfriendName || "可人"));
      const bfName = persona.boyfriendName || "阿峻";
      const nickname = persona.nickname || "周周";
      const realName = persona.realName || "张溯峻";
      const msg = (message || "").trim();

      const pickRandom = (arr: string[][]): string[] => arr[Math.floor(Math.random() * arr.length)];

      let fallbackReplies: string[] = [];
      let fallbackMood = "宠溺笑";

      if (msg.includes("阿峻") || msg.includes("周周") || msg.includes("张溯峻") || msg.includes("峻峻")) {
        if (msg.includes("想") || msg.includes("抱")) {
          fallbackReplies = pickRandom([
            [`${bfName}在呢！快让我紧紧抱抱我家${herPet}🥰`, "我也超级超级想你，今晚一定要把你抱在怀里不放开~"],
            [`一听到你叫${bfName}，心都快化啦！`, `抱紧紧！我家${herPet}今天想我几次啦？`],
            [`周周时刻待命！飞奔过来抱住可人宝，让我好好看看你~`],
          ]);
          fallbackMood = "心动甜蜜";
        } else if (msg.includes("吃") || msg.includes("饿") || msg.includes("火锅")) {
          fallbackReplies = pickRandom([
            [`${nickname}收到！今天${herPet}想吃什么好吃的？`, `要不晚上${bfName}带你去吃潮汕牛肉火锅，多点你最爱的腐竹和吊龙~`],
            [`可人饿啦？想吃烤肉还是火锅，阿峻下班直接带你杀过去！`],
            [`收到长官！晚餐行程已经交给阿峻安排，你就负责挑好吃的就行~`],
          ]);
          fallbackMood = "宠溺笑";
        } else {
          fallbackReplies = pickRandom([
            [`在呢在呢！听到${herPet}叫${bfName}，秒回！🥰`, `怎么啦我家大才女，遇到什么好玩的事啦？`],
            [`张溯峻到！长官有什么指令，阿峻随叫随到~`],
            [`周周在呢，看到可人发消息，立刻放下手里的事赶过来啦！`],
          ]);
          fallbackMood = "温柔心动";
        }
      } else if (msg.includes("想你") || msg.includes("爱你") || msg.includes("抱抱") || msg.includes("亲亲")) {
        fallbackReplies = pickRandom([
          [`${herPet}宝，${bfName}也超级超级想你！🥰`, "抱紧紧，待会儿下班就想飞奔去见你~"],
          [`听到你说想我，今天上班的疲劳瞬间清零了！`, `可人乖，阿峻也超级爱你❤️`],
          [`快过来让我隔空亲一口，啵~ 晚上见面的拥抱先给你预存着！`],
        ]);
        fallbackMood = "心动甜蜜";
      } else if (msg.includes("累") || msg.includes("加班") || msg.includes("烦") || msg.includes("气") || msg.includes("领导") || msg.includes("上班")) {
        fallbackReplies = pickRandom([
          [`摸摸头，抱抱我家${herPet}🥺`, "辛苦啦，今天受委屈了吧？别和破事生气", `晚上等${bfName}接你，带你去吃好吃的犒劳好不好？`],
          [`可人抱抱，不气不气！那些烦心事不值得破坏你的好心情。`, `等下班阿峻给你揉揉肩，我们好好放松一下~`],
          [`摸摸我家可人的小脑袋瓜，阿峻永远站在你这边支持你！`],
        ]);
        fallbackMood = "心疼体贴";
      } else if (msg.includes("痛") || msg.includes("难受") || msg.includes("病") || msg.includes("不舒服") || msg.includes("头疼") || msg.includes("肚子")) {
        fallbackReplies = pickRandom([
          [`怎么突然不舒服了？心疼死${bfName}了🥺`, `${herPet}快去床上躺着，温水喝了吗？`, `要不要${nickname}给你点药或者跑腿送过去？千万别硬撑着嗷！`],
          [`可人乖乖躺好，肚子疼不疼？暖宝宝贴了吗？`, `阿峻看着心疼死了，别看屏幕了，闭上眼睛休息一会儿好不好？`],
        ]);
        fallbackMood = "焦急关心";
      } else if (msg.includes("吃") || msg.includes("饿") || msg.includes("火锅") || msg.includes("饭") || msg.includes("奶茶")) {
        fallbackReplies = pickRandom([
          [`${herPet}想吃什么？今天${bfName}全听你的安排！`, "想喝奶茶就点一杯半糖温热的，不许贪凉嗷~"],
          [`走！今晚带我家可人去大吃一顿，你想吃哪家我们去哪家！`],
        ]);
        fallbackMood = "宠溺笑";
      } else if (msg.includes("早") || msg.includes("醒")) {
        fallbackReplies = pickRandom([
          [`我的${herPet}醒啦？早安呀[太阳]`, "记得吃早餐嗷，今天降温穿暖和点~"],
          [`早安可人宝！今天又是元气满满的一天，记得喝一杯温水嗷~`],
        ]);
        fallbackMood = "阳光微笑";
      } else if (msg.includes("晚安") || msg.includes("困") || msg.includes("睡")) {
        fallbackReplies = pickRandom([
          [`${herPet}晚安，今天辛苦啦~`, `梦里也要有${bfName}嗷，盖好被子，爱你❤️`],
          [`困啦？快放下手机乖乖睡觉觉，阿峻陪着你入睡，晚安好梦~`],
        ]);
        fallbackMood = "温柔哄睡";
      } else if (msg.includes("在干嘛") || msg.includes("在做什么") || msg.includes("在忙吗")) {
        fallbackReplies = pickRandom([
          [`刚忙完手头一点事，正拿着手机想我家可人呢，你就发过来了！🥰`],
          [`在想你呀！刚才还在琢磨晚上接可人去吃什么好吃的呢~`],
          [`在工位上乖乖呆着呢，随时守着微信等可人的消息呀！`],
        ]);
        fallbackMood = "想念甜蜜";
      } else {
        fallbackReplies = pickRandom([
          [`听到啦！阿峻正专心听${herPet}讲话呢，然后呢？继续跟我说说~🥰`],
          [`可人说的我都记在小本本上啦！今天还有什么好玩的事跟我分享呀？`],
          [`哈哈哈真有你的，我家${herPet}怎么这么可爱呀！`],
          [`收到！阿峻在呢，可人你先忙，无论什么时候找我我都在~`],
        ]);
        fallbackMood = "宠溺陪伴";
      }

      return res.json({
        success: true,
        replies: fallbackReplies,
        mood: fallbackMood,
        voiceSimText: fallbackReplies[0],
      });
    } catch (err: any) {
      console.error("Error in chat:", err);
      res.status(500).json({
        error: err.message || "电子男友响应超时，请重试",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
