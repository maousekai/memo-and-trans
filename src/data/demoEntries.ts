import { DictionaryEntry } from "../types/dictionary";

export const DEMO_DICTIONARY_ENTRIES: Record<string, DictionaryEntry> = {
  mitigate: {
    query: "mitigate",
    normalizedWord: "mitigate",
    language: "en",
    ipaUS: "/ˈmɪtɪɡeɪt/",
    ipaUK: "/ˈmɪtɪɡeɪt/",
    syllables: "mit-i-gate",
    cefr: "C1",
    frequency: "common",
    partsOfSpeech: [
      {
        type: "verb",
        forms: ["mitigates", "mitigating", "mitigated"],
        meanings: [
          {
            vietnamese: "giảm nhẹ, giảm thiểu, làm dịu bớt",
            englishDefinition: "To make something harmful, unpleasant, or bad less severe, serious, or painful.",
            register: "formal",
            context: "Often used in environmental, legal, financial, and risk management contexts.",
            examples: [
              {
                english: "New government policies could significantly mitigate environmental damage.",
                vietnamese: "Các chính sách mới của chính phủ có thể làm giảm đáng kể thiệt hại về môi trường."
              },
              {
                english: "Soil conservation practices help mitigate the risk of severe landslides.",
                vietnamese: "Các biện pháp bảo tồn đất giúp giảm thiểu nguy cơ sạt lở nghiêm trọng."
              }
            ],
            collocations: ["mitigate risk", "mitigate damage", "mitigate impact", "mitigate climate change"]
          }
        ]
      }
    ],
    synonyms: ["alleviate", "lessen", "attenuate", "moderate", "diminish"],
    antonyms: ["exacerbate", "aggravate", "intensify", "worsen"],
    wordFamily: [
      { word: "mitigation", type: "noun", vietnameseMeaning: "sự giảm nhẹ, biện pháp giảm thiểu" },
      { word: "mitigating", type: "adjective", vietnameseMeaning: "có tính chất giảm nhẹ (tội, mức phạt)" },
      { word: "unmitigated", type: "adjective", vietnameseMeaning: "hoàn toàn, không thể cứu vãn (thường mang nghĩa tiêu cực)" }
    ],
    commonCollocations: [
      "mitigate the effects of",
      "mitigate potential hazards",
      "mitigating circumstances"
    ],
    commonMistakes: [
      {
        incorrect: "We need to mitigate this conflict by talking directly.",
        correct: "We need to mediate this conflict, or mitigate the effects of this conflict.",
        explanationVietnamese: "Người học thường nhầm lẫn giữa 'mitigate' (giảm nhẹ tác hại) và 'mediate' (hòa giải, đứng giữa làm trung gian)."
      }
    ],
    mnemonic: "Hãy nhớ: Miti-gate giống như 'Mở tí gate (cổng)' để xả bớt nước lũ, giúp giảm nhẹ (mitigate) thảm họa ngập lụt."
  },

  subtle: {
    query: "subtle",
    normalizedWord: "subtle",
    language: "en",
    ipaUS: "/ˈsʌt.l̩/",
    ipaUK: "/ˈsʌt.l̩/",
    syllables: "sub-tle",
    cefr: "B2",
    frequency: "common",
    partsOfSpeech: [
      {
        type: "adjective",
        forms: ["subtler", "subtlest"],
        meanings: [
          {
            vietnamese: "tinh tế, khó nhận thấy, phảng phất",
            englishDefinition: "Not loud, bright, noticeable, or obvious in any way; delicate and elusive.",
            register: "neutral",
            context: "Describing flavors, colors, differences, humor, or changes.",
            examples: [
              {
                english: "There is a subtle difference between the two color shades.",
                vietnamese: "Có một sự khác biệt rất tinh tế, khó nhận thấy giữa hai sắc thái màu này."
              },
              {
                english: "The soup had a subtle aroma of lemongrass and ginger.",
                vietnamese: "Món súp có hương thơm thoang thoảng tinh tế của sả và gừng."
              }
            ],
            collocations: ["subtle difference", "subtle hint", "subtle humor", "subtle change"]
          },
          {
            vietnamese: "nhạy bén, khéo léo",
            englishDefinition: "Achieved in a quiet way that does not attract attention to itself and is therefore good or clever.",
            register: "academic",
            context: "Describing intellect, diplomacy, or persuasion methods.",
            examples: [
              {
                english: "She used subtle persuasion to convince the board without appearing aggressive.",
                vietnamese: "Cô ấy đã khéo léo thuyết phục hội đồng quản trị mà không tỏ ra quá hung hăng."
              }
            ],
            collocations: ["subtle approach", "subtle mind", "subtle irony"]
          }
        ]
      }
    ],
    synonyms: ["delicate", "understated", "nuanced", "elusive", "fine"],
    antonyms: ["blatant", "obvious", "crude", "jarring", "conspicuous"],
    wordFamily: [
      { word: "subtlety", type: "noun", vietnameseMeaning: "sự tinh tế, nét tinh xảo, ẩn ý" },
      { word: "subtly", type: "adverb", vietnameseMeaning: "một cách tinh tế, kín đáo" }
    ],
    commonCollocations: ["subtle shift", "subtle nuance", "subtle undertone"],
    commonMistakes: [
      {
        incorrect: "Phát âm chữ 'b' thành /sʌb.tl̩/.",
        correct: "Chữ 'b' là âm câm (silent 'b') - phát âm chuẩn là /ˈsʌt.l̩/.",
        explanationVietnamese: "Tuyệt đối không bật âm /b/ trong từ 'subtle', chỉ phát âm là 'sút-ồ'."
      }
    ],
    mnemonic: "Âm 'b' trong 'subtle' trốn rất tinh tế (subtle) đến mức bạn không thể nghe thấy nó!"
  },

  comprehensive: {
    query: "comprehensive",
    normalizedWord: "comprehensive",
    language: "en",
    ipaUS: "/ˌkɑːm.prɪˈhen.sɪv/",
    ipaUK: "/ˌkɒm.prɪˈhen.sɪv/",
    syllables: "com-pre-hen-sive",
    cefr: "B2",
    frequency: "common",
    partsOfSpeech: [
      {
        type: "adjective",
        forms: [],
        meanings: [
          {
            vietnamese: "toàn diện, bao quát, tường tận",
            englishDefinition: "Complete and including everything that is necessary; dealing with all or nearly all elements or aspects.",
            register: "academic",
            context: "Common in reports, studies, insurance, healthcare, and educational programs.",
            examples: [
              {
                english: "The company conducted a comprehensive review of its cybersecurity protocols.",
                vietnamese: "Công ty đã tiến hành một cuộc rà soát toàn diện các quy trình an ninh mạng của mình."
              },
              {
                english: "We offer comprehensive health insurance covering both outpatient and inpatient care.",
                vietnamese: "Chúng tôi cung cấp gói bảo hiểm y tế toàn diện chi trả cho cả điều trị ngoại trú và nội trú."
              }
            ],
            collocations: ["comprehensive study", "comprehensive guide", "comprehensive coverage", "comprehensive list"]
          }
        ]
      }
    ],
    synonyms: ["exhaustive", "thorough", "all-inclusive", "extensive", "panoramic"],
    antonyms: ["partial", "selective", "incomplete", "limited", "superficial"],
    wordFamily: [
      { word: "comprehend", type: "verb", vietnameseMeaning: "hiểu, lĩnh hội" },
      { word: "comprehension", type: "noun", vietnameseMeaning: "sự hiểu biết, khả năng lĩnh hội" },
      { word: "comprehensiveness", type: "noun", vietnameseMeaning: "tính toàn diện, sự bao quát" },
      { word: "comprehensively", type: "adverb", vietnameseMeaning: "một cách toàn diện" }
    ],
    commonCollocations: [
      "a comprehensive analysis",
      "comprehensive insurance policy",
      "take a comprehensive approach"
    ],
    commonMistakes: [
      {
        incorrect: "His explanation was very comprehensive, so I understood everything easily.",
        correct: "His explanation was very comprehensible / understandable, so I understood everything easily.",
        explanationVietnamese: "Nhầm lẫn giữa 'comprehensive' (toàn diện, bao hàm nhiều thứ) và 'comprehensible' (dễ hiểu)."
      }
    ],
    mnemonic: "Comprehensive = Bao gồm tất cả mọi mặt từ A đến Z, không bỏ sót ngóc ngách nào."
  },

  retain: {
    query: "retain",
    normalizedWord: "retain",
    language: "en",
    ipaUS: "/rɪˈteɪn/",
    ipaUK: "/rɪˈteɪn/",
    syllables: "re-tain",
    cefr: "B2",
    frequency: "common",
    partsOfSpeech: [
      {
        type: "verb",
        forms: ["retains", "retaining", "retained"],
        meanings: [
          {
            vietnamese: "giữ lại, duy trì, nhớ được (thông tin)",
            englishDefinition: "To keep or continue to have something; to continue to hold or contain.",
            register: "formal",
            context: "Used with rights, customers, moisture, memories, staff, or shape.",
            examples: [
              {
                english: "The company fought hard to retain its top engineering talent during the crisis.",
                vietnamese: "Công ty đã nỗ lực hết mình để giữ chân những nhân tài kỹ thuật hàng đầu trong thời kỳ khủng hoảng."
              },
              {
                english: "Active recall techniques help learners retain vocabulary far longer.",
                vietnamese: "Các kỹ thuật truy xuất chủ động giúp người học ghi nhớ từ vựng lâu hơn rất nhiều."
              }
            ],
            collocations: ["retain staff", "retain control", "retain information", "retain moisture"]
          }
        ]
      }
    ],
    synonyms: ["preserve", "maintain", "keep", "hold", "sustain"],
    antonyms: ["relinquish", "lose", "discard", "surrender", "release"],
    wordFamily: [
      { word: "retention", type: "noun", vietnameseMeaning: "sự giữ lại, sự duy trì, khả năng ghi nhớ" },
      { word: "retentive", type: "adjective", vietnameseMeaning: "có khả năng nhớ dai, giữ nước tốt" },
      { word: "retainer", type: "noun", vietnameseMeaning: "tiền đặt cọc/thù lao giữ chỗ (luật sư, cố vấn)" }
    ],
    commonCollocations: ["retain customer loyalty", "retain one's composure", "retain the right to"],
    commonMistakes: [
      {
        incorrect: "I want to retain in this hotel for another two nights.",
        correct: "I want to remain / stay at this hotel for another two nights.",
        explanationVietnamese: "Không dùng 'retain' cho hành động 'ở lại' một địa điểm; hãy dùng 'remain' hoặc 'stay'."
      }
    ],
    mnemonic: "Re (lại) + tain (tương tự contain - chứa đựng) = giữ lại, không để tuột mất."
  },

  ambiguous: {
    query: "ambiguous",
    normalizedWord: "ambiguous",
    language: "en",
    ipaUS: "/æmˈbɪɡ.ju.əs/",
    ipaUK: "/æmˈbɪɡ.ju.əs/",
    syllables: "am-big-u-ous",
    cefr: "B2",
    frequency: "common",
    partsOfSpeech: [
      {
        type: "adjective",
        forms: [],
        meanings: [
          {
            vietnamese: "mơ hồ, nước đôi, đa nghĩa, không rõ ràng",
            englishDefinition: "Having or expressing more than one possible meaning, sometimes intentionally; open to multiple interpretations.",
            register: "academic",
            context: "Common in laws, contracts, instructions, literature, and speeches.",
            examples: [
              {
                english: "The wording of the legal contract was deliberately ambiguous.",
                vietnamese: "Cách diễn đạt trong hợp đồng pháp lý cố tình mang tính mập mờ, nước đôi."
              },
              {
                english: "His ambiguous reply left everyone wondering what he truly intended to do.",
                vietnamese: "Câu trả lời mơ hồ của anh ấy khiến mọi người băn khoăn không biết anh ấy thực sự định làm gì."
              }
            ],
            collocations: ["ambiguous statement", "ambiguous wording", "ambiguous role", "deliberately ambiguous"]
          }
        ]
      }
    ],
    synonyms: ["equivocal", "vague", "obscure", "cryptic", "indeterminate"],
    antonyms: ["unambiguous", "clear-cut", "explicit", "unequivocal", "lucid"],
    wordFamily: [
      { word: "ambiguity", type: "noun", vietnameseMeaning: "sự mơ hồ, tính đa nghĩa, điều chưa rõ ràng" },
      { word: "ambiguously", type: "adverb", vietnameseMeaning: "một cách mơ hồ, mập mờ" },
      { word: "unambiguous", type: "adjective", vietnameseMeaning: "rõ ràng, dứt khoát, không thể hiểu lầm" }
    ],
    commonCollocations: [
      "morally ambiguous",
      "ambiguous relationship",
      "remove all ambiguous clauses"
    ],
    commonMistakes: [
      {
        incorrect: "The weather is very ambiguous today.",
        correct: "The weather is very unpredictable / changeable today.",
        explanationVietnamese: "'Ambiguous' dùng cho lời nói, văn bản, cử chỉ có nhiều cách hiểu; không dùng để miêu tả thời tiết hay số liệu ngẫu nhiên."
      }
    ],
    mnemonic: "Tiền tố 'Ambi-' có nghĩa là cả hai bên (như ambidextrous - thuận cả hai tay) -> Ambiguous là có thể hiểu theo cả 2 hướng, nước đôi."
  },

  resilience: {
    query: "resilience",
    normalizedWord: "resilience",
    language: "en",
    ipaUS: "/rɪˈzɪliəns/",
    ipaUK: "/rɪˈzɪliəns/",
    syllables: "re-sil-ience",
    cefr: "C1",
    frequency: "common",
    partsOfSpeech: [
      {
        type: "noun",
        forms: ["resiliencies"],
        meanings: [
          {
            vietnamese: "khả năng phục hồi, tính kiên cường, sức bật dẻo dai",
            englishDefinition: "The capacity to recover quickly from difficulties, adversity, or shock; toughness.",
            register: "neutral",
            context: "Widely used in psychology, corporate leadership, biology, and materials science.",
            examples: [
              {
                english: "Courage and resilience are essential qualities for navigating unexpected life changes.",
                vietnamese: "Lòng dũng cảm và sự kiên cường là những phẩm chất cần thiết để vượt qua những thay đổi bất ngờ trong cuộc sống."
              },
              {
                english: "The economic resilience of the community surprised international observers.",
                vietnamese: "Sức chống chịu và phục hồi kinh tế của cộng đồng đã khiến các quan sát viên quốc tế bất ngờ."
              }
            ],
            collocations: ["build resilience", "emotional resilience", "economic resilience", "remarkable resilience"]
          }
        ]
      }
    ],
    synonyms: ["toughness", "adaptability", "flexibility", "grit", "endurance"],
    antonyms: ["fragility", "vulnerability", "weakness"],
    wordFamily: [
      { word: "resilient", type: "adjective", vietnameseMeaning: "kiên cường, có sức chống chịu dẻo dai" },
      { word: "resiliently", type: "adverb", vietnameseMeaning: "một cách kiên cường, đầy nghị lực" }
    ],
    commonCollocations: ["demonstrate resilience", "climate resilience", "psychological resilience"],
    commonMistakes: [
      {
        incorrect: "She showed great resilient in the face of crisis.",
        correct: "She showed great resilience in the face of crisis.",
        explanationVietnamese: "'Resilient' là tính từ; vị trí sau tính từ 'great' cần danh từ 'resilience'."
      }
    ],
    mnemonic: "Re (lại) + silence/bounce: Khi bị đánh gục, vẫn có khả năng bật dậy (resile) mạnh mẽ hơn trước."
  },

  serendipity: {
    query: "serendipity",
    normalizedWord: "serendipity",
    language: "en",
    ipaUS: "/ˌser.ənˈdɪp.ə.ti/",
    ipaUK: "/ˌser.ənˈdɪp.ə.ti/",
    syllables: "se-ren-dip-i-ty",
    cefr: "C2",
    frequency: "medium",
    partsOfSpeech: [
      {
        type: "noun",
        forms: [],
        meanings: [
          {
            vietnamese: "sự tình cờ may mắn, duyên may bất ngờ",
            englishDefinition: "The occurrence and development of events by chance in a happy, fortunate, or beneficial way.",
            register: "formal",
            context: "Often used when talking about scientific breakthroughs, romantic encounters, or artistic discoveries.",
            examples: [
              {
                english: "Penicillin was discovered through sheer scientific serendipity.",
                vietnamese: "Thuốc kháng sinh penicillin đã được phát hiện hoàn toàn nhờ vào một sự tình cờ may mắn trong khoa học."
              }
            ],
            collocations: ["pure serendipity", "sheer serendipity", "moment of serendipity"]
          }
        ]
      }
    ],
    synonyms: ["fluke", "happy chance", "providence", "stroke of luck"],
    antonyms: ["misfortune", "adversity"],
    wordFamily: [
      { word: "serendipitous", type: "adjective", vietnameseMeaning: "tình cờ may mắn" },
      { word: "serendipitously", type: "adverb", vietnameseMeaning: "một cách tình cờ đầy may mắn" }
    ],
    commonCollocations: ["serendipitous discovery", "serendipitous encounter"],
    commonMistakes: [
      {
        incorrect: "Winning the lottery was a complete serendipity.",
        correct: "Winning the lottery was pure luck. Finding my favorite rare book at a roadside stall was serendipity.",
        explanationVietnamese: "'Serendipity' không chỉ là may rủi đơn thuần như xổ số, mà là cái duyên tình cờ tìm thấy điều quý giá khi đang tìm kiếm điều khác."
      }
    ],
    mnemonic: "Bắt nguồn từ câu chuyện cổ Ba Hoàng tử đảo Serendip (Sri Lanka), những người luôn tìm thấy điều kỳ diệu bất ngờ trên đường."
  }
};
