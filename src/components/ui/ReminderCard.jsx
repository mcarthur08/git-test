import { useState } from "react";
import { lsGet } from "@/lib/util.js";
import { addReminder } from "@/actions";
import { Icon } from "./Icon.jsx";

export function ReminderCard() {
  const [set, setSet] = useState(() => lsGet("nt70.remind"));
  const [time, setTime] = useState(set || "07:00");
  return (
    <section className="card stack remind">
      <div className="row between">
        <h3>Daily reminder</h3>
        {set ? (
          <span className="chip ok">
            <Icon k="check" /> Added
          </span>
        ) : null}
      </div>
      <p className="small muted">
        Adds a 15-minute event to your calendar every day through Day 70, with a link back here.
      </p>
      <div className="row">
        <label htmlFor="rem-time" className="small">
          Remind me at
        </label>
        <input type="time" id="rem-time" value={time} onChange={e => setTime(e.target.value)} />
        <button className="btn sm" onClick={() => setSet(addReminder("google", time))}>
          Google Calendar
        </button>
        <button className="btn sm" onClick={() => setSet(addReminder("ics", time))}>
          iPhone / Outlook
        </button>
      </div>
    </section>
  );
}
