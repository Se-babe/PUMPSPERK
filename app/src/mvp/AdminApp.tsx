import { useState, type FormEvent } from "react";
import { Icon, type IconName } from "../icons";
import {
  STATION_NAME,
  customerById,
  formatPhone,
  formatUgx,
  formatWhen,
  initials,
  isValidName,
  metrics,
  pointsValue,
  rewardById,
  type Reward,
} from "./logic";
import { usePumpPerks } from "./PumpPerksProvider";

const ADMIN_KEY = "pumpperks-mvp-admin";
const ADMIN_CODE = "4482";

type Section = "Overview" | "Customers" | "Rewards" | "Redemptions" | "System";

const NAV: [IconName, Section][] = [
  ["dashboard", "Overview"],
  ["people", "Customers"],
  ["gift", "Rewards"],
  ["check", "Redemptions"],
  ["settings", "System"],
];

export function AdminApp() {
  const [adminName, setAdminName] = useState<string | null>(() => readAdmin());
  if (!adminName) return <AdminLogin onSuccess={setAdminName} />;
  return <AdminDesk name={adminName} onLogout={() => { localStorage.removeItem(ADMIN_KEY); setAdminName(null); }} />;
}

function AdminDesk({ name, onLogout }: { name: string; onLogout: () => void }) {
  const { state, adjustPoints, updateReward, confirmRedemption, resetDemo } = usePumpPerks();
  const [section, setSection] = useState<Section>("Overview");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const pending = state.activity.filter((item) => item.kind === "redeem" && item.status === "pending");
  const snapshot = metrics(state);
  const held = state.customers.reduce((sum, customer) => sum + customer.points, 0);

  const confirm = async (activityId: string) => {
    setSaving(true);
    const result = await confirmRedemption(activityId);
    setSaving(false);
    const item = result.state.activity.find((entry) => entry.id === activityId);
    const customer = item ? customerById(result.state, item.customerId) : undefined;
    setNotice(result.error ?? `${item?.code} marked as given${customer ? ` to ${customer.name}` : ""}.`);
    setSection("Redemptions");
  };

  const adjust = async (phone: string, points: number, note: string) => {
    setSaving(true);
    const result = await adjustPoints(phone, points, note);
    setSaving(false);
    const customer = result.state.customers.find((item) => item.phone.endsWith(phone.replace(/\D/g, "").slice(-9)));
    setNotice(result.error ?? `${customer?.name ?? "Customer"} now has ${customer?.points.toLocaleString("en-US") ?? "an updated"} points.`);
  };

  const saveReward = async (rewardId: string, cost: number, active: boolean) => {
    setSaving(true);
    const result = await updateReward(rewardId, cost, active);
    setSaving(false);
    const reward = result.state.rewards.find((item) => item.id === rewardId);
    setNotice(result.error ?? `${reward?.name ?? "Reward"} saved.`);
  };

  const reset = async () => {
    if (!window.confirm("Restore the sample customers, rewards, and points? Test purchases will be removed.")) return;
    setSaving(true);
    const result = await resetDemo();
    setSaving(false);
    setNotice(result.error ?? "Sample data restored.");
  };

  return (
    <main className="station-app mvp-station">
      <aside className="station-sidebar">
        <div className="brand brand-light"><span className="brand-symbol"><Icon name="bolt" size={17} /></span><span>Pump<span>Perks</span></span></div>
        <div className="station-profile"><span>AD</span><div><b>Admin</b><small>{STATION_NAME} · Pilot</small></div></div>
        <nav>
          {NAV.map(([icon, label]) => (
            <button className={section === label ? "active" : ""} key={label} type="button" onClick={() => setSection(label)}>
              <Icon name={icon} size={18} />
              {label}
              {label === "Redemptions" && pending.length > 0 && <em className="nav-badge">{pending.length}</em>}
            </button>
          ))}
        </nav>
        <div className="station-user">
          <span>{initials(name)}</span>
          <div><b>{name}</b><small>System admin</small></div>
          <button type="button" onClick={onLogout}>Log out</button>
        </div>
      </aside>
      <section className="station-main">
        <header>
          <div>
            <small>ADMIN / {section.toUpperCase()}</small>
            <h1>{section}</h1>
          </div>
        </header>
        {notice && <button className="station-notice" type="button" onClick={() => setNotice("")}><Icon name="check" />{notice}<span>×</span></button>}
        {section === "Overview" && (
          <>
            <div className="full-metrics">
              <article><div><span>Customers</span><Icon name="people" size={18} /></div><strong>{snapshot.customers}</strong><small>Accounts on this pilot</small></article>
              <article><div><span>Points held</span><Icon name="gift" size={18} /></div><strong>{held.toLocaleString("en-US")}</strong><small>About {formatUgx(pointsValue(held))} in value</small></article>
              <article><div><span>Fuel recorded</span><Icon name="chart" size={18} /></div><strong>{formatUgx(snapshot.revenue)}</strong><small>{snapshot.transactions} fill-ups</small></article>
              <article><div><span>Waiting at the till</span><Icon name="check" size={18} /></div><strong>{pending.length}</strong><small>Reward codes not yet given</small></article>
            </div>
            <div className="recent-panel">
              <div className="panel-title"><div><span>CONTROL</span><h3>What admin can change</h3></div></div>
              <ul className="mvp-plan">
                <li>Correct a customer’s points, with a reason they can see in Activity.</li>
                <li>Change a reward’s point cost, or turn it off so motorists cannot redeem it.</li>
                <li>Mark a reward code as given, and restore the sample data for a new test.</li>
              </ul>
            </div>
          </>
        )}
        {section === "Customers" && <CustomerControl stateCustomers={state.customers} saving={saving} onAdjust={adjust} />}
        {section === "Rewards" && (
          <div className="pending-list">
            {state.rewards.map((reward) => (
              <RewardRow key={reward.id} reward={reward} saving={saving} onSave={saveReward} />
            ))}
          </div>
        )}
        {section === "Redemptions" && (
          <div className="pending-list">
            <h3>Codes waiting to be given</h3>
            {pending.length === 0 && <p className="mvp-empty">No reward is waiting at the till.</p>}
            {pending.map((item) => {
              const customer = customerById(state, item.customerId);
              return (
                <article key={item.id}>
                  <div>
                    <b>{item.code} · {rewardById(item.rewardId)?.name ?? "Reward"}</b>
                    <span>{customer?.name ?? "Customer"} · {customer ? formatPhone(customer.phone) : ""}</span>
                    <small>{formatWhen(item.createdAt)} · {item.points.toLocaleString("en-US")} points</small>
                  </div>
                  <button className="lime-button" type="button" disabled={saving} onClick={() => void confirm(item.id)}>Mark as given</button>
                </article>
              );
            })}
          </div>
        )}
        {section === "System" && (
          <article className="campaign-page">
            <article>
              <span className="section-tag">PILOT CONTROLS</span>
              <h2>Restore the sample system</h2>
              <p>This puts Andrew, Sarah, Moses, and Joan back to their sample balances and turns the three rewards on at their original costs. Purchases from this test are removed.</p>
              <button className="lime-button" type="button" disabled={saving} onClick={() => void reset()}>Restore sample data</button>
            </article>
          </article>
        )}
      </section>
    </main>
  );
}

