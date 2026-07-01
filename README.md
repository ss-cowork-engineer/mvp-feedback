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

## Runtime-Voraussetzung
`GH_PROJECT_TOKEN` (oder `config.tokenEnv`) = GitHub-Token mit `repo` (+ `project` fürs Board)
als Server-Env (z. B. Vercel). Ohne Token: still no-op (best-effort).

## Wiederverwendbarkeit
- Kein hartkodiertes Repo/Board — alles Config.
- Getrennte Entry-Points: `mvp-feedback` (Client-Widget) · `mvp-feedback/server` (Intake).
- Später als GitHub-Packages-npm-Paket veröffentlichbar (`publishConfig` gesetzt).
