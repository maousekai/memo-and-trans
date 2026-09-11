import { fsrs, createEmptyCard, Rating, Card, generatorParameters } from "ts-fsrs";
import {
  FSRSCardData,
  FSRSRating,
  SavedWord,
  GeneratedFlashcard,
  CardType,
  WeaknessProfile,
  LearningStage,
  PersonalizedWeakness,
} from "../../types/study";

const params = generatorParameters({
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: true,
});

const f = fsrs(params);

export function createDefaultFSRSCard(): FSRSCardData {
  const empty = createEmptyCard(new Date());
  return {
    due: empty.due.toISOString(),
    stability: empty.stability,
    difficulty: empty.difficulty,
    elapsedDays: empty.elapsed_days,
    scheduledDays: empty.scheduled_days,
    reps: empty.reps,
    lapses: empty.lapses,
    state: empty.state,
    lastReview: empty.last_review ? empty.last_review.toISOString() : undefined,
  };
}

export function createDefaultWeaknessProfile(): WeaknessProfile {
  return {
    meaningErrors: 0,
    spellingErrors: 0,
    listeningErrors: 0,
    contextErrors: 0,
    productionErrors: 0,
  };
}

export function createDefaultPersonalizedWeakness(): PersonalizedWeakness {
  return {
    meaningRecall: 0.8,
    spellingRecall: 0.8,
    listeningRecall: 0.8,
    contextRecall: 0.8,
    productionRecall: 0.8,
  };
}

function toFsrsCard(data: FSRSCardData): Card {
  return {
    due: new Date(data.due),
    stability: data.stability,
    difficulty: data.difficulty,
    elapsed_days: data.elapsedDays,
    scheduled_days: data.scheduledDays,
    reps: data.reps,
    lapses: data.lapses,
    state: data.state as any,
    last_review: data.lastReview ? new Date(data.lastReview) : undefined,
    learning_steps: 0,
  };
}

