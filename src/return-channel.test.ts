import { describe, it, expect } from "vitest";
import {
  mapRequestStatus,
  hasOpenClarification,
  overlayStatus,
  openClarificationKeys,
  REQUEST_STATUS_ORDER,
  DEFAULT_COLUMN_TO_STATUS,
} from "./return-channel";

const d = (iso: string) => new Date(iso);

describe("mapRequestStatus", () => {
  it("mappt bekannte Board-Spalten", () => {
    expect(mapRequestStatus("User Request")).toBe("received");
    expect(mapRequestStatus("In Progress")).toBe("inProgress");
    expect(mapRequestStatus("Done (PROD)")).toBe("done");
    expect(mapRequestStatus("Someday")).toBe("deferred");
  });
  it("unbekannt/leer → pending", () => {
    expect(mapRequestStatus(null)).toBe("pending");
    expect(mapRequestStatus("")).toBe("pending");
    expect(mapRequestStatus("Nonsense")).toBe("pending");
  });
  it("geschlossenes Issue ohne done → closed, mit done bleibt done", () => {
    expect(mapRequestStatus("In Progress", { issueClosed: true })).toBe("closed");
    expect(mapRequestStatus("Done (PROD)", { issueClosed: true })).toBe("done");
  });
  it("respektiert eine eigene columnMap", () => {
    expect(mapRequestStatus("Backlog", { columnMap: { Backlog: "planned" } })).toBe("planned");
  });
});

describe("hasOpenClarification", () => {
  it("leer → false", () => {
    expect(hasOpenClarification([])).toBe(false);
  });
  it("letzte Nachricht to_user → true", () => {
    expect(
      hasOpenClarification([
        { direction: "to_user", createdAt: d("2026-01-01") },
        { direction: "to_team", createdAt: d("2026-01-02") },
        { direction: "to_user", createdAt: d("2026-01-03") },
      ]),
    ).toBe(true);
  });
  it("letzte Nachricht to_team → false (beantwortet)", () => {
    expect(
      hasOpenClarification([
        { direction: "to_user", createdAt: d("2026-01-01") },
        { direction: "to_team", createdAt: d("2026-01-02") },
      ]),
    ).toBe(false);
  });
  it("nutzt Zeitstempel, nicht Array-Reihenfolge", () => {
    expect(
      hasOpenClarification([
        { direction: "to_team", createdAt: d("2026-01-05") },
        { direction: "to_user", createdAt: d("2026-01-01") },
      ]),
    ).toBe(false);
  });
});

describe("overlayStatus", () => {
  it("offene Rückfrage überlagert mit awaitingReply", () => {
    expect(overlayStatus("planned", [{ direction: "to_user", createdAt: d("2026-01-01") }])).toBe(
      "awaitingReply",
    );
  });
  it("kein offener Thread → board-Status bleibt", () => {
    expect(overlayStatus("planned", [])).toBe("planned");
    expect(
      overlayStatus("inProgress", [
        { direction: "to_user", createdAt: d("2026-01-01") },
        { direction: "to_team", createdAt: d("2026-01-02") },
      ]),
    ).toBe("inProgress");
  });
});

describe("openClarificationKeys (Batch)", () => {
  it("liefert nur Schlüssel mit offener to_user-Rückfrage", () => {
    const keys = openClarificationKeys([
      { kind: "feature", requestId: "a", direction: "to_user", createdAt: d("2026-01-01") },
      { kind: "feature", requestId: "a", direction: "to_team", createdAt: d("2026-01-02") }, // beantwortet
      { kind: "bug", requestId: "b", direction: "to_user", createdAt: d("2026-01-03") }, // offen
    ]);
    expect(keys.has("feature-a")).toBe(false);
    expect(keys.has("bug-b")).toBe(true);
    expect(keys.size).toBe(1);
  });
});

describe("Invarianten", () => {
  it("REQUEST_STATUS_ORDER ist duplikatfrei und enthält awaitingReply", () => {
    expect(new Set(REQUEST_STATUS_ORDER).size).toBe(REQUEST_STATUS_ORDER.length);
    expect(REQUEST_STATUS_ORDER).toContain("awaitingReply");
  });
  it("jede Default-Spalte mappt auf einen gültigen Status", () => {
    for (const status of Object.values(DEFAULT_COLUMN_TO_STATUS)) {
      expect(REQUEST_STATUS_ORDER).toContain(status);
    }
  });
});
