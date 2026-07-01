// Konfiguration je Projekt — genau das, was bei Magenta hartkodiert war, wird
// hier reingereicht. So kann jedes MVP das gleiche Paket mit eigenen Werten nutzen.
export type IntakeKind = "bug" | "feature";

export interface FeedbackConfig {
  /** Repo, in dem die Issues angelegt werden, "owner/repo". */
  repo: string;
  /** Projekt-Label, das jede Meldung bekommt, z. B. "app:agency-os". */
  appLabel: string;
  /** Optional: ProjectV2-Board-Node-ID (das gemeinsame MVP-Board). */
  boardProjectId?: string;
  /** Optional: Single-Select-Status-Feld-ID des Boards. */
  statusFieldId?: string;
  /**
   * Optional: Ziel-Spaltenname (zur Laufzeit per Name aufgelöst). Fehlt sie,
   * landet die Karte ohne Status → natürlicher Triage-Eingang.
   */
  columnName?: string;
  /** Env-Variable mit dem GitHub-Token (Default: GH_PROJECT_TOKEN). */
  tokenEnv?: string;
}

export interface IntakeInput {
  kind: IntakeKind;
  /** Freitext der Meldung. */
  text: string;
  /** Optionaler Titel; sonst aus dem Text abgeleitet. */
  title?: string;
  /** Wer meldet (für Transparenz im Issue-Body). */
  submitter?: { name?: string | null; email?: string | null } | null;
}

export interface IntakeResult {
  ok: boolean;
  issueNumber?: number;
  issueUrl?: string;
  error?: string;
}
