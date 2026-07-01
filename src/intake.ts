import type { FeedbackConfig, IntakeInput, IntakeResult } from "./config";

// ============================================================
// Generischer GitHub-Intake (aus dem Magenta-OS-Muster extrahiert, aber
// vollständig CONFIG-getrieben — keine hartkodierten Repo-/Board-IDs).
// Best-effort: wirft nie; ohne Token oder bei Teil-Fehlern still degradieren.
// Nur serverseitig aufrufen (nutzt den Token aus process.env).
// ============================================================

type GhJson = Record<string, unknown>;

async function ghRest(
  token: string,
  method: "GET" | "POST",
  path: string,
  body?: GhJson,
): Promise<GhJson | null> {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as GhJson;
  } catch {
    return null;
  }
}

async function ghGraphql(token: string, query: string, variables: GhJson): Promise<GhJson | null> {
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: GhJson; errors?: unknown };
    return json.errors ? null : (json.data ?? null);
  } catch {
    return null;
  }
}

// Label anlegen, falls es nicht existiert (idempotent, best-effort).
async function ensureLabel(token: string, repo: string, name: string, color: string) {
  const exists = await ghRest(token, "GET", `/repos/${repo}/labels/${encodeURIComponent(name)}`);
  if (exists) return;
  await ghRest(token, "POST", `/repos/${repo}/labels`, { name, color });
}

async function resolveColumnOptionId(
  token: string,
  statusFieldId: string,
  columnName: string,
): Promise<string | null> {
  const data = await ghGraphql(
    token,
    `query($id: ID!){ node(id:$id){ ... on ProjectV2SingleSelectField { options { id name } } } }`,
    { id: statusFieldId },
  );
  const options =
    ((data?.node as GhJson | undefined)?.options as { id: string; name: string }[] | undefined) ?? [];
  return options.find((o) => o.name === columnName)?.id ?? null;
}

function deriveTitle(input: IntakeInput): string {
  if (input.title?.trim()) return input.title.trim().slice(0, 120);
  const prefix = input.kind === "bug" ? "Bug" : "Feature";
  const firstLine = input.text.trim().split("\n")[0].slice(0, 80);
  return `[${prefix}] ${firstLine || "Meldung"}`;
}

function buildBody(input: IntakeInput): string {
  const s = input.submitter;
  const who = s?.name ? `${s.name}${s.email ? ` (${s.email})` : ""}` : (s?.email ?? "anonym");
  return `${input.text}\n\n---\n_In-App-Meldung von ${who}._`;
}

export async function submitFeedback(config: FeedbackConfig, input: IntakeInput): Promise<IntakeResult> {
  const token = process.env[config.tokenEnv ?? "GH_PROJECT_TOKEN"];
  if (!token) return { ok: false, error: "no token configured" };
  if (!input.text?.trim()) return { ok: false, error: "empty text" };

  const typeLabel = input.kind === "bug" ? "type:bug" : "type:feature";
  // Labels sicherstellen (Farben: bug=rot, feature=blau, app=magenta).
  await ensureLabel(token, config.repo, typeLabel, input.kind === "bug" ? "d73a4a" : "0e8a16");
  await ensureLabel(token, config.repo, config.appLabel, "e20074");

  // 1) Issue anlegen.
  const issue = await ghRest(token, "POST", `/repos/${config.repo}/issues`, {
    title: deriveTitle(input),
    body: buildBody(input),
    labels: [typeLabel, config.appLabel],
  });
  const contentId = issue?.node_id as string | undefined;
  const number = issue?.number as number | undefined;
  const htmlUrl = issue?.html_url as string | undefined;
  if (!contentId || !number || !htmlUrl) return { ok: false, error: "issue creation failed" };
  const result: IntakeResult = { ok: true, issueNumber: number, issueUrl: htmlUrl };

  // 2) Aufs Board (optional, best-effort).
  if (!config.boardProjectId) return result;
  const added = await ghGraphql(
    token,
    `mutation($p:ID!,$c:ID!){ addProjectV2ItemById(input:{projectId:$p,contentId:$c}){ item { id } } }`,
    { p: config.boardProjectId, c: contentId },
  );
  const itemId = ((added?.addProjectV2ItemById as GhJson | undefined)?.item as GhJson | undefined)?.id as
    | string
    | undefined;
  if (!itemId || !config.statusFieldId || !config.columnName) return result;

  // 3) Ziel-Spalte setzen (per Name aufgelöst; fehlt sie → ohne Status).
  const optionId = await resolveColumnOptionId(token, config.statusFieldId, config.columnName);
  if (!optionId) return result;
  await ghGraphql(
    token,
    `mutation($p:ID!,$i:ID!,$f:ID!,$o:String!){ updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,value:{singleSelectOptionId:$o}}){ projectV2Item { id } } }`,
    { p: config.boardProjectId, i: itemId, f: config.statusFieldId, o: optionId },
  );
  return result;
}
