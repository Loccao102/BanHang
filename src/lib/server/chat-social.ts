/**
 * Social turns are not product searches. Keep this matcher conservative:
 * an actual request ("chào shop, tìm áo đỏ") must stay in the commerce flow.
 */
export function socialChatReply(message: string, hasImage = false): string | null {
  if (hasImage) return null;
  const text = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const greeting = /^(?:(?:xin )?chao|hi|hello|hey|helo|he lo|alo|yo|e shop|shop oi|co ai o day khong)(?: (?:nguoi anh em|anh em|shop|ban|lsoul|cau|anh|chi|em|cac ban|nha|nhe|na|ne|oi|a|ha|do|day|khong))*$/;
  if (greeting.test(text) || /^chao buoi (?:sang|chieu|toi)(?: nha| nhe| shop| ban)?$/.test(text)) {
    return /nguoi anh em|anh em/.test(text)
      ? "Chào người anh em 😄 Hôm nay có gì vui kể mình nghe với?"
      : "Chào bạn 😄 Mình đây! Hôm nay bạn thế nào?";
  }

  if (/^(?:cam on|thanks|thank you|thank u)(?: ban| shop| nhe| nha| nhieu| rat nhieu)*$/.test(text)) {
    return "Không có gì đâu nè 😄 Rất vui được trò chuyện cùng bạn!";
  }
  if (/^(?:tam biet|bye|goodbye|hen gap lai|bai bai)(?: nha| nhe| ban| shop)*$/.test(text)) {
    return "Tạm biệt nha, hẹn gặp lại bạn! 👋";
  }

  return null;
}
