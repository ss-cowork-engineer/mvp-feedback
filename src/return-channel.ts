// ============================================================
// Rückkanal-Domänenlogik (opt-in, aus Magenta OS #668/#1257/#1431 extrahiert).
// FRAMEWORK-AGNOSTISCH: keine DB, kein React, kein GitHub — nur reine,
// unit-testbare Ableitungen. Consumer (Magenta, Agency OS …) verdrahten diese
// Logik mit ihrer eigenen Persistenz (Slice 13.2: FeedbackStore-Adapter).
//
// Zwei Bausteine:
//   1) Status-Mapping: Board-Spalte → nutzerfreundliche Einreicher-Stufe.
//   2) Rückfrage-Overlay: offene Team-Rückfrage überlagert den Status
//      („awaitingReply" = Einreicher ist am Zug).
// ============================================================

// Nutzerfreundliche Status-Stufe eines eingereichten Requests (i18n-Key, kein
// harter Text). „awaitingReply" ist ein Overlay (kommt nicht vom Board).
export type RequestStatusKey =
  | "pending"
  | "received"
  | "planned"
  | "inProgress"
  | "awaitingReply"
  | "inReview"
  | "done"
  | "deferred"
  | "closed";

// Anzeige-Reihenfolge (Fortschritt aufsteigend).
export const REQUEST_STATUS_ORDER: RequestStatusKey[] = [
  "pending",
  "received",
  "planned",
  "inProgress",
  "awaitingReply",
  "inReview",
  "done",
  "deferred",
  "closed",
];

// Standard-Mapping Board-Spaltenname → Status. Bewusst als exportierte Default-
// Konstante, damit Consumer sie per Option überschreiben/erweitern können (andere
// Boards haben andere Spaltennamen).
export const DEFAULT_COLUMN_TO_STATUS: Record<string, RequestStatusKey> = {
  "User Request": "received",
  New: "received",
  Request: "received",
  Next: "planned",
  Todo: "planned",
  "In Progress": "inProgress",
  "Review (DEV)": "inReview",
  "Review (TEST)": "inReview",
  "Done (PROD)": "done",
  Done: "done",
  Someday: "deferred",
};

// Bildet (Board-Spalte, Issue offen/zu) auf die Einreicher-Stufe ab.
//  - Spalte null/leer/unbekannt → noch kein bekannter Board-Status → "pending".
//  - Issue geschlossen, aber NICHT "done": als abgelehnt/erledigt werten ("closed").
export function mapRequestStatus(
  columnName: string | null | undefined,
  opts?: { issueClosed?: boolean; columnMap?: Record<string, RequestStatusKey> },
): RequestStatusKey {
  const map = opts?.columnMap ?? DEFAULT_COLUMN_TO_STATUS;
  const mapped = columnName ? map[columnName] : undefined;
  if (opts?.issueClosed && mapped !== "done") return "closed";
  return mapped ?? "pending";
}

// ------------------------------------------------------------
// Rückfrage-Thread (bidirektional)
// ------------------------------------------------------------

export type ClarificationDirection = "to_user" | "to_team";

export type ClarificationMessage = {
  direction: ClarificationDirection;
  createdAt: Date;
};

// Ein Thread wartet auf eine Antwort des Einreichers, wenn die CHRONOLOGISCH
// LETZTE Nachricht eine `to_user`-Frage ist (keine spätere `to_team`-Antwort).
// Leerer Thread → false.
export function hasOpenClarification(messages: ClarificationMessage[]): boolean {
  let last: ClarificationMessage | undefined;
  for (const m of messages) {
    if (!last || m.createdAt.getTime() > last.createdAt.getTime()) last = m;
  }
  return last?.direction === "to_user";
}

// Overlay: offener `to_user`-Thread → "awaitingReply", sonst board-abgeleiteter
// Status unverändert.
export function overlayStatus(
  boardStatus: RequestStatusKey,
  messages: ClarificationMessage[],
): RequestStatusKey {
  return hasOpenClarification(messages) ? "awaitingReply" : boardStatus;
}

// Aus einer flachen Liste von Thread-Nachrichten (beliebige Herkunft) die
// Schlüssel (`${kind}-${requestId}`) mit OFFENER Rückfrage bestimmen — für den
// Batch-Fall „Overlay über viele Requests" (wie Magentas getOpenClarificationKeys).
export function openClarificationKeys<
  T extends { kind: string; requestId: string; direction: ClarificationDirection; createdAt: Date },
>(messages: T[]): Set<string> {
  const latest = new Map<string, T>();
  for (const m of messages) {
    const key = `${m.kind}-${m.requestId}`;
    const cur = latest.get(key);
    if (!cur || m.createdAt.getTime() > cur.createdAt.getTime()) latest.set(key, m);
  }
  const open = new Set<string>();
  for (const [key, m] of latest) {
    if (m.direction === "to_user") open.add(key);
  }
  return open;
}
