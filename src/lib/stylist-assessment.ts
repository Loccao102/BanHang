export type StylistScoreKey = "color" | "proportion" | "style" | "preference" | "render";

export type StylistScore = {
  key: StylistScoreKey;
  label: string;
  score: number;
  note: string;
};

export type StylistAssessment = {
  overallScore: number;
  verdict: string;
  summary: string;
  scores: StylistScore[];
  positives: string[];
  cautions: string[];
  suggestions: string[];
  mode: "vision+profile" | "metadata+profile";
  profileConfidence: number;
  disclaimer: string;
  assessedAt: string;
};

export function stylistVerdict(score: number) {
  if (score >= 88) return "Rất phù hợp";
  if (score >= 78) return "Khá phù hợp";
  if (score >= 68) return "Hợp ở mức ổn";
  if (score >= 58) return "Có điểm cần cân nhắc";
  return "Nên thử cách phối khác";
}
