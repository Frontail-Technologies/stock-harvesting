export type WidgetSource =
  | { type: "segment"; id: string }
  | { type: "watchlist"; id: string };

// A WidgetSource resolved against the currently-loaded Segments/Watchlists
// lists, carrying only what a card needs to render/query - resolved once
// per render in WidgetPage rather than re-looked-up inside every card.
export type ResolvedWidgetSource =
  | { type: "segment"; id: string; code: string; name: string }
  | { type: "watchlist"; id: string; name: string; itemCount: number };
