import type { DictionaryEntry } from "../types/dictionary";

type Seed = {
  word: string;
  pos: string;
  vi: string;
  en: string;
  ipa?: string;
  forms?: string[];
  example?: string;
  exampleVi?: string;
};

function build(seed: Seed): DictionaryEntry {
  return {
    query: seed.word,
    normalizedWord: seed.word,
    language: "en",
    ipaUS: seed.ipa || null,
    ipaUK: seed.ipa || null,
    syllables: null,
    cefr: null,
    frequency: "common",
    partsOfSpeech: [{
      type: seed.pos,
      forms: seed.forms || [],
      meanings: [{
        vietnamese: seed.vi,
        englishDefinition: seed.en,
        register: null,
        context: "TOEIC / workplace vocabulary",
        examples: seed.example ? [{ english: seed.example, vietnamese: seed.exampleVi || "" }] : [],
        collocations: [],
      }],
    }],
    synonyms: [],
    antonyms: [],
    wordFamily: [],
    commonCollocations: [],
    commonMistakes: [],
    mnemonic: null,
  };
}

const seeds: Seed[] = [
  { word: "occupation", pos: "noun", vi: "nghề nghiệp; công việc", en: "a person's job or profession", ipa: "/ˌɑː.kjəˈpeɪ.ʃən/", forms: ["occupations"], example: "Please state your occupation on the application form.", exampleVi: "Vui lòng ghi nghề nghiệp của bạn vào đơn đăng ký." },
  { word: "profession", pos: "noun", vi: "nghề nghiệp; nghề chuyên môn", en: "a paid occupation that usually requires special education or training", ipa: "/prəˈfeʃ.ən/", forms: ["professions"], example: "Teaching is a demanding profession.", exampleVi: "Giảng dạy là một nghề đòi hỏi cao." },
  { word: "job", pos: "noun", vi: "công việc; việc làm", en: "regular work that a person does to earn money", ipa: "/dʒɑːb/", forms: ["jobs"], example: "She applied for a job in the sales department.", exampleVi: "Cô ấy đã ứng tuyển một công việc ở phòng kinh doanh." },
  { word: "career", pos: "noun", vi: "sự nghiệp; nghề nghiệp lâu dài", en: "the series of jobs a person has during their working life", ipa: "/kəˈrɪr/", forms: ["careers"], example: "He wants to build a career in finance.", exampleVi: "Anh ấy muốn xây dựng sự nghiệp trong lĩnh vực tài chính." },
  { word: "employment", pos: "noun", vi: "việc làm; sự tuyển dụng", en: "paid work or the state of having a job", ipa: "/ɪmˈplɔɪ.mənt/", example: "The company offers full-time employment.", exampleVi: "Công ty cung cấp việc làm toàn thời gian." },
  { word: "employee", pos: "noun", vi: "nhân viên", en: "a person who is paid to work for a company or organization", ipa: "/ɪmˈplɔɪ.iː/", forms: ["employees"], example: "Every employee must wear an ID badge.", exampleVi: "Mỗi nhân viên phải đeo thẻ nhận dạng." },
  { word: "employer", pos: "noun", vi: "người sử dụng lao động; chủ lao động", en: "a person or organization that employs people", ipa: "/ɪmˈplɔɪ.ɚ/", forms: ["employers"], example: "The employer provides health insurance.", exampleVi: "Chủ lao động cung cấp bảo hiểm y tế." },
  { word: "applicant", pos: "noun", vi: "ứng viên; người nộp đơn", en: "a person who applies for a job or position", ipa: "/ˈæp.lɪ.kənt/", forms: ["applicants"], example: "Each applicant must submit a resume.", exampleVi: "Mỗi ứng viên phải nộp sơ yếu lý lịch." },
  { word: "resume", pos: "noun", vi: "sơ yếu lý lịch; CV", en: "a document summarizing education, skills, and work experience", ipa: "/ˈrez.ə.meɪ/", forms: ["resumes"], example: "Please attach your resume to the email.", exampleVi: "Vui lòng đính kèm CV của bạn vào email." },
  { word: "interview", pos: "noun", vi: "buổi phỏng vấn", en: "a formal meeting in which someone is asked questions for a job", ipa: "/ˈɪn.t̬ɚ.vjuː/", forms: ["interviews"], example: "Her job interview is scheduled for Monday.", exampleVi: "Buổi phỏng vấn xin việc của cô ấy được lên lịch vào thứ Hai." },
  { word: "vacancy", pos: "noun", vi: "vị trí tuyển dụng còn trống", en: "an available job or position", ipa: "/ˈveɪ.kən.si/", forms: ["vacancies"], example: "There is a vacancy in the accounting department.", exampleVi: "Có một vị trí trống ở phòng kế toán." },
  { word: "position", pos: "noun", vi: "vị trí; chức vụ", en: "a job or role in an organization", ipa: "/pəˈzɪʃ.ən/", forms: ["positions"], example: "She accepted a managerial position.", exampleVi: "Cô ấy đã nhận một vị trí quản lý." },
  { word: "salary", pos: "noun", vi: "lương cố định", en: "a fixed amount of money paid regularly for work", ipa: "/ˈsæl.ɚ.i/", forms: ["salaries"], example: "The position offers a competitive salary.", exampleVi: "Vị trí này có mức lương cạnh tranh." },
  { word: "wage", pos: "noun", vi: "tiền công; tiền lương", en: "money paid for work, often by the hour or week", ipa: "/weɪdʒ/", forms: ["wages"], example: "Hourly wages will increase next month.", exampleVi: "Tiền công theo giờ sẽ tăng vào tháng tới." },
  { word: "promotion", pos: "noun", vi: "sự thăng chức; chương trình khuyến mãi", en: "advancement to a higher job level, or activity to advertise a product", ipa: "/prəˈmoʊ.ʃən/", forms: ["promotions"], example: "He received a promotion after two years.", exampleVi: "Anh ấy được thăng chức sau hai năm." },
  { word: "qualification", pos: "noun", vi: "trình độ; bằng cấp; điều kiện", en: "a skill, quality, or certificate that makes someone suitable for a job", ipa: "/ˌkwɑː.lə.fəˈkeɪ.ʃən/", forms: ["qualifications"], example: "Applicants must meet the minimum qualifications.", exampleVi: "Ứng viên phải đáp ứng các yêu cầu trình độ tối thiểu." },
  { word: "experience", pos: "noun", vi: "kinh nghiệm", en: "knowledge or skill gained from doing something over time", ipa: "/ɪkˈspɪr.i.əns/", example: "Previous sales experience is preferred.", exampleVi: "Ưu tiên ứng viên có kinh nghiệm bán hàng trước đây." },
  { word: "colleague", pos: "noun", vi: "đồng nghiệp", en: "a person you work with", ipa: "/ˈkɑː.liːɡ/", forms: ["colleagues"], example: "I discussed the proposal with my colleagues.", exampleVi: "Tôi đã thảo luận đề xuất với các đồng nghiệp." },
  { word: "supervisor", pos: "noun", vi: "người giám sát; cấp trên", en: "a person who manages or oversees the work of others", ipa: "/ˈsuː.pɚ.vaɪ.zɚ/", forms: ["supervisors"], example: "Ask your supervisor for approval.", exampleVi: "Hãy xin phê duyệt từ cấp trên của bạn." },
  { word: "department", pos: "noun", vi: "phòng ban; bộ phận", en: "a division of a large organization", ipa: "/dɪˈpɑːrt.mənt/", forms: ["departments"], example: "The finance department prepared the report.", exampleVi: "Phòng tài chính đã chuẩn bị báo cáo." },
  { word: "contract", pos: "noun", vi: "hợp đồng", en: "a legal written agreement between people or organizations", ipa: "/ˈkɑːn.trækt/", forms: ["contracts"], example: "Both parties signed the contract.", exampleVi: "Cả hai bên đã ký hợp đồng." },
  { word: "schedule", pos: "noun", vi: "lịch trình; thời gian biểu", en: "a plan showing when activities or events will happen", ipa: "/ˈskedʒ.uːl/", forms: ["schedules"], example: "The meeting is on the revised schedule.", exampleVi: "Cuộc họp nằm trong lịch trình đã điều chỉnh." },
  { word: "appointment", pos: "noun", vi: "cuộc hẹn; sự bổ nhiệm", en: "an arrangement to meet someone at a particular time", ipa: "/əˈpɔɪnt.mənt/", forms: ["appointments"], example: "I have a dental appointment at three.", exampleVi: "Tôi có lịch hẹn nha sĩ lúc ba giờ." },
  { word: "invoice", pos: "noun", vi: "hóa đơn thanh toán", en: "a document listing goods or services and the amount owed", ipa: "/ˈɪn.vɔɪs/", forms: ["invoices"], example: "Please send the invoice by email.", exampleVi: "Vui lòng gửi hóa đơn qua email." },
  { word: "shipment", pos: "noun", vi: "lô hàng; việc giao hàng", en: "goods that are sent from one place to another", ipa: "/ˈʃɪp.mənt/", forms: ["shipments"], example: "The shipment arrived two days early.", exampleVi: "Lô hàng đã đến sớm hai ngày." },
  { word: "inventory", pos: "noun", vi: "hàng tồn kho; bản kiểm kê", en: "the goods and materials a business has available", ipa: "/ˈɪn.vən.tɔːr.i/", forms: ["inventories"], example: "The store checks its inventory every week.", exampleVi: "Cửa hàng kiểm tra hàng tồn kho mỗi tuần." },
  { word: "warehouse", pos: "noun", vi: "kho hàng", en: "a large building used for storing goods", ipa: "/ˈwer.haʊs/", forms: ["warehouses"], example: "The products are stored in a nearby warehouse.", exampleVi: "Các sản phẩm được lưu trong một kho hàng gần đó." },
  { word: "supplier", pos: "noun", vi: "nhà cung cấp", en: "a company or person that provides goods or services", ipa: "/səˈplaɪ.ɚ/", forms: ["suppliers"], example: "We contacted the supplier about the delay.", exampleVi: "Chúng tôi đã liên hệ nhà cung cấp về sự chậm trễ." },
  { word: "purchase", pos: "noun", vi: "việc mua; món hàng đã mua", en: "the act of buying something", ipa: "/ˈpɝː.tʃəs/", forms: ["purchases"], example: "Keep the receipt for every purchase.", exampleVi: "Hãy giữ biên lai cho mỗi lần mua hàng." },
  { word: "receipt", pos: "noun", vi: "biên lai; giấy nhận tiền", en: "a document showing that money was paid for goods or services", ipa: "/rɪˈsiːt/", forms: ["receipts"], example: "May I have a receipt, please?", exampleVi: "Cho tôi xin biên lai được không?" },
  { word: "refund", pos: "noun", vi: "tiền hoàn lại", en: "money returned to a customer", ipa: "/ˈriː.fʌnd/", forms: ["refunds"], example: "Customers can request a full refund.", exampleVi: "Khách hàng có thể yêu cầu hoàn tiền đầy đủ." },
  { word: "budget", pos: "noun", vi: "ngân sách", en: "a plan for how money will be spent", ipa: "/ˈbʌdʒ.ɪt/", forms: ["budgets"], example: "The project is within budget.", exampleVi: "Dự án nằm trong phạm vi ngân sách." },
  { word: "expense", pos: "noun", vi: "chi phí", en: "money spent for a particular purpose", ipa: "/ɪkˈspens/", forms: ["expenses"], example: "Travel expenses will be reimbursed.", exampleVi: "Chi phí đi lại sẽ được hoàn trả." },
  { word: "revenue", pos: "noun", vi: "doanh thu", en: "income received by a business", ipa: "/ˈrev.ə.nuː/", example: "Online sales increased company revenue.", exampleVi: "Bán hàng trực tuyến đã làm tăng doanh thu công ty." },
  { word: "branch", pos: "noun", vi: "chi nhánh", en: "a local office or division of a larger organization", ipa: "/bræntʃ/", forms: ["branches"], example: "The bank opened a new branch downtown.", exampleVi: "Ngân hàng đã mở một chi nhánh mới ở trung tâm thành phố." },
  { word: "headquarters", pos: "noun", vi: "trụ sở chính", en: "the main office of an organization", ipa: "/ˈhedˌkwɔːr.t̬ɚz/", example: "The company moved its headquarters to Seoul.", exampleVi: "Công ty đã chuyển trụ sở chính đến Seoul." },
  { word: "maintenance", pos: "noun", vi: "bảo trì; bảo dưỡng", en: "work done to keep equipment or buildings in good condition", ipa: "/ˈmeɪn.tən.əns/", example: "The elevator is closed for maintenance.", exampleVi: "Thang máy đóng cửa để bảo trì." },
  { word: "equipment", pos: "noun", vi: "thiết bị", en: "the tools or machines needed for a particular purpose", ipa: "/ɪˈkwɪp.mənt/", example: "New office equipment will arrive tomorrow.", exampleVi: "Thiết bị văn phòng mới sẽ đến vào ngày mai." },
];

export const TOEIC_CORE_ENTRIES: Record<string, DictionaryEntry> = Object.fromEntries(
  seeds.map((seed) => [seed.word, build(seed)]),
);

export const TOEIC_QUERY_ALIASES: Record<string, string> = {
  "profession or job": "occupation",
  "a profession or job": "occupation",
  "job or profession": "occupation",
  "work that a person does": "occupation",
  "person's job or profession": "occupation",
};