function CustomerControl({
  stateCustomers,
  saving,
  onAdjust,
}: {
  stateCustomers: { id: string; name: string; phone: string; points: number }[];
  saving: boolean;
  onAdjust: (phone: string, points: number, note: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(stateCustomers[0]?.id ?? "");
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const needle = query.trim().toLowerCase();
  const customers = stateCustomers.filter((customer) => {
    if (!needle) return true;
    return customer.name.toLowerCase().includes(needle) || customer.phone.includes(needle.replace(/\s/g, ""));
  });
  const customer = stateCustomers.find((item) => item.id === selected) ?? customers[0];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!customer) return;
    setError("");
    const delta = Number(points);
    if (!Number.isFinite(delta) || delta === 0) {
      setError("Enter how many points to add or remove, such as 200 or -50.");
      return;
    }
    await onAdjust(customer.phone, delta, note);
    setPoints("");
    setNote("");
  };

  return (
    <div className="admin-customers">
      <label className="mvp-field">Find a customer
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or phone" />
      </label>
      <div className="admin-customer-list">
        {customers.map((item) => (
          <button className={customer?.id === item.id ? "active" : ""} key={item.id} type="button" onClick={() => setSelected(item.id)}>
            <b>{item.name}</b>
            <span>{formatPhone(item.phone)}</span>
            <strong>{item.points.toLocaleString("en-US")} pts</strong>
          </button>
        ))}
      </div>
      {customer && (
        <form className="pending-list" onSubmit={(event) => void submit(event)}>
          <h3>{customer.name}</h3>
          <p>{formatPhone(customer.phone)} · {customer.points.toLocaleString("en-US")} points now · about {formatUgx(pointsValue(customer.points))}</p>
          <label className="mvp-field">Points to add or remove
            <input inputMode="numeric" value={points} onChange={(event) => setPoints(event.target.value)} placeholder="200 or -50" />
          </label>
          <label className="mvp-field">Reason the customer will see
            <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Test correction" />
          </label>
          {error && <p className="mvp-error">{error}</p>}
          <button className="lime-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Update points"}</button>
        </form>
      )}
    </div>
  );
}

