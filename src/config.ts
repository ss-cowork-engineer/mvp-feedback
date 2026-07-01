// Konfiguration je Projekt — genau das, was bei Magenta hartkodiert war, wird
// hier reingereicht. So kann jedes MVP das gleiche Paket mit eigenen Werten nutzen.
export type IntakeKind = "bug" | "feature";

// Ein Intake-Ziel (Repo + Label + optional Board). Wird sowohl für die App als
// auch für das „Plattform"-Ziel (das Paket-Repo selbst) benutzt.
export interface IntakeTarget {
  /** Repo, in dem die Issues angelegt werden, "owner/repo". */
  repo: string;
  /** Projekt-Label, das jede Meldung bekommt, z. B. "app:agency-os". */
  appLabel: string;
  /** Optional: ProjectV2-Board-Node-ID. */
  boardProjectId?: string;
  /** Optional: Single-Select-Status-Feld-ID des Boards. */
  statusFieldId?: string;
  /** Optional: Ziel-Spaltenname (zur Laufzeit per Name aufgelöst). */
  columnName?: string;
}

export interface FeedbackConfig extends IntakeTarget {
  /**
   * Optional: Ziel für „betrifft die Plattform/das Feedback-Tool selbst".
   * So fließen FRs ÜBER die Komponente automatisch ins Paket-Repo statt in die
   * App — kein Project-Lead-Briefing nötig, das Tool routet selbst (Dogfooding).
   */
  platform?: IntakeTarget;
  /** Env-Variable mit dem GitHub-Token (Default: GH_PROJECT_TOKEN). */
  tokenEnv?: string;
}

export type FeedbackScope = "app" | "platform";

export interface IntakeInput {
  kind: IntakeKind;
  /** Freitext der Meldung. */
  text: string;
  /** Optionaler Titel; sonst aus dem Text abgeleitet. */
  title?: string;
  /** Wer meldet (für Transparenz im Issue-Body). */
  submitter?: { name?: string | null; email?: string | null } | null;
  /**
   * "app" (Default) = betrifft die App → App-Ziel. "platform" = betrifft das
   * Feedback-Tool selbst → wird ins Paket-Repo (config.platform) geroutet.
   * Fällt auf das App-Ziel zurück, wenn kein platform-Ziel konfiguriert ist.
   */
  scope?: FeedbackScope;
}

export interface IntakeResult {
  ok: boolean;
  issueNumber?: number;
  issueUrl?: string;
  error?: string;
}
