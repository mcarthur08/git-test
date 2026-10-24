import { TOTAL } from "@/lib/data.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { Meter } from "@/components/ui/Meter.jsx";

// One line of numbers and the main progress bar.
export default function ProgressSummary({ s }) {
  const pct = Math.round((s.chapters / TOTAL) * 100);
  return (
    <section className="prog" aria-label="Your progress">
      <div className="prog-line">
        <span>
          <b>{s.n}</b> of 70 days
        </span>
        <span>
          <Icon k="flame" /> <b>{s.streak}-day</b> streak
        </span>
        <span>
          <b>{pct}%</b> of the New Testament
        </span>
      </div>
      <Meter
        k="m-main"
        pct={(s.chapters / TOTAL) * 100}
        role="img"
        aria-label={`${s.chapters} of 260 chapters`}
      />
    </section>
  );
}
