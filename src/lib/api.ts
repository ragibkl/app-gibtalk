// The GibTalk symbols API: symbol search and the templates the app offers.
export const API = "https://api.gibtalk.com";
export const MEDIA = `${API}/media/`;

export type TemplateOption = { name: string; description: string; url: string };

export async function getTemplates(): Promise<TemplateOption[]> {
  const res = await fetch(`${API}/api/templates`);
  if (!res.ok) throw new Error(`templates: ${res.status}`);
  return res.json();
}

export async function getTemplate(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`template: ${res.status}`);
  return res.json();
}

export async function searchSymbols(q: string): Promise<string[]> {
  const res = await fetch(
    `${API}/api/symbols/search/?q=${encodeURIComponent(q.trim())}`,
  );
  if (!res.ok) throw new Error(`search: ${res.status}`);
  return ((await res.json()) as { url: string }[]).map((s) => s.url);
}
