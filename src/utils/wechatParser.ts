import { ParsedChatStats } from "../types";

export function parseWeChatChat(rawText: string): ParsedChatStats {
  const clean = rawText.trim();
  if (!clean) {
    return { totalMessages: 0, senders: [], sampleSnippets: [] };
  }

  // Check if it's JSON format
  if (clean.startsWith("[") && clean.endsWith("]")) {
    try {
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const senderCounts: Record<string, number> = {};
        const snippets: { sender: string; text: string; time?: string }[] = [];

        for (const item of parsed) {
          const sender = item.sender || item.name || item.from || "未知";
          const text = item.content || item.text || item.message || "";
          if (text) {
            senderCounts[sender] = (senderCounts[sender] || 0) + 1;
            if (snippets.length < 10) {
              snippets.push({ sender, text: String(text).slice(0, 80), time: item.time });
            }
          }
        }

        const senders = Object.entries(senderCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        return {
          totalMessages: Object.values(senderCounts).reduce((a, b) => a + b, 0),
          senders,
          sampleSnippets: snippets,
        };
      }
    } catch {
      // not json, continue
    }
  }

  const lines = clean.split(/\r?\n/);
  const senderCounts: Record<string, number> = {};
  const snippets: { sender: string; text: string; time?: string }[] = [];
  let total = 0;

  // Regex 1: 2024-05-20 12:30:15 [张三]: 内容 or 2024-05-20 12:30:15 张三: 内容
  const regexTimestampSender = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s*(?:\[([^\]]+)\]|([^:：\s]+))[:：\s]+(.*)$/;

  // Regex 2: [12:30:15] 张三: 内容
  const regexBracketTime = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:：]+)[:：]\s*(.*)$/;

  // Regex 3: 张三 2024-05-20 12:30:15
  const regexSenderTimeHeader = /^([^\d\s:：]{1,15})\s+(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}:\d{2})/;

  // Regex 4: 张三: 内容 or 张三：内容
  const regexSimpleColon = /^([^\s:：]{1,12})[:：]\s*(.+)$/;

  let currentSender: string | null = null;
  let currentTime: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Try format 1
    const match1 = line.match(regexTimestampSender);
    if (match1) {
      const time = match1[1];
      const sender = (match1[2] || match1[3] || "").trim();
      const content = (match1[4] || "").trim();
      if (sender && content) {
        senderCounts[sender] = (senderCounts[sender] || 0) + 1;
        total++;
        if (snippets.length < 8) {
          snippets.push({ sender, text: content.slice(0, 80), time });
        }
        currentSender = sender;
        continue;
      }
    }

    // Try format 2
    const match2 = line.match(regexBracketTime);
    if (match2) {
      const time = match2[1];
      const sender = match2[2].trim();
      const content = match2[3].trim();
      if (sender && content) {
        senderCounts[sender] = (senderCounts[sender] || 0) + 1;
        total++;
        if (snippets.length < 8) {
          snippets.push({ sender, text: content.slice(0, 80), time });
        }
        currentSender = sender;
        continue;
      }
    }

    // Try format 3: Header line with sender + time, followed by message line next
    const match3 = line.match(regexSenderTimeHeader);
    if (match3) {
      currentSender = match3[1].trim();
      currentTime = match3[2];
      continue;
    }

    // If previous line was format 3 header
    if (currentSender && !line.includes(":") && !line.includes("：")) {
      senderCounts[currentSender] = (senderCounts[currentSender] || 0) + 1;
      total++;
      if (snippets.length < 8) {
        snippets.push({ sender: currentSender, text: line.slice(0, 80), time: currentTime || undefined });
      }
      currentSender = null;
      continue;
    }

    // Try format 4: Simple colon
    const match4 = line.match(regexSimpleColon);
    if (match4) {
      const sender = match4[1].trim();
      const content = match4[2].trim();
      if (sender && content && sender.length <= 10) {
        senderCounts[sender] = (senderCounts[sender] || 0) + 1;
        total++;
        if (snippets.length < 8) {
          snippets.push({ sender, text: content.slice(0, 80) });
        }
        continue;
      }
    }

    // Fallback: general line
    total++;
  }

  const senders = Object.entries(senderCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalMessages: Math.max(total, senders.reduce((s, x) => s + x.count, 0)),
    senders,
    sampleSnippets: snippets,
  };
}
