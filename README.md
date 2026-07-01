# mvp-feedback

Wiederverwendbares Feedback-Widget (Bug/Feature) für die **drivenbysun MVP-Factory**.
Eine In-App-Meldung wird als **GitHub-Issue** angelegt (Labels `type:bug`/`type:feature`
+ ein Projekt-Label wie `app:agency-os`) und best-effort aufs gemeinsame **MVP-Board**
gelegt. Alles Projektspezifische kommt als **Config** rein — kein hartkodierter Wert.

## Nutzung (jedes MVP)

`package.json` (via git-Dependency, keine Registry nötig):
```json
"dependencies": { "mvp-feedback": "github:ss-cowork-engineer/mvp-feedback" }
```
`next.config.ts`:
```ts
const nextConfig = { transpilePackages: ["mvp-feedback"] };
```

**Server-Action** (bindet Config + „wer meldet" ein):
```ts
"use server";
import { submitFeedback } from "mvp-feedback/server";
export async function sendFeedback(fd: FormData) {
  const session = await getSession();
  await submitFeedback(
    {
      repo: "drivenbysun/agency-os",
      appLabel: "app:agency-os",
      boardProjectId: "PVT_...",        // gemeinsames MVP-Board (optional)
      statusFieldId: "PVTSSF_...",       // optional
      columnName: "Todo",                // optional (per Name aufgelöst)
    },
    {
      kind: fd.get("kind") === "bug" ? "bug" : "feature",
      text: String(fd.get("text") ?? ""),
      attachments: await attachmentsFromFormData(fd),   // optional, s. u.
      submitter: session ? { name: session.name, email: session.email } : null,
    },
  );
}
```

**Widget** (Client, im Layout):
```tsx
import { FeedbackWidget } from "mvp-feedback";
import { sendFeedback } from "./feedback-action";
<FeedbackWidget action={sendFeedback} brandColor="#e20074" />
```

## Datei-Anhänge (Screenshots etc.)
Das Widget hat ein Datei-Feld. Anhänge werden als **GitHub-Release-Assets** am Release
`feedback-attachments` hochgeladen (Tag via `attachmentReleaseTag` überschreibbar) und im
Issue-Body verlinkt — bei öffentlichen Repos als **Inline-Bild**, bei privaten als
**klickbarer Link** (für eingeloggte Board-Mitglieder). **Kein Repo-Commit → kein Deploy.**
So reisen Anhänge mit aufs Board, ohne separaten App-Login (der alte Magenta-Bug).

Consumer-Seite: `attachmentsFromFormData(fd)` zieht die Dateien aus dem FormData (Base64,
Grenzen 5×10 MB). **Wichtig:** Next.js begrenzt Server-Action-Bodies auf 1 MB — im
Consumer hochsetzen:
```ts
const nextConfig = {
  transpilePackages: ["mvp-feedback"],
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};
```

## Runtime-Voraussetzung
`GH_PROJECT_TOKEN` (oder `config.tokenEnv`) = GitHub-Token mit `repo` (+ `project` fürs Board;
`contents`/Releases-Schreibrecht für Anhänge) als Server-Env (z. B. Vercel). Ohne Token:
still no-op (best-effort).

## Wiederverwendbarkeit
- Kein hartkodiertes Repo/Board — alles Config.
- Getrennte Entry-Points: `mvp-feedback` (Client-Widget) · `mvp-feedback/server` (Intake).
- Später als GitHub-Packages-npm-Paket veröffentlichbar (`publishConfig` gesetzt).
