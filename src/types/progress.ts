export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export type UserProgress = {
  username: string;
  solvedCount: number;
  currentStreak: number;
  updatedAt: string;
};
