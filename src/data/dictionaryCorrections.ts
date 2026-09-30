import type { DictionaryEntry, Meaning, PartOfSpeech } from "../types/dictionary";

function sense(vi: string, en: string, english: string, vietnamese: string): Meaning {
  return { vietnamese: vi, englishDefinition: en, examples: [{ english, vietnamese }],
    register: null, context: null, collocations: [] };
}
function part(type: string, forms: string[], ...meanings: Meaning[]): PartOfSpeech {
  return { type, forms, meanings };
}
function entry(word: string, ...partsOfSpeech: PartOfSpeech[]): DictionaryEntry {
  return { query: word, normalizedWord: word, dataVersion: 2, provenance: "curated", language: "en",
    ipaUS: null, ipaUK: null, syllables: null, cefr: null, frequency: null,
    partsOfSpeech, synonyms: [], antonyms: [], wordFamily: [], commonCollocations: [],
    commonMistakes: [], mnemonic: null };
}

// Explicit sense pairs and examples for regressions found in the desktop audit.
// These cover common uses, not every technical or historical sense.
export const DICTIONARY_CORRECTIONS: Record<string, DictionaryEntry> = {
  bank: entry("bank",
    part("noun", ["banks"],
      sense("ngân hàng", "an institution that holds money and provides financial services",
        "She deposited the money at the bank.", "Cô ấy gửi tiền vào ngân hàng."),
      sense("bờ sông; bờ hồ", "the land along the edge of a river or lake",
        "They sat on the river bank.", "Họ ngồi trên bờ sông.")),
    part("verb", ["banks", "banked", "banking"],
      sense("gửi tiền vào ngân hàng", "to put money into a bank account",
        "We bank the money every Friday.", "Chúng tôi gửi tiền vào ngân hàng mỗi thứ Sáu."))),
  work: entry("work",
    part("noun", [],
      sense("công việc; việc làm", "an activity or job requiring effort",
        "She is looking for work.", "Cô ấy đang tìm việc làm."),
      sense("tác phẩm", "something created by an artist, writer, or composer",
        "This painting is her best work.", "Bức tranh này là tác phẩm hay nhất của cô ấy.")),
    part("verb", ["works", "worked", "working"],
      sense("làm việc", "to do a job or activity requiring effort",
        "She worked in a hospital.", "Cô ấy đã làm việc trong một bệnh viện."),
      sense("hoạt động; có tác dụng", "to function or produce the intended result",
        "The printer works well.", "Máy in hoạt động tốt."))),
  charge: entry("charge",
    part("noun", ["charges"],
      sense("phí; khoản tiền phải trả", "an amount of money requested for a service",
        "There is a delivery charge.", "Có một khoản phí giao hàng."),
      sense("lời buộc tội; cáo buộc", "a formal accusation of wrongdoing",
        "He denied the charge.", "Anh ấy phủ nhận cáo buộc."),
      sense("sự phụ trách (trong cụm in charge)", "responsibility for managing someone or something",
        "She is in charge of the team.", "Cô ấy phụ trách nhóm.")),
    part("verb", ["charges", "charged", "charging"],
      sense("tính phí", "to ask someone to pay an amount of money",
        "They charge ten dollars for delivery.", "Họ tính phí giao hàng mười đô la."),
      sense("sạc điện", "to store electrical energy in a battery",
        "I need to charge my phone.", "Tôi cần sạc điện thoại."))),
  us: entry("us", part("pronoun", [],
    sense("chúng tôi; chúng ta (tân ngữ)", "the object form of we",
      "Please help us.", "Xin hãy giúp chúng tôi."))),
  form: entry("form",
    part("noun", ["forms"],
      sense("biểu mẫu; mẫu đơn", "a document with spaces for information",
        "Please complete this form.", "Vui lòng điền mẫu đơn này."),
      sense("hình dạng; dạng", "the shape or structure of something",
        "Water can take the form of ice.", "Nước có thể tồn tại ở dạng băng.")),
    part("verb", ["forms", "formed", "forming"],
      sense("hình thành; thành lập", "to come together or create something",
        "They formed a new team.", "Họ thành lập một nhóm mới."))),
  study: entry("study",
    part("verb", ["studies", "studied", "studying"],
      sense("học; nghiên cứu", "to spend time learning about a subject",
        "I study English every day.", "Tôi học tiếng Anh mỗi ngày.")),
    part("noun", ["studies"],
      sense("nghiên cứu; công trình nghiên cứu", "a detailed investigation of a subject",
        "The study took two years.", "Nghiên cứu kéo dài hai năm."),
      sense("phòng làm việc; phòng học riêng", "a room used for reading or working",
        "He is reading in his study.", "Ông ấy đang đọc sách trong phòng làm việc."))),
};