function formatInterval(due: Date, now: Date): string {
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) return "ngay";
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${Math.max(1, diffMinutes)}p`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}g`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}ng`;
  const diffMonths = Math.round(diffDays / 30);
  return `${diffMonths}th`;
}

export function calculateNextIntervals(
  cardData: FSRSCardData,
  now: Date = new Date()
): Record<FSRSRating, string> {
  const card = toFsrsCard(cardData);
  const schedulingCards = f.repeat(card, now);

  return {
    again: formatInterval(schedulingCards[Rating.Again].card.due, now),
    hard: formatInterval(schedulingCards[Rating.Hard].card.due, now),
    good: formatInterval(schedulingCards[Rating.Good].card.due, now),
    easy: formatInterval(schedulingCards[Rating.Easy].card.due, now),
  };
}

export function processFSRSReview(
  cardData: FSRSCardData,
  userRating: FSRSRating,
  now: Date = new Date()
): { updatedCard: FSRSCardData; nextIntervalDays: number } {
  const card = toFsrsCard(cardData);
  const ratingMap: Record<FSRSRating, Rating> = {
    again: Rating.Again,
    hard: Rating.Hard,
    good: Rating.Good,
    easy: Rating.Easy,
  };

  const ratingEnum = ratingMap[userRating];
  const item = f.repeat(card, now)[ratingEnum];
  const newCard = item.card;

  const updated: FSRSCardData = {
    due: newCard.due.toISOString(),
    stability: newCard.stability,
    difficulty: newCard.difficulty,
    elapsedDays: newCard.elapsed_days,
    scheduledDays: newCard.scheduled_days,
    reps: newCard.reps,
    lapses: newCard.lapses,
    state: newCard.state,
    lastReview: now.toISOString(),
  };

  return {
    updatedCard: updated,
    nextIntervalDays: Math.max(0, newCard.scheduled_days),
  };
}

// 5-Stage Vocabulary Acquisition Pipeline transitions
export function advanceLearningStage(
  currentStage: LearningStage = 0,
  rating: FSRSRating
): LearningStage {
  if (rating === "again") {
    // Drop back one stage on lapse, minimum Stage 1
    return Math.max(1, currentStage - 1) as LearningStage;
  }
  if (rating === "hard") {
    return currentStage;
  }
  if (rating === "good") {
    return Math.min(5, currentStage + 1) as LearningStage;
  }
  if (rating === "easy") {
    // Jump forward faster if already mastering
    return Math.min(5, currentStage + (currentStage === 0 ? 2 : 1)) as LearningStage;
  }
  return currentStage;
}

// Update personalized weakness profile based on review outcomes
export function updateWeaknessProfile(
  currentWeakness: PersonalizedWeakness = createDefaultPersonalizedWeakness(),
  currentErrors: WeaknessProfile = createDefaultWeaknessProfile(),
  cardType: CardType,
  success: boolean
): { updatedPersonalized: PersonalizedWeakness; updatedErrors: WeaknessProfile } {
  const p = { ...currentWeakness };
  const e = { ...currentErrors };

  const factor = success ? 1.0 : 0.0;
  const alpha = 0.25; // learning rate for rolling recall probability

  switch (cardType) {
    case "en_to_vi":
    case "context_meaning":
      p.meaningRecall = Number((p.meaningRecall * (1 - alpha) + factor * alpha).toFixed(2));
      if (!success) e.meaningErrors += 1;
      break;
    case "vi_to_en":
      p.spellingRecall = Number((p.spellingRecall * (1 - alpha) + factor * alpha).toFixed(2));
      if (!success) e.spellingErrors += 1;
      break;
    case "listening":
      p.listeningRecall = Number((p.listeningRecall * (1 - alpha) + factor * alpha).toFixed(2));
      if (!success) e.listeningErrors += 1;
      break;
    case "cloze":
      p.contextRecall = Number((p.contextRecall * (1 - alpha) + factor * alpha).toFixed(2));
      if (!success) e.contextErrors += 1;
      break;
    case "sentence_production":
      p.productionRecall = Number((p.productionRecall * (1 - alpha) + factor * alpha).toFixed(2));
      if (!success) e.productionErrors += 1;
      break;
  }

  return { updatedPersonalized: p, updatedErrors: e };
}

export function computeMasteryScore(
  card: FSRSCardData,
  stage: LearningStage = 0,
  personalized?: PersonalizedWeakness
): number {
  // Stage weight: 50%
  const stageScore = (stage / 5) * 50;

  // FSRS stability score: 30%
  const stabilityScore = Math.min(30, (card.stability / 10) * 30);

  // Personalized recall score: 20%
  let recallScore = 16;
  if (personalized) {
    const avgRecall =
      (personalized.meaningRecall +
        personalized.spellingRecall +
        personalized.listeningRecall +
        personalized.contextRecall +
        personalized.productionRecall) /
      5;
    recallScore = avgRecall * 20;
  }

  return Math.min(100, Math.round(stageScore + stabilityScore + recallScore));
}

// Determines the card type strictly based on the 5-stage pipeline and weakness model
export function selectSmartCardType(word: SavedWord): CardType {
  const stage = word.learningStage ?? 0;
  const pw = word.personalizedWeakness || createDefaultPersonalizedWeakness();

  switch (stage) {
    case 0:
      // Stage 0: NEW -> Introduction & direct recognition
      return "en_to_vi";

    case 1:
      // Stage 1: RECOGNITION -> Multiple-choice meaning / context
      return "context_meaning";

    case 2:
      // Stage 2: ACTIVE RECALL -> Vietnamese to English typing or Listening
      return pw.listeningRecall < pw.spellingRecall ? "listening" : "vi_to_en";

    case 3:
      // Stage 3: CONTEXT -> Cloze deletion from dictionary example
      return "cloze";

    case 4:
      // Stage 4: PRODUCTION -> Sentence writing with AI feedback
      return "sentence_production";

    case 5:
    default: {
      // Stage 5: MATURE -> Target the weakest skill (excluding production unless ready)
      const weaknesses = [
        { type: "en_to_vi" as CardType, score: pw.meaningRecall },
        { type: "vi_to_en" as CardType, score: pw.spellingRecall },
        { type: "cloze" as CardType, score: pw.contextRecall },
        { type: "listening" as CardType, score: pw.listeningRecall },
        { type: "sentence_production" as CardType, score: pw.productionRecall },
      ];

      // Sort ascending (lowest recall first)
      weaknesses.sort((a, b) => a.score - b.score);
      // Pick weakest with 70% probability, or second weakest
      return Math.random() < 0.7 ? weaknesses[0].type : weaknesses[1].type;
    }
  }
}

// Generate practical flashcard payloads from a saved word
export function generateFlashcards(word: SavedWord): GeneratedFlashcard[] {
  const cards: GeneratedFlashcard[] = [];
  const dict = word.dictionary;
  const primaryMeaning = dict.partsOfSpeech[0]?.meanings[0];
  const vietnamese = primaryMeaning?.vietnamese || "Không có nghĩa";
  const firstExample = primaryMeaning?.examples[0];
  const stage = word.learningStage ?? 0;

  // 1. Stage 0: English -> Vietnamese (Introduction / Meaning check)
  cards.push({
    id: `${word.id}-en_to_vi`,
    wordId: word.id,
    word: word.word,
    type: "en_to_vi",
    learningStage: 0,
    prompt: word.word,
    promptSecondary: dict.ipaUS || dict.ipaUK || undefined,
    expectedAnswer: vietnamese,
    vietnameseMeaning: vietnamese,
  });

  // 2. Stage 1: Context & Multiple Choice Meaning
  const distractors = [
    "làm tăng thêm, khuếch đại",
    "nghi ngờ, không chắc chắn",
    "bắt buộc, cưỡng chế",
    "tạm dừng hoạt động",
  ];
  const options = [vietnamese, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);

  cards.push({
    id: `${word.id}-context_meaning`,
    wordId: word.id,
    word: word.word,
    type: "context_meaning",
    learningStage: 1,
    prompt: firstExample?.english
      ? `Xác định nghĩa phù hợp của từ "${word.word}" trong câu:`
      : `Chọn nghĩa tiếng Việt chính xác của từ "${word.word}":`,
    promptSecondary: firstExample?.english ? `"${firstExample.english}"` : undefined,
    expectedAnswer: vietnamese,
    options,
    vietnameseMeaning: vietnamese,
  });

  // 3. Stage 2: Active Recall (Vietnamese -> Type English)
  cards.push({
    id: `${word.id}-vi_to_en`,
    wordId: word.id,
    word: word.word,
    type: "vi_to_en",
    learningStage: 2,
    prompt: vietnamese,
    promptSecondary: `Gõ từ tiếng Anh tương ứng (${dict.partsOfSpeech[0]?.type || "word"})`,
    expectedAnswer: word.word,
    vietnameseMeaning: vietnamese,
  });

  // Listening Card
  cards.push({
    id: `${word.id}-listening`,
    wordId: word.id,
    word: word.word,
    type: "listening",
    learningStage: 2,
    prompt: "Nghe phát âm và gõ lại từ vựng tiếng Anh:",
    audioText: word.word,
    expectedAnswer: word.word,
    vietnameseMeaning: vietnamese,
  });

  // 4. Stage 3: Cloze Deletion (Fill in the blank in real sentence)
  if (firstExample && firstExample.english.toLowerCase().includes(word.word.toLowerCase())) {
    const regex = new RegExp(`\\b${word.word}\\b`, "i");
    const clozeSentence = firstExample.english.replace(regex, "________");
    cards.push({
      id: `${word.id}-cloze`,
      wordId: word.id,
      word: word.word,
      type: "cloze",
      learningStage: 3,
      prompt: clozeSentence,
      promptSecondary: firstExample.vietnamese,
      expectedAnswer: word.word,
      contextSentence: firstExample.english,
      vietnameseMeaning: vietnamese,
    });
  }

  // 5. Stage 4: Sentence Production (Only for stage >= 4!)
  if (stage >= 4) {
    cards.push({
      id: `${word.id}-sentence_production`,
      wordId: word.id,
      word: word.word,
      type: "sentence_production",
      learningStage: 4,
      prompt: `Đặt một câu tiếng Anh tự nhiên sử dụng từ "${word.word}".`,
      promptSecondary: `Nghĩa mục tiêu: ${vietnamese}`,
      expectedAnswer: word.word,
      collocationsHint: dict.commonCollocations.slice(0, 3),
      vietnameseMeaning: vietnamese,
    });
  }

  return cards;
}
