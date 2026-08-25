export type WatchlistSummary = {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type WatchlistItem = {
  id: string;
  exchange: string;
  symbol: string;
  position: number;
  createdAt: string;
};

export type WatchlistDetail = {
  id: string;
  name: string;
  items: WatchlistItem[];
  createdAt: string;
  updatedAt: string;
};
