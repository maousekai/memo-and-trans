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

const scheduler = fsrs(params);

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
  // New words start neutral instead of pretending the learner already has 80%
  // recall in every skill. Evidence from reviews moves each skill independently.
  return {
    meaningRecall: 0.5,
    spellingRecall: 0.5,
    listeningRecall: 0.5,
    contextRecall: 0.5,
    productionRecall: 0.5,
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
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}p`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}g`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}ng`;
  return `${Math.round(days / 30)}th`;
}

export function calculateNextIntervals(
  cardData: FSRSCardData,
  now: Date = new Date(),
): Record<FSRSRating, string> {
  const result = scheduler.repeat(toFsrsCard(cardData), now);
  return {
    again: formatInterval(result[Rating.Again].card.due, now),
    hard: formatInterval(result[Rating.Hard].card.due, now),
    good: formatInterval(result[Rating.Good].card.due, now),
    easy: formatInterval(result[Rating.Easy].card.due, now),
  };
}

export function processFSRSReview(
  cardData: FSRSCardData,
  userRating: FSRSRating,
  now: Date = new Date(),
): { updatedCard: FSRSCardData; nextIntervalDays: number } {
  const ratingMap: Record<FSRSRating, Rating> = {
    again: Rating.Again,
    hard: Rating.Hard,
    good: Rating.Good,
    easy: Rating.Easy,
  };
  const newCard = scheduler.repeat(toFsrsCard(cardData), now)[ratingMap[userRating]].card;
  return {
    updatedCard: {
      due: newCard.due.toISOString(),
      stability: newCard.stability,
      difficulty: newCard.difficulty,
      elapsedDays: newCard.elapsed_days,
      scheduledDays: newCard.scheduled_days,
      reps: newCard.reps,
      lapses: newCard.lapses,
      state: newCard.state,
      lastReview: now.toISOString(),
    },
    nextIntervalDays: Math.max(0, newCard.scheduled_days),
  };
}

// Learning stage answers HOW to review. FSRS above answers WHEN to review.
export function advanceLearningStage(
  currentStage: LearningStage = 0,
  rating: FSRSRating,
): LearningStage {
  if (rating === "again") {
    // Critical fix: failing a brand-new word must not promote Stage 0 -> Stage 1.
    if (currentStage === 0) return 0;
    return Math.max(1, currentStage - 1) as LearningStage;
  }
  if (rating === "hard") return currentStage;
  if (rating === "good") return Math.min(5, currentStage + 1) as LearningStage;
  if (rating === "easy") return Math.min(5, currentStage + (currentStage === 0 ? 2 : 1)) as LearningStage;
  return currentStage;
}

export function updateWeaknessProfile(
  currentWeakness: PersonalizedWeakness = createDefaultPersonalizedWeakness(),
  currentErrors: WeaknessProfile = createDefaultWeaknessProfile(),
  cardType: CardType,
  success: boolean,
): { updatedPersonalized: PersonalizedWeakness; updatedErrors: WeaknessProfile } {
  const recall = { ...currentWeakness };
  const errors = { ...currentErrors };
  const observation = success ? 1 : 0;
  const alpha = 0.22;
  const update = (value: number) => Number((value * (1 - alpha) + observation * alpha).toFixed(2));

  switch (cardType) {
    case "en_to_vi":
    case "context_meaning":
      recall.meaningRecall = update(recall.meaningRecall);
      if (!success) errors.meaningErrors += 1;
      break;
    case "vi_to_en":
      recall.spellingRecall = update(recall.spellingRecall);
      if (!success) errors.spellingErrors += 1;
      break;
    case "listening":
      recall.listeningRecall = update(recall.listeningRecall);
      if (!success) errors.listeningErrors += 1;
      break;
    case "cloze":
      recall.contextRecall = update(recall.contextRecall);
      if (!success) errors.contextErrors += 1;
      break;
    case "sentence_production":
      recall.productionRecall = update(recall.productionRecall);
      if (!success) errors.productionErrors += 1;
      break;
  }

  return { updatedPersonalized: recall, updatedErrors: errors };
}

export function computeMasteryScore(
  card: FSRSCardData,
  stage: LearningStage = 0,
  personalized?: PersonalizedWeakness,
): number {
  const stageScore = (stage / 5) * 50;
  const stabilityScore = Math.min(30, (card.stability / 10) * 30);
  let recallScore = 10;
  if (personalized) {
    const average = (
      personalized.meaningRecall +
      personalized.spellingRecall +
      personalized.listeningRecall +
      personalized.contextRecall +
      personalized.productionRecall
    ) / 5;
    recallScore = average * 20;
  }
  return Math.min(100, Math.round(stageScore + stabilityScore + recallScore));
}

export function selectSmartCardType(word: SavedWord): CardType {
  const stage = word.learningStage ?? 0;
  const skill = word.personalizedWeakness || createDefaultPersonalizedWeakness();

  switch (stage) {
    case 0:
      return "en_to_vi";
    case 1:
      return "context_meaning";
    case 2:
      return skill.listeningRecall + 0.08 < skill.spellingRecall ? "listening" : "vi_to_en";
    case 3:
      return "cloze";
    case 4:
      return "sentence_production";
    case 5:
    default: {
      const skills: Array<{ type: CardType; score: number }> = [
        { type: "en_to_vi", score: skill.meaningRecall },
        { type: "vi_to_en", score: skill.spellingRecall },
        { type: "listening", score: skill.listeningRecall },
        { type: "cloze", score: skill.contextRecall },
        // Production remains in the mature mix, but its score decides whether
        // it deserves attention instead of appearing randomly.
        { type: "sentence_production", score: skill.productionRecall + 0.04 },
      ];
      skills.sort((a, b) => a.score - b.score);
      return skills[0].type;
    }
  }
}

export function generateFlashcards(word: SavedWord): GeneratedFlashcard[] {
  const cards: GeneratedFlashcard[] = [];
  const dictionary = word.dictionary;
  const primaryPos = dictionary.partsOfSpeech[0];
  const primaryMeaning = primaryPos?.meanings[0];
  const vietnamese = primaryMeaning?.vietnamese || "Không có nghĩa";
  const firstExample = primaryMeaning?.examples[0];
  const stage = word.learningStage ?? 0;

  cards.push({
    id: `${word.id}-en_to_vi`,
    wordId: word.id,
    word: word.word,
    type: "en_to_vi",
    learningStage: 0,
    prompt: word.word,
    promptSecondary: dictionary.ipaUS || dictionary.ipaUK || undefined,
    expectedAnswer: vietnamese,
    vietnameseMeaning: vietnamese,
  });

  const distractors = [
    "làm tăng thêm, khuếch đại",
    "nghi ngờ, không chắc chắn",
    "bắt buộc, cưỡng chế",
    "tạm dừng hoạt động",
  ].filter((item) => item !== vietnamese);
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

  cards.push({
    id: `${word.id}-vi_to_en`,
    wordId: word.id,
    word: word.word,
    type: "vi_to_en",
    learningStage: 2,
    prompt: vietnamese,
    promptSecondary: `Gõ từ tiếng Anh tương ứng (${primaryPos?.type || "word"})`,
    expectedAnswer: word.word,
    vietnameseMeaning: vietnamese,
  });

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

  if (firstExample?.english) {
    const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}(?:s|es|ed|ing)?\\b`, "i");
    if (regex.test(firstExample.english)) {
      cards.push({
        id: `${word.id}-cloze`,
        wordId: word.id,
        word: word.word,
        type: "cloze",
        learningStage: 3,
        prompt: firstExample.english.replace(regex, "________"),
        promptSecondary: firstExample.vietnamese,
        expectedAnswer: word.word,
        contextSentence: firstExample.english,
        vietnameseMeaning: vietnamese,
      });
    }
  }

  // Production is gated. A newly-saved word can never jump directly into this
  // expensive/open-ended exercise merely because cards were generated.
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
      collocationsHint: dictionary.commonCollocations.slice(0, 3),
      vietnameseMeaning: vietnamese,
    });
  }

  return cards;
}
