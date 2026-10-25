import { useEffect, useState } from "react";
import { Icon } from "../icons";
import {
  REWARDS,
  formatPhone,
  formatPoints,
  formatUgx,
  formatWhen,
  initials,
  memberSince,
  pointsValue,
  rewardById,
  type Activity,
} from "./logic";
import { usePumpPerks } from "./PumpPerksProvider";

type Tab = "home" | "rewards" | "activity" | "profile";

export function MotoristApp() {
  const pump = usePumpPerks();
  const { motorist, join, signOut, redeem, state } = pump;
  const [tab, setTab] = useState<Tab>("home");
  const [chosen, setChosen] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const motoristId = motorist?.id ?? null;

  useEffect(() => {
    if (motoristId) setTab("home");
  }, [motoristId]);

  const reward = REWARDS.find((item) => item.id === chosen);
  const issued = state.activity.find((item) => item.code === code);

  const confirm = async () => {
    if (!chosen) return;
    setSaving(true);
    setError("");
    const result = await redeem(chosen);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setCode(result.state.activity.find((item) => item.id === result.activityId)?.code ?? null);
    setChosen(null);
    setTab("rewards");
  };

  if (!motorist) return <JoinScreen join={join} />;

  return (
    <main className="mvp-motorist">
      <div className="mvp-phone">
        <header className="mvp-top">
          <div>
            <small>PUMPPERKS</small>
            <strong>{greeting()}, {motorist.name.split(" ")[0]}</strong>
          </div>
          <span className="mvp-avatar">{initials(motorist.name)}</span>
        </header>
        <div className="mvp-body">
          {tab === "home" && <Home onOpen={setTab} />}
          {tab === "rewards" && (
            <section>
              <h2>Rewards</h2>
              <p className="mvp-lead">You have {motorist.points.toLocaleString("en-US")} points, worth about {formatUgx(pointsValue(motorist.points))}.</p>
              {error && <p className="mvp-error">{error}</p>}
              <div className="mvp-reward-list">
                {REWARDS.map((item) => {
                  const missing = item.cost - motorist.points;
                  return (
                    <article key={item.id}>
                      <div>
                        <b>{item.name}</b>
                        <span>{item.detail}</span>
                        <strong>{item.cost.toLocaleString("en-US")} pts</strong>
                      </div>
                      <button type="button" disabled={missing > 0} onClick={() => { setError(""); setChosen(item.id); }}>
                        {missing > 0 ? `Need ${missing.toLocaleString("en-US")} more` : "Redeem"}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          {tab === "activity" && <ActivityList />}
          {tab === "profile" && (
            <section className="mvp-profile">
              <span className="mvp-avatar large">{initials(motorist.name)}</span>
              <h2>{motorist.name}</h2>
              <p>{formatPhone(motorist.phone)}</p>
              <small>Member since {memberSince(motorist.createdAt)}</small>
              <ul>
                <li>4 points for every UGX 1,000 of fuel.</li>
                <li>1,000 points becomes UGX 5,000 off fuel.</li>
                <li>Give your phone number at any PumpPerks station.</li>
              </ul>
              <button type="button" className="mvp-secondary" onClick={signOut}>Sign out</button>
            </section>
          )}
        </div>
        <nav className="mvp-tabs" aria-label="Motorist sections">
          {([
            ["home", "Home", "home"],
            ["rewards", "Rewards", "gift"],
            ["activity", "Activity", "clock"],
            ["profile", "Profile", "people"],
          ] as const).map(([id, label, icon]) => (
            <button className={tab === id ? "active" : ""} key={id} type="button" onClick={() => setTab(id)}>
              <Icon name={icon} size={18} />
              {label}
            </button>
          ))}
        </nav>
        {reward && (
          <div className="mvp-sheet">
            <div>
              <h2>Use {reward.cost.toLocaleString("en-US")} points?</h2>
              <p>{reward.name}. Points are held until the attendant marks the code as given.</p>
              <div className="mvp-sheet-actions">
                <button type="button" className="mvp-secondary" onClick={() => setChosen(null)}>Cancel</button>
                <button type="button" className="lime-button" disabled={saving} onClick={() => void confirm()}>{saving ? "Reserving…" : "Confirm"}</button>
              </div>
            </div>
          </div>
        )}
        {issued && (
          <div className="mvp-sheet">
            <div>
              <h2>Show this code at the till</h2>
              <p className="mvp-code">{issued.code}</p>
              <p>{rewardById(issued.rewardId)?.name}. The attendant must confirm it before you receive the reward.</p>
              <button type="button" className="lime-button" onClick={() => setCode(null)}>Done</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Home({ onOpen }: { onOpen: (tab: Tab) => void }) {
  const { motorist, state } = usePumpPerks();
  if (!motorist) return null;
  const recent = state.activity.filter((item) => item.customerId === motorist.id).slice(0, 3);
  const next = REWARDS.find((reward) => reward.cost > motorist.points);
  const target = next?.cost ?? motorist.points;
  const progress = target === 0 ? 0 : Math.min(100, Math.round((motorist.points / target) * 100));
  return (
    <section>
      <article className="mvp-balance">
        <small>AVAILABLE POINTS</small>
        <strong>{motorist.points.toLocaleString("en-US")} <i>pts</i></strong>
        <span>About {formatUgx(pointsValue(motorist.points))} in reward value</span>
        {next && (
          <div>
            <i style={{ width: `${progress}%` }} />
            <em>{(next.cost - motorist.points).toLocaleString("en-US")} pts to {next.name}</em>
          </div>
        )}
      </article>
      <div className="mvp-phone-chip">
        <span>Show this number at the pump</span>
        <strong>{formatPhone(motorist.phone)}</strong>
      </div>
      <div className="mvp-section-title">
        <b>Recent activity</b>
        <button type="button" onClick={() => onOpen("activity")}>View all</button>
      </div>
      {recent.length === 0 && <p className="mvp-empty">No fuel purchases yet. Your points will appear here after the attendant records one.</p>}
      <ActivityRows items={recent} />
    </section>
  );
}

function ActivityList() {
  const { motorist, state } = usePumpPerks();
  if (!motorist) return null;
  const items = state.activity.filter((item) => item.customerId === motorist.id);
  return (
    <section>
      <h2>Activity</h2>
      {items.length === 0 && <p className="mvp-empty">When you fuel at a PumpPerks station, the purchase will show up here.</p>}
      <ActivityRows items={items} />
    </section>
  );
}

function ActivityRows({ items }: { items: Activity[] }) {
  return (
    <div className="mvp-activity">
      {items.map((item) => {
        const reward = rewardById(item.rewardId);
        const title = item.kind === "earn" ? item.stationName : reward?.name ?? "Reward";
        const detail = item.kind === "earn"
          ? `${formatWhen(item.createdAt)} · ${formatUgx(item.amountUgx ?? 0)}`
          : `${formatWhen(item.createdAt)} · ${item.status === "used" ? "Collected" : `Code ${item.code} · waiting at the till`}`;
        return (
          <article key={item.id}>
            <span><Icon name={item.kind === "earn" ? "station" : "gift"} size={16} /></span>
            <div><b>{title}</b><small>{detail}</small></div>
            <strong className={item.kind === "earn" ? "plus" : "minus"}>{formatPoints(item.kind, item.points)}</strong>
          </article>
        );
      })}
    </div>
  );
}

function JoinScreen({ join }: { join: (name: string, phone: string) => Promise<string | null> }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (nextName: string, nextPhone: string) => {
    setSaving(true);
    setError("");
    const message = await join(nextName, nextPhone);
    setSaving(false);
    if (message) setError(message);
  };

  return (
    <main className="mvp-motorist">
      <form className="mvp-phone mvp-join" onSubmit={(event) => { event.preventDefault(); void submit(name, phone); }}>
        <span className="section-tag">MOTORIST ACCOUNT</span>
        <h1>Earn points on every fill-up.</h1>
        <p>Use the mobile number the attendant will enter at the station. No card is required.</p>
        <label className="mvp-field">Full name
          <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Amina Nakiwala" />
        </label>
        <label className="mvp-field">Mobile number
          <input autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0772 000 111" />
        </label>
        {error && <p className="mvp-error">{error}</p>}
        <button className="lime-button large" type="submit" disabled={saving}>{saving ? "Opening account…" : "Join PumpPerks"}</button>
        <button className="mvp-secondary" type="button" disabled={saving} onClick={() => void submit("Andrew Kato", "0756 365 310")}>
          Open Andrew Kato’s demo account
        </button>
        <small>4 points for every UGX 1,000. Sample customer Andrew already has 2,480 points.</small>
      </form>
    </main>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
