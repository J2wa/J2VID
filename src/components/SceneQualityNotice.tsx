export function SceneQualityNotice({ warnings }: { warnings?: string[] }) {
  if (!warnings?.length) return null;
  return <aside aria-label="Description quality review" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
    <p className="font-semibold">Review repeated wording</p>
    <ul className="mt-2 list-disc pl-5 space-y-1">{warnings.map(message => <li key={message}>{message}</li>)}</ul>
    <p className="mt-2 text-xs">Suggested review only. Similar scenes may legitimately share details.</p>
  </aside>;
}