function RewardRow({
  reward,
  saving,
  onSave,
}: {
  reward: Reward;
  saving: boolean;
  onSave: (rewardId: string, cost: number, active: boolean) => Promise<void>;
}) {
  const [cost, setCost] = useState(String(reward.cost));
  const [active, setActive] = useState(reward.active);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next = Number(cost);
    if (!Number.isFinite(next)) {
      setError("Enter the cost in points.");
      return;
    }
    setError("");
    await onSave(reward.id, next, active);
  };

  return (
    <form onSubmit={(event) => void submit(event)}>
      <div>
        <b>{reward.name}</b>
        <span>{reward.detail}</span>
      </div>
      <label className="mvp-field">Cost in points
        <input inputMode="numeric" value={cost} onChange={(event) => setCost(event.target.value)} />
      </label>
      <label className="admin-check">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
        Open for motorists
      </label>
      {error && <p className="mvp-error">{error}</p>}
      <button className="lime-button" type="submit" disabled={saving}>Save reward</button>
    </form>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: (name: string) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextName = name.trim().replace(/\s+/g, " ");
    if (!isValidName(nextName)) {
      setError("Enter your name using letters only.");
      return;
    }
    if (code.trim() !== ADMIN_CODE) {
      setError("That admin code is not correct. Use 4482 for this test.");
      return;
    }
    localStorage.setItem(ADMIN_KEY, JSON.stringify({ name: nextName }));
    onSuccess(nextName);
  };

  return (
    <main className="mvp-staff-gate">
      <form className="mvp-staff-card" onSubmit={submit}>
        <span className="section-tag">ADMIN</span>
        <h1>Control the pilot.</h1>
        <p>Adjust points, open or close rewards, and restore the sample data. Customers still only see their own balance.</p>
        <label className="mvp-field">Your name
          <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Andrew Kato" />
        </label>
        <label className="mvp-field">Admin code
          <input inputMode="numeric" autoComplete="off" value={code} onChange={(event) => setCode(event.target.value)} placeholder="4482" />
        </label>
        {error && <p className="mvp-error">{error}</p>}
        <button className="lime-button large" type="submit">Log in</button>
        <small>This test uses admin code {ADMIN_CODE}. The station attendant code is still 2048.</small>
      </form>
    </main>
  );
}

function readAdmin() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { name?: string };
    return data.name && isValidName(data.name) ? data.name : null;
  } catch {
    return null;
  }
}
