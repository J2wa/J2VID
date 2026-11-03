import { Loader2 } from 'lucide-react';
export function ProcessingScreen({ step }: { step: string }) {
  return <section className="aces-loading" role="status" aria-live="polite" aria-busy="true">
    <Loader2 className="animate-spin" size={40} aria-hidden="true"/>
    <p className="aces-eyebrow">ACES VIDEO</p><h2>Processing your upload</h2><p>{step}</p>
    <small>Please keep this tab open.</small>
  </section>;
}
