import type {
  ReverseSuggestion,
  TranslationAnalysis,
  TranslationResult,
} from "../../types/translation";
import { TOEIC_CORE_ENTRIES } from "../../data/toeicCoreEntries";

interface PhraseSeed {
  vi: string;
  alt?: string[];
  explanation?: string;
}

const PHRASES: Record<string, PhraseSeed> = {
  "for many of them": { vi: "với nhiều người trong số họ", alt: ["đối với nhiều người trong số họ"], explanation: "for = với/đối với; many of = nhiều ... trong số; them = họ/chúng" },
  "many of them": { vi: "nhiều người trong số họ", alt: ["nhiều trong số họ"] },
  "many of": { vi: "nhiều ... trong số" },
  "some of": { vi: "một số ... trong số" },
  "most of": { vi: "phần lớn; hầu hết ... trong số" },
  "one of": { vi: "một trong số" },
  "all of": { vi: "tất cả ... trong số" },
  "a number of": { vi: "một số; nhiều" },
  "a large number of": { vi: "một số lượng lớn" },
  "in order to": { vi: "để; nhằm" },
  "so that": { vi: "để; nhằm để" },
  "due to": { vi: "do; bởi vì" },
  "because of": { vi: "bởi vì; do" },
  "as a result": { vi: "do đó; kết quả là" },
  "as a result of": { vi: "do; là kết quả của" },
  "according to": { vi: "theo; theo như" },
  "in addition": { vi: "ngoài ra; thêm vào đó" },
  "in addition to": { vi: "ngoài; bên cạnh" },
  "in contrast": { vi: "trái lại; ngược lại" },
  "on the other hand": { vi: "mặt khác" },
  "for example": { vi: "ví dụ" },
  "for instance": { vi: "chẳng hạn; ví dụ" },
  "in general": { vi: "nhìn chung; nói chung" },
  "in particular": { vi: "đặc biệt; cụ thể là" },
  "at least": { vi: "ít nhất" },
  "at most": { vi: "nhiều nhất; tối đa" },
  "at the moment": { vi: "hiện tại; lúc này" },
  "at this time": { vi: "vào lúc này; hiện nay" },
  "as soon as possible": { vi: "càng sớm càng tốt" },
  "as soon as": { vi: "ngay khi" },
  "no later than": { vi: "không muộn hơn; chậm nhất là" },
  "no longer": { vi: "không còn nữa" },
  "in advance": { vi: "trước; trước thời hạn" },
  "ahead of schedule": { vi: "sớm hơn lịch trình" },
  "behind schedule": { vi: "chậm tiến độ" },
  "on schedule": { vi: "đúng lịch; đúng tiến độ" },
  "on time": { vi: "đúng giờ" },
  "in time": { vi: "kịp lúc" },
  "be responsible for": { vi: "chịu trách nhiệm về; phụ trách" },
  "responsible for": { vi: "chịu trách nhiệm về; phụ trách" },
  "be in charge of": { vi: "phụ trách" },
  "in charge of": { vi: "phụ trách" },
  "be required to": { vi: "được yêu cầu phải; bắt buộc phải" },
  "be expected to": { vi: "được kỳ vọng sẽ; dự kiến sẽ" },
  "be scheduled to": { vi: "được lên lịch để" },
  "be likely to": { vi: "có khả năng sẽ" },
  "be eligible for": { vi: "đủ điều kiện để; đủ điều kiện nhận" },
  "be available for": { vi: "có sẵn cho; có thể tham gia" },
  "apply for": { vi: "nộp đơn xin; ứng tuyển" },
  "apply to": { vi: "áp dụng cho; nộp đơn vào" },
  "fill out": { vi: "điền vào (biểu mẫu)" },
  "fill in": { vi: "điền vào" },
  "sign up for": { vi: "đăng ký tham gia" },
  "register for": { vi: "đăng ký" },
  "look forward to": { vi: "mong chờ" },
  "follow up on": { vi: "theo dõi; xử lý tiếp" },
  "follow up with": { vi: "liên hệ lại với" },
  "deal with": { vi: "xử lý; giải quyết" },
  "take care of": { vi: "chăm sóc; xử lý" },
  "take part in": { vi: "tham gia" },
  "participate in": { vi: "tham gia" },
  "attend a meeting": { vi: "tham dự cuộc họp" },
  "hold a meeting": { vi: "tổ chức cuộc họp" },
  "make an appointment": { vi: "đặt lịch hẹn" },
  "make a reservation": { vi: "đặt chỗ" },
  "place an order": { vi: "đặt hàng" },
  "cancel an order": { vi: "hủy đơn hàng" },
  "confirm an order": { vi: "xác nhận đơn hàng" },
  "process an order": { vi: "xử lý đơn hàng" },
  "customer service": { vi: "dịch vụ khách hàng" },
  "customer satisfaction": { vi: "sự hài lòng của khách hàng" },
  "quality control": { vi: "kiểm soát chất lượng" },
  "quality assurance": { vi: "đảm bảo chất lượng" },
  "market research": { vi: "nghiên cứu thị trường" },
  "sales representative": { vi: "đại diện bán hàng; nhân viên kinh doanh" },
  "human resources": { vi: "nhân sự; phòng nhân sự" },
  "head office": { vi: "trụ sở chính" },
  "branch office": { vi: "văn phòng chi nhánh" },
  "business trip": { vi: "chuyến công tác" },
  "annual report": { vi: "báo cáo thường niên" },
  "financial statement": { vi: "báo cáo tài chính" },
  "purchase order": { vi: "đơn đặt hàng mua" },
  "delivery date": { vi: "ngày giao hàng" },
  "shipping fee": { vi: "phí vận chuyển" },
  "shipping address": { vi: "địa chỉ giao hàng" },
  "payment method": { vi: "phương thức thanh toán" },
  "credit card": { vi: "thẻ tín dụng" },
  "bank transfer": { vi: "chuyển khoản ngân hàng" },
  "business hours": { vi: "giờ làm việc; giờ kinh doanh" },
  "opening hours": { vi: "giờ mở cửa" },
  "working hours": { vi: "giờ làm việc" },
  "full time": { vi: "toàn thời gian" },
  "part time": { vi: "bán thời gian" },
  "full-time position": { vi: "vị trí toàn thời gian" },
  "job opening": { vi: "vị trí tuyển dụng đang mở" },
  "job vacancy": { vi: "vị trí việc làm còn trống" },
  "work experience": { vi: "kinh nghiệm làm việc" },
  "work environment": { vi: "môi trường làm việc" },
  "annual leave": { vi: "nghỉ phép năm" },
  "sick leave": { vi: "nghỉ ốm" },
  "paid leave": { vi: "nghỉ có lương" },
  "health insurance": { vi: "bảo hiểm y tế" },
  "employee benefits": { vi: "phúc lợi nhân viên" },
  "performance review": { vi: "đánh giá hiệu suất" },
  "training session": { vi: "buổi đào tạo" },
  "conference room": { vi: "phòng hội nghị; phòng họp" },
  "meeting room": { vi: "phòng họp" },
  "office supplies": { vi: "vật tư văn phòng" },
  "out of stock": { vi: "hết hàng" },
  "in stock": { vi: "còn hàng" },
  "in person": { vi: "trực tiếp" },
  "by phone": { vi: "qua điện thoại" },
  "by email": { vi: "qua email" },
  "on behalf of": { vi: "thay mặt cho" },
  "with regard to": { vi: "liên quan đến; về việc" },
  "with respect to": { vi: "liên quan đến; về" },
  "in accordance with": { vi: "phù hợp với; theo đúng" },
  "in response to": { vi: "để phản hồi; nhằm đáp lại" },
  "in terms of": { vi: "về mặt; xét về" },
  "in case of": { vi: "trong trường hợp" },
  "in the event of": { vi: "trong trường hợp xảy ra" },
  "by the end of": { vi: "trước/cuối ..." },
  "at the end of": { vi: "vào cuối ..." },
  "from time to time": { vi: "thỉnh thoảng" },
  "once a week": { vi: "mỗi tuần một lần" },
  "twice a month": { vi: "mỗi tháng hai lần" },
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[“”"'`]/g, "")
    .replace(/[,.!?;:]+$/g, "")
    .replace(/\s+/g, " ");
}

function tokenize(value: string): Set<string> {
  const stop = new Set(["a", "an", "the", "to", "of", "or", "and", "that", "which", "who", "is", "are", "be"]);
  return new Set(
    (value.toLowerCase().match(/[a-z]+(?:-[a-z]+)*/g) || [])
      .filter((token) => token.length > 1 && !stop.has(token)),
  );
}

export function lookupLocalPhrase(text: string): TranslationResult | null {
  const startedAt = performance.now();
  const key = normalize(text);
  const item = PHRASES[key];
  if (!item) return null;

  const chunks = item.explanation
    ? item.explanation.split(";").map((part) => {
        const [source, ...targetParts] = part.split("=");
        return {
          source: source.trim(),
          target: targetParts.join("=").trim(),
        };
      }).filter((chunk) => chunk.source && chunk.target)
    : [];

  return {
    sourceText: text.trim(),
    translatedText: item.vi,
    alternativeTranslations: item.alt || [],
    source: "local",
    confidence: 0.98,
    latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
    isPartial: false,
    sourceLanguage: "en",
    targetLanguage: "vi",
    chunks,
    keyVocabulary: [],
    grammarNotes: [],
    naturalnessNote: null,
    reverseSuggestions: buildReverseSuggestions(text),
    analysisStatus: chunks.length ? "complete" : "none",
  };
}

export function buildReverseSuggestions(text: string, limit = 4): ReverseSuggestion[] {
  const queryTokens = tokenize(text);
  if (!queryTokens.size) return [];

  const scored: ReverseSuggestion[] = [];
  for (const [word, entry] of Object.entries(TOEIC_CORE_ENTRIES)) {
    const firstMeaning = entry.partsOfSpeech[0]?.meanings[0];
    if (!firstMeaning) continue;
    const definitionTokens = tokenize(`${word} ${firstMeaning.englishDefinition}`);
    let overlap = 0;
    for (const token of queryTokens) if (definitionTokens.has(token)) overlap += 1;
    if (!overlap) continue;
    const score = overlap / Math.max(queryTokens.size, 1);
    if (score < 0.34) continue;
    scored.push({
      word,
      meaning: firstMeaning.vietnamese,
      score: Math.min(0.99, score + (definitionTokens.has(word) ? 0.08 : 0)),
    });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word))
    .slice(0, limit);
}

export function localPhraseAnalysis(text: string): TranslationAnalysis {
  return {
    chunks: [],
    keyVocabulary: [],
    grammarNotes: [],
    naturalnessNote: null,
    reverseSuggestions: buildReverseSuggestions(text),
  };
}

export const localPhraseService = {
  lookup: lookupLocalPhrase,
  analyze: localPhraseAnalysis,
  reverse: buildReverseSuggestions,
};
