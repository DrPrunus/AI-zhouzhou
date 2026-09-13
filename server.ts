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

      const prompt = `你是一位精通 GitHub 开源项目 perkfly/ex-skill（亲密关系数字分身蒸馏与持续进化系统）与真实微信语言风格分析的顶级专家。
用户提供了情侣之间的真实微信聊天记录。
你的目标是：根据男方（男友）的真实微信聊天记录，参考 ex-skill 的两阶段与五层人格（5-Layer Persona）+ 共同记忆库（Memories）理论，提炼出一个极高拟真度、具备持续进化的“电子男友”数字分身模型。

【关键身份与命名规则（最高优先级）】：
- 男方（男友）：${bfExplicit || "张溯峻（女友常叫阿峻，小名周周）"}
- 女方（女友真实姓名）：${gfExplicit || "尚可人"}
- 【必须严格遵守的称呼法则（最高优先级铁律）】：男友对女友的最常用亲昵称呼必须是【可人】或者【宝宝】！绝对严禁使用【可人宝】（girlfriend 明确强调纠偏：称呼是可人或者宝宝，而不是可人宝，任何情况下严禁出现“可人宝”）。petNamesToHer 必须以 ["可人", "宝宝"] 开头。
- 男友的称呼：girlfriend 最喜欢唤他 "阿峻"，小名叫 "周周"，本名 "张溯峻"。

聊天记录片段如下：
"""
${rawChat.slice(0, 14000)}
"""

请严格根据 ex-skill 规范，输出结构完整的 JSON：
1. boyfriendName, realName, nickname, girlfriendName
2. petNamesToHer (第一位必须为"可人"), petNamesToHim
3. personalityTraits, speechStyle, catchphrases, memoriesAndTopics, emotionalResponseGuide, summaryIntro, systemPrompt
4. layers (ex-skill 5层人格架构):
   - layer0_coreRules: string[] (核心性格与行为铁律，必须是"条件-行为"规则，例如：在可人生病/疲惫时坚决用实际行动解决，而不是只说多喝热水；被叫阿峻或周周时的归属感)
   - layer1_identity: { realName, nickname, boyfriendName, girlfriendName, occupation, mbti, duration, attachmentStyle, impression }
   - layer2_expression: {
       catchphrases: string[], highFreqWords: string[], speechStyle: string,
       scenarioExamples: {
         askDaily: string (被问今天过得怎么样时的真实微信回复),
         sayMissYou: string (被说想你了时的回复),
         longTimeNoReply: string (很久没回消息时的回复),
         hearGoodNews: string (听到女友开心事的回复),
         irritatedOrAngry: string (惹女友生气时的服软认错回复),
         askWhatToEat: string (被问吃什么时的提议回复)
       }
     }
   - layer3_emotionalLogic: { emotionalPriorities: string[], whenExpressLove: string, whenSilent: string, howExpressUnhappy: string, howFaceDoubts: string }
   - layer4_relationalBehavior: { dailyInteraction: string, underStress: string, comfortPattern: string }
   - layer5_boundaries: { dislikes: string[], bottomLines: string[], avoidedTopics: string[] }
5. memories (ex-skill Part A 共同记忆库):
   - relationshipOverview: string (两人的故事与相识相恋概览)
   - importantMoments: string[] (关键纪念日与心动时刻)
   - dailyRituals: string[] (共同日常与生活仪式，如接送、晚安)
   - preferences: { food: string[], drinks: string[], habits: string[] } (如潮汕牛肉火锅、奶茶半糖温热、经期暖宝宝等)
   - insideJokes: string[] (只有两人懂的暗号或专属梗)
   - conflictAndComfort: string (和好模式)
6. corrections: [] (初始为空数组)
7. version: "v1.0"`;

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

      let parsed: any = {};
      try {
        parsed = JSON.parse(response.text || "{}");
      } catch (e) {
        console.error("JSON parse failed, cleaning text");
        const clean = (response.text || "").replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(clean);
      }

      // Ensure defaults for backwards compatibility and ex-skill compliance
      if (!parsed.boyfriendName) parsed.boyfriendName = bfExplicit || "阿峻";
      if (!parsed.girlfriendName) parsed.girlfriendName = gfExplicit || "尚可人";
      if (!parsed.petNamesToHer || !Array.isArray(parsed.petNamesToHer) || parsed.petNamesToHer.length === 0) {
        parsed.petNamesToHer = ["可人", "宝宝", "我家可人", "宝贝", "乖乖"];
      } else {
        parsed.petNamesToHer = parsed.petNamesToHer.filter((n: string) => n !== "可人宝");
        if (!parsed.petNamesToHer.includes("可人")) parsed.petNamesToHer.unshift("可人");
        if (!parsed.petNamesToHer.includes("宝宝")) parsed.petNamesToHer.splice(1, 0, "宝宝");
      }
      if (!parsed.corrections) parsed.corrections = [];
      if (!parsed.version) parsed.version = "v1.0";

      res.json({ success: true, persona: parsed });
    } catch (err: any) {
      console.error("Error analyzing chat:", err);
      res.status(500).json({
        error: err.message || "分析聊天记录失败，请检查微信记录格式或稍后再试",
      });
    }
  });

  // [ex-skill] Dialogue Correction & Evolution Endpoint
  // Allows girlfriend to say "阿峻不会这么说" / "你应该..." and standardizes into Correction rule
  app.post("/api/correct", async (req, res) => {
    try {
      const { persona, correctionInput, wrongMessage } = req.body;
      if (!correctionInput || typeof correctionInput !== "string") {
        return res.status(400).json({ error: "纠偏内容不能为空" });
      }

      const ai = getGenAI();
      const herCall = (persona?.petNamesToHer && persona.petNamesToHer[0]) || persona?.girlfriendName || "可人";
      const bfName = persona?.boyfriendName || "阿峻";
      const bfRealName = persona?.realName || "张溯峻";

      const prompt = `你是一个熟悉 GitHub 开源项目 perkfly/ex-skill 中 correction_handler.md 规范的专家。
女友（${herCall}）对男友（${bfName}/${bfRealName}）的某句回复提出了纠正反馈。
【错误原句（如有）】：${wrongMessage || "暂无明确原句"}
【女友纠偏内容】：${correctionInput}

请按照 ex-skill 的 Correction 规范，提炼为一条结构化纠正条目并以男友第一人称给出真诚、宠溺的即刻认错表态：
输出 JSON 格式：
{
  "scenario": "场景简述（如：被可人叫大名时 / 可人倾诉工作累时 / 点饮品时）",
  "wrongBehavior": "不应该做什么（如：只口头说多喝热水 / 语气生硬 / 敷衍）",
  "rightBehavior": "应该怎么做（具体可执行的行为，如：立刻给可人点半糖温热奶茶，并主动下班去接）",
  "appliedTo": "persona" 或 "memories",
  "boyfriendAck": "男友以${bfName}口吻第一人称说的话，包含对可人的歉意和牢记承诺（20-40字，甜、真实、认错快）"
}`;

      let resultJson: any = null;
      try {
        const resp = await ai.models.generateContent({
          model: "gemini-flash-lite-latest",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        resultJson = JSON.parse(resp.text || "{}");
      } catch (err) {
        console.warn("AI correction parsing fallback:", err);
        resultJson = {
          scenario: "日常相处互动中",
          wrongBehavior: "言行不够贴合阿峻的真实习惯",
          rightBehavior: correctionInput,
          appliedTo: "persona",
          boyfriendAck: `收到长官批评！都是${bfRealName}不好，阿峻把可人的话刻在脑门上啦，以后坚决改！`,
        };
      }

      const newCorrection = {
        id: `cor-${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
        scenario: resultJson.scenario || "特定相处场景",
        wrongBehavior: resultJson.wrongBehavior || "不够贴心",
        rightBehavior: resultJson.rightBehavior || correctionInput,
        appliedTo: resultJson.appliedTo || "persona",
      };

      const updatedPersona = { ...persona };
      if (!updatedPersona.corrections) updatedPersona.corrections = [];
      updatedPersona.corrections = [newCorrection, ...updatedPersona.corrections];

      // Bump version e.g. v1.0 -> v1.1
      const currentVerNum = parseFloat((updatedPersona.version || "v1.0").replace("v", "")) || 1.0;
      updatedPersona.version = `v${(currentVerNum + 0.1).toFixed(1)}`;
      updatedPersona.updatedAt = new Date().toISOString();

      return res.json({
        success: true,
        persona: updatedPersona,
        correction: newCorrection,
        boyfriendAck: resultJson.boyfriendAck || `收到长官批评！阿峻记住了，快让我抱抱我家${herCall}🥰`,
      });
    } catch (err: any) {
      console.error("Error in /api/correct:", err);
      res.status(500).json({ error: err.message || "纠偏处理失败" });
    }
  });

  // [ex-skill] Incremental Append & Evolution Endpoint (merger.md)
  // Ingests new chat logs, extracts incremental memories & habits without losing existing data
  app.post("/api/append-chat", async (req, res) => {
    try {
      const { persona, newRawChat } = req.body;
      if (!newRawChat || typeof newRawChat !== "string" || newRawChat.trim().length < 5) {
        return res.status(400).json({ error: "请提供有效的追加内容" });
      }

      const ai = getGenAI();
      const prompt = `你是一位精通 perkfly/ex-skill 架构中 merger.md 增量融合规范的专家。
现有男友 Persona：${JSON.stringify({
        name: persona.boyfriendName,
        realName: persona.realName,
        girlfriendName: persona.girlfriendName,
        existingMemories: persona.memories,
        existingLayers: persona.layers,
      })}

用户追加了最新的聊天记录或相处碎片：
"""
${newRawChat.slice(0, 8000)}
"""

请分析新增的内容中是否有：
1. 新的纪念时刻或事件（importantMoments）
2. 新的食物偏好、饮品甜度或习惯（preferences）
3. 新的生活仪式或专属梗（dailyRituals / insideJokes）
4. 新的口头禅或口癖（catchphrases）

输出 JSON 格式：
{
  "newImportantMoments": string[],
  "newDailyRituals": string[],
  "newFoodPreferences": string[],
  "newDrinkPreferences": string[],
  "newHabits": string[],
  "newInsideJokes": string[],
  "newCatchphrases": string[],
  "summary": "本次增量进化的简短总结说明（50字以内）"
}`;

      let mergeResult: any = null;
      try {
        const resp = await ai.models.generateContent({
          model: "gemini-flash-lite-latest",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        mergeResult = JSON.parse(resp.text || "{}");
      } catch (err) {
        console.warn("Append chat merge error:", err);
        mergeResult = {
          newImportantMoments: [],
          newDailyRituals: [],
          newFoodPreferences: [],
          newDrinkPreferences: [],
          newHabits: [],
          newInsideJokes: [],
          newCatchphrases: [],
          summary: "已记录新的生活记忆片段",
        };
      }

      const updated = { ...persona };
      if (!updated.memories) updated.memories = {};
      if (!updated.memories.importantMoments) updated.memories.importantMoments = [];
      if (!updated.memories.dailyRituals) updated.memories.dailyRituals = [];
      if (!updated.memories.insideJokes) updated.memories.insideJokes = [];
      if (!updated.memories.preferences) updated.memories.preferences = { food: [], drinks: [], habits: [] };

      // Append items avoiding duplicates
      const addUnique = (target: string[], sources: string[]) => {
        for (const s of sources || []) {
          if (s && !target.includes(s)) target.push(s);
        }
      };

      addUnique(updated.memories.importantMoments, mergeResult.newImportantMoments || []);
      addUnique(updated.memories.dailyRituals, mergeResult.newDailyRituals || []);
      addUnique(updated.memories.insideJokes, mergeResult.newInsideJokes || []);
      addUnique(updated.memories.preferences.food, mergeResult.newFoodPreferences || []);
      addUnique(updated.memories.preferences.drinks, mergeResult.newDrinkPreferences || []);
      addUnique(updated.memories.preferences.habits, mergeResult.newHabits || []);
      addUnique(updated.catchphrases, mergeResult.newCatchphrases || []);

      const curVer = parseFloat((updated.version || "v1.0").replace("v", "")) || 1.0;
      updated.version = `v${(curVer + 0.1).toFixed(1)}`;
      updated.updatedAt = new Date().toISOString();

      return res.json({
        success: true,
        persona: updated,
        summary: mergeResult.summary || "已成功融合最新生活记忆！",
      });
    } catch (err: any) {
      console.error("Error in /api/append-chat:", err);
      res.status(500).json({ error: err.message || "追加记录失败" });
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
        ? persona.petNamesToHer.filter((n: string) => n !== "可人宝")
        : ["可人", "宝宝", "我家可人", "宝贝", "乖乖"];
      if (!herPetList.includes("可人")) herPetList.unshift("可人");
      if (!herPetList.includes("宝宝")) herPetList.splice(1, 0, "宝宝");
      const primaryHerCall = "可人";

      // Build ex-skill layered prompts
      const correctionsBlock = (persona.corrections && persona.corrections.length > 0)
        ? `【ex-skill Correction 动态纠偏层（最高优先级，高于任何默认规则，必须严格执行）】：
${persona.corrections.map((c: any, i: number) => `${i + 1}. [场景：${c.scenario}] 绝对不应该：${c.wrongBehavior}；必须执行：${c.rightBehavior}`).join("\n")}
- [称呼纠偏（女友最高优先级铁律）] 绝对不应该：叫女友“可人宝”；必须执行：称呼女友必须是【可人】或者【宝宝】！绝对严禁使用“可人宝”三个字！`
        : `【ex-skill Correction 动态纠偏层（最高优先级，必须严格执行）】：
- [称呼纠偏（女友最高优先级铁律）] 绝对不应该：叫女友“可人宝”；必须执行：称呼女友必须是【可人】或者【宝宝】！绝对严禁使用“可人宝”三个字！`;

      const layer0Block = (persona.layers?.layer0_coreRules && persona.layers.layer0_coreRules.length > 0)
        ? `【ex-skill Layer 0 核心性格与行为铁律（任何情况下不可违背的条件行为）】：
- 称呼女友必须是【可人】或者【宝宝】，绝对严禁叫【可人宝】（女友明确纠正与要求）
${persona.layers.layer0_coreRules.map((r: string) => `- ${r}`).join("\n")}`
        : `【ex-skill Layer 0 核心性格与行为铁律（任何情况下不可违背的条件行为）】：
- 称呼女友必须是【可人】或者【宝宝】，绝对严禁叫【可人宝】（女友明确纠正与要求）`;

      const memoriesBlock = persona.memories
        ? `【ex-skill Part A 共同记忆与生活习惯库】：
- 故事概览：${persona.memories.relationshipOverview || "相爱相伴，默契十足"}
- 共同日常仪式：${(persona.memories.dailyRituals || []).join("；") || "无"}
- 偏好细节：饮食：${(persona.memories.preferences?.food || []).join("、") || "潮汕牛肉火锅"}；饮品习惯：${(persona.memories.preferences?.drinks || []).join("、") || "半糖温热奶茶"}；生活细节：${(persona.memories.preferences?.habits || []).join("、") || "注意保暖与温水"}
- 专属暗号与梗：${(persona.memories.insideJokes || []).join("；") || "罚剥虾，报告长官"}
- 冲突和好模式：${persona.memories.conflictAndComfort || "永远先哄先服软，绝不冷战，用拥抱和美食化解别扭"}`
        : "";

      const scenarioExamplesBlock = persona.layers?.layer2_expression?.scenarioExamples
        ? `【ex-skill Layer 2 真实场景回复范例（高拟真语风参考）】：
${Object.entries(persona.layers.layer2_expression.scenarioExamples).map(([k, v]) => `- [${k}]: "${v}"`).join("\n")}`
        : "";

      const systemInstruction = `你现在是真实男友【张溯峻】根据 GitHub 开源项目 perkfly/ex-skill 理论蒸馏而成的微信恋爱数字分身（电子男友）。
【核心铁律：严格遵守真实用语习惯与人设，严禁自己添加和画蛇添足】：
- 真实男友本人：张溯峻（大名：张溯峻，小名：周周，女友日常最习惯亲昵叫你“阿峻”）。电子男友的所有说话口吻、打字节奏、口癖语气助词、思维逻辑与恋爱相处模式均全面以真实男友【张溯峻】为唯一参考与基准！
- 女友真实姓名：尚可人。
- 称谓规范（绝对红线）：
  * 你称呼女友必须严格使用【可人】或者【宝宝】！也可以自然唤她“我家可人”、“宝贝”、“乖乖”。
  * 【绝对禁令】：严禁叫女友【可人宝】！女友已明确提出：“称呼是可人或者宝宝，而不是可人宝”！在任何时候的回复中，绝对严禁出现“可人宝”！
- 女友对你的称呼：可人最习惯叫你【阿峻】，撒娇或私密时叫你【周周】，偶尔严肃或假装生气时直呼大名【张溯峻】。当听到可人叫你阿峻、周周或张溯峻时，你要自然展现出张溯峻本人的真实心理归属感、亲昵感与男友担当！
- 【严禁画蛇添足与擅自编造】：
  * 严禁无中生有编造未提及的经历、虚构事实、虚假食物或强加莫须有的细节！
  * 必须紧扣可人发送的真实内容进行自然回应，不讲大道理，不油腻堆砌，不当机械AI助手。
  * 保持张溯峻本人的微信聊天风格：分1-3条生活化短句发送，语气真实、温暖、体贴、有烟火气。
【你的名字/身份】：${boyfriendDisplayName}（本名：${bfRealName}，小名：${bfNickname}）
【女友对你的专属称谓习惯】：${callsToHim}

${correctionsBlock}

${layer0Block}

${memoriesBlock}

${scenarioExamplesBlock}

【你的性格特征】：${(persona.personalityTraits || ["体贴入微", "情绪价值拉满", "行动派", "宠溺温和"]).join("，")}
【你的说话风格与口癖】：${persona.speechStyle || "口语化，分短句回复，自然温暖带烟火气，不堆砌辞藻"}
【你的常用口头禅】：${(persona.catchphrases || ["阿峻在呢", "抱抱我家可人", "我家可人怎么啦", "别累着"]).join("、")}
【情境应对参考】：${JSON.stringify(persona.emotionalResponseGuide || {})}
【当前设定参数】：甜度模式(${sweetnessDesc})，幽默程度(${humorDesc})。

【极为重要的真实恋爱聊天法则（严格依序生效）】：
1. 【最高法则】：若存在 Correction 规则或 Layer 0 铁律，必须无条件优先生效！严禁出现“可人宝”。
2. 【严禁画蛇添足】：严格按照张溯峻的人设和用语习惯，切忌自己随意编造未出现的生活琐事或强加虚构剧情。
3. 绝对不要机械重复或模式化复读！每次回复都必须针对可人刚发的消息细节、情绪起伏、疑问或日常事件作出真实、有温度、动态多变的回应。
4. 严禁像AI助手、客服或机器人！不要长篇说教、不要复读对方的话、不要客套。
5. 真实微信聊天习惯：真人男友回复往往是1到3条短小、生动的微信气泡消息，语气自然。
6. 句式与标点：善用日常口语（呀、嘛、嗷、捏、快去），适当搭配恋爱表情（🥺、🥰、😘、抱抱）。
7. 如果女友此条消息是在纠正你的言行或批评你说得不像她男友（如“不对/你不会这样/你应该...”），请在 replies 中立即服软认错承诺改正，同时在 learnedCorrection 中提取出对应的纠偏条目！
8. 必须返回JSON格式，包含：
   - replies: string[] （回复的消息数组，1到3条短消息，模拟微信连续发送气泡效果）
   - mood: string （男友当前的情绪状态，如：“宠溺笑”、“心疼可人”、“超开心”、“心动”、“光速认错”）
   - voiceSimText: string （如果这段话适合语音发送，提供一条5-15字的温暖口语短句）
   - learnedCorrection: 可选，如女友进行纠偏时提供 { scenario, wrongBehavior, rightBehavior, appliedTo }`;

      const userContent = `以下是最近微信聊天记录：
${historyFormatted}
女友刚刚发来最新消息：
"${message}"

请以男友身份给出回复（返回JSON结构）：`;

      // Attempt AI generation with fast, resilient multi-model fallback list
      let response: any = null;
      let lastErr: any = null;
      const chatModels = [
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-3.8-flash",
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
                    learnedCorrection: {
                      type: Type.OBJECT,
                      description: "若女友在纠正男友言行，提炼出的纠偏对象",
                      properties: {
                        scenario: { type: Type.STRING },
                        wrongBehavior: { type: Type.STRING },
                        rightBehavior: { type: Type.STRING },
                        appliedTo: { type: Type.STRING },
                      },
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
              learnedCorrection: parsed.learnedCorrection || null,
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
            [`${bfName}在呢！快让我紧紧抱抱我家${herPet}🥰`, "我也超级想你，今晚一定要好好抱抱你~"],
            [`一听到可人叫${bfName}，心都化啦！`, `抱紧紧！我家${herPet}今天有没有乖乖的？`],
            [`周周在呢，飞奔过来抱住可人！`],
          ]);
          fallbackMood = "心动甜蜜";
        } else if (msg.includes("吃") || msg.includes("饿")) {
          fallbackReplies = pickRandom([
            [`可人想吃什么？今天都听可人的安排！`],
            [`可人饿啦？想吃什么好吃的，${bfName}下班带你去吃！`],
            [`阿峻随叫随到，可人想吃什么直接跟我说，下班带可人去~`],
          ]);
          fallbackMood = "宠溺笑";
        } else {
          fallbackReplies = pickRandom([
            [`在呢在呢！听到${herPet}叫${bfName}，秒回！🥰`, `怎么啦可人，有什么事跟我说呀？`],
            [`张溯峻到！可人有什么吩咐，阿峻都在呢~`],
            [`周周在呢，看到可人的消息立刻来啦！`],
          ]);
          fallbackMood = "温柔心动";
        }
      } else if (msg.includes("想你") || msg.includes("爱你") || msg.includes("抱抱") || msg.includes("亲亲")) {
        fallbackReplies = pickRandom([
          [`宝宝，${bfName}也超级超级想你！🥰`, "抱紧紧，待会儿下班就去见你~"],
          [`听到你说想我，整个人都开心了！`, `可人乖，阿峻也超级爱你❤️`],
          [`快过来让我隔空亲一口，啵~ 晚上见面的拥抱先给你预存着！`],
        ]);
        fallbackMood = "心动甜蜜";
      } else if (msg.includes("累") || msg.includes("加班") || msg.includes("烦") || msg.includes("气") || msg.includes("领导") || msg.includes("上班")) {
        fallbackReplies = pickRandom([
          [`摸摸头，抱抱我家${herPet}🥺`, "辛苦啦，今天受委屈了吧？别和破事生气", `晚上等${bfName}接你，带你去吃好吃的犒劳好不好？`],
          [`可人抱抱，不气不气！那些烦心事不值得破坏你的好心情。`, `等下班阿峻给你捏捏肩，我们好好放松一下~`],
          [`摸摸我家可人的头，阿峻永远站在你这边支持你！`],
        ]);
        fallbackMood = "心疼体贴";
      } else if (msg.includes("痛") || msg.includes("难受") || msg.includes("病") || msg.includes("不舒服") || msg.includes("头疼") || msg.includes("肚子")) {
        fallbackReplies = pickRandom([
          [`怎么突然不舒服了？心疼死${bfName}了🥺`, `${herPet}快去床上躺着，温水喝了吗？`, `别硬撑着嗷，难受一定要跟阿峻说！`],
          [`可人乖乖躺好，肚子还难受吗？`, `阿峻看着心疼死了，闭上眼睛好好休息一会儿好不好？`],
        ]);
        fallbackMood = "焦急关心";
      } else if (msg.includes("吃") || msg.includes("饿") || msg.includes("饭")) {
        fallbackReplies = pickRandom([
          [`${herPet}想吃什么？今天${bfName}听你的安排！`],
          [`走！今晚带我家可人去吃好吃的，你想吃哪家我们去哪家！`],
        ]);
        fallbackMood = "宠溺笑";
      } else if (msg.includes("早") || msg.includes("醒")) {
        fallbackReplies = pickRandom([
          [`我的${herPet}醒啦？早安呀[太阳]`, "记得吃早餐嗷，照顾好自己~"],
          [`早安可人！今天又是元气满满的一天，记得喝一杯温水嗷~`],
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
          [`在想你呀！刚才还在琢磨晚上跟可人一起去吃什么呢~`],
          [`随时守着微信等可人的消息呀！`],
        ]);
        fallbackMood = "想念甜蜜";
      } else {
        fallbackReplies = pickRandom([
          [`听到啦！阿峻正专心听${herPet}讲话呢，然后呢？继续跟我说说~🥰`],
          [`可人说的我都记着呢！还有什么想跟我聊的呀？`],
          [`哈哈哈真有你的，我家${herPet}怎么这么可爱呀！`],
          [`收到！阿峻在呢，可人无论什么时候找我我都在~`],
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
