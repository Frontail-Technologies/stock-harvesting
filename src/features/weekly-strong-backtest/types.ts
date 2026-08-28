export type WeeklyStrongBacktestMembershipMode = "current_membership" | "historical_membership";

export type WeeklyStrongBacktestSectorCount = { sector: string; count: number };

export type WeeklyStrongBacktestStackedPoint = {
  weekEnding: string;
  total: number;
  sectors: WeeklyStrongBacktestSectorCount[];
};

export type WeeklyStrongBacktestStackedResponse = {
  collection: { code: string; name: string };
  generated: boolean;
  membershipMode: WeeklyStrongBacktestMembershipMode;
  membershipNote: string;
  points: WeeklyStrongBacktestStackedPoint[];
};

export type WeeklyStrongBacktestWeekDetailMember = {
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
};

export type WeeklyStrongBacktestWeekDetailResponse = {
  collection: { code: string; name: string };
  weekEnding: string;
  total: number;
  membershipMode: WeeklyStrongBacktestMembershipMode;
  membershipNote: string;
  members: WeeklyStrongBacktestWeekDetailMember[];
};

export type WeeklyStrongBacktestStatus =
  | { state: "not_generated" }
  | { state: "generating" }
  | { state: "ready"; weeksGenerated: number; latestWeek: string; lastGeneratedAt: string }
  | { state: "failed"; errorMessage: string | null };
