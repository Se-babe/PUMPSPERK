import { useState, type FormEvent } from "react";
import { Icon, type IconName } from "../icons";
import {
  REWARDS,
  STATION_NAME,
  customerById,
  dailyEarnCounts,
  formatPhone,
  formatPoints,
  formatUgx,
  formatWhen,
  initials,
  isValidName,
  memberSince,
  metrics,
  normalizePhone,
  pointsForAmount,
  rewardById,
  segment,
  totalSpend,
  visitCount,
  type Activity,
  type Fuel,
  type State,
} from "./logic";
import { usePumpPerks } from "./PumpPerksProvider";

const STAFF_KEY = "pumpperks-mvp-staff";
const PILOT_CODE = "2048";

type Section = "Overview" | "Transactions" | "Customers" | "Rewards" | "Campaigns";

const NAV: [IconName, Section][] = [
  ["dashboard", "Overview"],
  ["wallet", "Transactions"],
  ["people", "Customers"],
  ["gift", "Rewards"],
  ["send", "Campaigns"],
];

export function StationApp() {
  const [staffName, setStaffName] = useState<string | null>(() => readStaff());
  if (!staffName) return <StaffLogin onSuccess={setStaffName} />;
  return <StationDesk staffName={staffName} onLogout={() => { localStorage.removeItem(STAFF_KEY); setStaffName(null); }} />;
}

function StaffLogin({ onSuccess }: { onSuccess: (name: string) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextName = name.trim().replace(/\s+/g, " ");
    if (!isValidName(nextName)) {
      setError("Enter the attendant’s name using letters only.");
      return;
    }
    if (code.trim() !== PILOT_CODE) {
      setError("That pilot code is not correct. Use 2048 for this test.");
      return;
    }
    localStorage.setItem(STAFF_KEY, JSON.stringify({ name: nextName }));
    onSuccess(nextName);
  };

  return (
    <main className="mvp-staff-gate">
      <form className="mvp-staff-card" onSubmit={submit}>
        <span className="section-tag">STATION PORTAL</span>
        <h1>Log in as the attendant.</h1>
        <p>Record purchases and confirm rewards only after you log in. Log out when you leave the till.</p>
        <label className="mvp-field">Attendant name
          <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Amina Nakiwala" />
        </label>
        <label className="mvp-field">Pilot code
          <input inputMode="numeric" autoComplete="off" value={code} onChange={(event) => setCode(event.target.value)} placeholder="2048" />
        </label>
        {error && <p className="mvp-error">{error}</p>}
        <button className="lime-button large" type="submit">Log in</button>
        <small>This test uses pilot code {PILOT_CODE}. Logging out does not delete customer points.</small>
      </form>
    </main>
  );
}

function readStaff() {
  try {
    const raw = localStorage.getItem(STAFF_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { name?: string };
    return data.name && isValidName(data.name) ? data.name : null;
  } catch {
    return null;
  }
}

function StationDesk({ staffName, onLogout }: { staffName: string; onLogout: () => void }) {
  const pump = usePumpPerks();
  const { state, recordPurchase, confirmRedemption, resetDemo } = pump;
  const [section, setSection] = useState<Section>("Overview");
  const [modal, setModal] = useState(false);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const pending = state.activity.filter((item) => item.kind === "redeem" && item.status === "pending");
  const snapshot = metrics(state);

  const confirm = async (activityId: string) => {
    setSaving(true);
    const result = await confirmRedemption(activityId);
    setSaving(false);
    const item = result.state.activity.find((entry) => entry.id === activityId);
    const customer = item ? customerById(result.state, item.customerId) : undefined;
    setNotice(result.error ?? `${item?.code} marked as given${customer ? ` to ${customer.name}` : ""}.`);
  };

  const reset = async () => {
    if (!window.confirm("Restore the sample customers and remove purchases from this test?")) return;
    setSaving(true);
    const result = await resetDemo();
    setSaving(false);
    setNotice(result.error ?? "Sample data restored. You can start the next test.");
  };

  return (
    <main className="station-app mvp-station">
      <aside className="station-sidebar">
        <div className="brand brand-light"><span className="brand-symbol"><Icon name="bolt" size={17} /></span><span>Pump<span>Perks</span></span></div>
        <div className="station-profile"><span>MF</span><div><b>{STATION_NAME}</b><small>Kampala · Pilot station</small></div></div>
        <nav>
          {NAV.map(([icon, label]) => (
            <button className={section === label ? "active" : ""} key={label} type="button" onClick={() => setSection(label)}>
              <Icon name={icon} size={18} />
              {label}
              {label === "Rewards" && pending.length > 0 && <em className="nav-badge">{pending.length}</em>}
            </button>
          ))}
        </nav>
        <div className="station-user">
          <span>{initials(staffName)}</span>
          <div><b>{staffName}</b><small>Station attendant</small></div>
          <button type="button" onClick={onLogout}>Log out</button>
        </div>
      </aside>
      <section className="station-main">
        <header>
          <div>
            <small>STATION PORTAL / {section.toUpperCase()}</small>
            <h1>{section}</h1>
          </div>
          <div>
            <button className="export-button" type="button" onClick={() => downloadCsv(state)}>Export report</button>
            <button className="lime-button" type="button" onClick={() => setModal(true)}><Icon name="plus" size={17} /> Record purchase</button>
          </div>
        </header>
        {notice && <button className="station-notice" type="button" onClick={() => setNotice("")}><Icon name="check" />{notice}<span>×</span></button>}
        {section === "Overview" && (
          <>
            {pending.length > 0 && (
              <button className="station-notice pending-notice" type="button" onClick={() => setSection("Rewards")}>
                <Icon name="gift" />
                {pending.length} reward {pending.length === 1 ? "code is" : "codes are"} waiting at the till
                <span>Review</span>
              </button>
            )}
            <div className="station-toolbar">
              <span>LIVE PILOT FIGURES</span>
              <button type="button" onClick={() => void reset()} disabled={saving}>Reset sample data</button>
            </div>
            <div className="full-metrics">
              <article><div><span>Loyalty revenue</span><Icon name="chart" size={18} /></div><strong>{formatUgx(snapshot.revenue)}</strong><small>From recorded fill-ups</small></article>
              <article><div><span>Transactions</span><Icon name="wallet" size={18} /></div><strong>{snapshot.transactions.toLocaleString("en-US")}</strong><small>Fuel purchases</small></article>
              <article><div><span>Customers</span><Icon name="people" size={18} /></div><strong>{snapshot.customers}</strong><small>Accounts on this station</small></article>
              <article><div><span>Points redeemed</span><Icon name="gift" size={18} /></div><strong>{snapshot.redeemedPoints.toLocaleString("en-US")}</strong><small>{snapshot.redemptionRate}% of points earned</small></article>
            </div>
            <Chart state={state} />
            <div className="recent-panel">
              <div className="panel-title"><div><span>LIVE ACTIVITY</span><h3>Recent transactions</h3></div><button type="button" onClick={() => setSection("Transactions")}>View all <Icon name="arrow" size={15} /></button></div>
              <TransactionTable rows={sorted(state).slice(0, 6)} state={state} />
            </div>
          </>
        )}
        {section === "Transactions" && <Transactions state={state} />}
        {section === "Customers" && <Customers state={state} />}
        {section === "Rewards" && <Rewards state={state} pending={pending} saving={saving} onConfirm={(id) => void confirm(id)} />}
        {section === "Campaigns" && <Campaigns />}
      </section>
      {modal && (
        <PurchaseModal
          state={state}
          onClose={() => setModal(false)}
          onSave={async (input) => {
            const result = await recordPurchase(input);
            if (!result.error) {
              const entry = result.state.activity.find((item) => item.id === result.activityId);
              const customer = entry ? customerById(result.state, entry.customerId) : undefined;
              setNotice(`${formatUgx(entry?.amountUgx ?? input.amount)} recorded. ${entry?.points.toLocaleString("en-US") ?? 0} points added to ${customer?.name ?? "the customer"}.`);
              setModal(false);
              setSection("Transactions");
            }
            return result.error ?? null;
          }}
        />
      )}
    </main>
  );
}

function Chart({ state }: { state: State }) {
  const days = dailyEarnCounts(state);
  const max = Math.max(1, ...days.map((day) => day.count));
  const counts = REWARDS.map((reward) => ({
    reward,
    count: state.activity.filter((item) => item.kind === "redeem" && item.rewardId === reward.id).length,
  }));
  const top = Math.max(1, ...counts.map((item) => item.count));
  return (
    <div className="full-dashboard-grid">
      <article className="chart-panel">
        <div className="panel-title"><div><span>TRANSACTION ACTIVITY</span><h3>Purchases, last 12 days</h3></div><b><i /> Fill-ups</b></div>
        <div className="large-chart">{days.map((day) => <i key={day.iso} style={{ height: `${Math.max(day.count === 0 ? 0 : 8, (day.count / max) * 100)}%` }} title={`${day.label}: ${day.count}`} />)}</div>
        <div className="chart-dates"><span>{days[0]?.label}</span><span>{days[Math.floor(days.length / 2)]?.label}</span><span>{days[days.length - 1]?.label}</span></div>
      </article>
      <article className="rewards-panel">
        <div className="panel-title"><div><span>REWARDS</span><h3>Most redeemed</h3></div></div>
        {counts.every((item) => item.count === 0) && <p className="mvp-empty">No rewards have been redeemed yet.</p>}
        {counts.map(({ reward, count }, index) => (
          <div className="reward-line" key={reward.id}>
            <span>0{index + 1}</span>
            <div><b>{reward.name}</b><i><em style={{ width: `${(count / top) * 100}%` }} /></i><small>{count} redeemed</small></div>
          </div>
        ))}
      </article>
    </div>
  );
}

function Transactions({ state }: { state: State }) {
  const [query, setQuery] = useState("");
  const [fuel, setFuel] = useState<"All" | Fuel>("All");
  const rows = sorted(state).filter((item) => {
    if (fuel !== "All" && item.fuel !== fuel) return false;
    const customer = customerById(state, item.customerId);
    const haystack = `${item.id} ${customer?.name ?? ""} ${customer?.phone ?? ""} ${item.code ?? ""}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  return (
    <div className="page-panel">
      <div className="table-filters">
        <div><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by customer, phone, or code" /></div>
        <select value={fuel} onChange={(event) => setFuel(event.target.value as "All" | Fuel)}>
          <option>All</option>
          <option>Petrol</option>
          <option>Diesel</option>
        </select>
      </div>
      {rows.length === 0 ? <p className="mvp-empty padded">No transactions match that search.</p> : <TransactionTable rows={rows} state={state} />}
    </div>
  );
}

function TransactionTable({ rows, state }: { rows: Activity[]; state: State }) {
  return (
    <div className="hi-table-wrap">
      <table className="hi-table">
        <thead><tr><th>Transaction</th><th>Customer</th><th>Detail</th><th>Amount</th><th>Points</th><th>Time</th></tr></thead>
        <tbody>
          {rows.map((item) => {
            const customer = customerById(state, item.customerId);
            const reward = rewardById(item.rewardId);
            return (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td><span className="table-avatar">{initials(customer?.name ?? "?")}</span><span className="who"><b>{customer?.name ?? "Unknown"}</b><small>{customer ? formatPhone(customer.phone) : ""}</small></span></td>
                <td>{item.kind === "earn" ? item.fuel : `${reward?.name ?? "Reward"}${item.status === "pending" ? " · waiting" : ""}`}</td>
                <td>{item.amountUgx ? formatUgx(item.amountUgx) : "—"}</td>
                <td className={item.kind === "earn" ? "positive" : "negative"}>{formatPoints(item.kind, item.points)}</td>
                <td>{formatWhen(item.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Customers({ state }: { state: State }) {
  const customers = [...state.customers].sort((a, b) => b.points - a.points);
  return (
    <div className="customer-cards">
      {customers.map((customer) => (
        <article key={customer.id}>
          <div><span>{initials(customer.name)}</span><small>{segment(state, customer)}</small></div>
          <h3>{customer.name}</h3>
          <p>{formatPhone(customer.phone)} · since {memberSince(customer.createdAt)}</p>
          <section>
            <span><b>{visitCount(state, customer.id)} visits</b> recorded</span>
            <span><b>{customer.points.toLocaleString("en-US")} pts</b> {formatUgx(totalSpend(state, customer.id))} spent</span>
          </section>
        </article>
      ))}
    </div>
  );
}

function Rewards({ state, pending, saving, onConfirm }: { state: State; pending: Activity[]; saving: boolean; onConfirm: (id: string) => void }) {
  return (
    <>
      <div className="pending-list">
        <h3>Waiting at the till</h3>
        {pending.length === 0 && <p className="mvp-empty">When a motorist redeems a reward, the code appears here for you to confirm.</p>}
        {pending.map((item) => {
          const customer = customerById(state, item.customerId);
          const reward = rewardById(item.rewardId);
          return (
            <article key={item.id}>
              <div><b>{item.code}</b><span>{customer?.name} · {formatPhone(customer?.phone ?? "")}</span><small>{reward?.name} · {formatWhen(item.createdAt)}</small></div>
              <button className="lime-button" type="button" disabled={saving} onClick={() => onConfirm(item.id)}>Mark as given</button>
            </article>
          );
        })}
      </div>
      <div className="reward-cards">
        {REWARDS.map((reward, index) => {
          const count = state.activity.filter((item) => item.rewardId === reward.id).length;
          return (
            <article key={reward.id}>
              <div className={`reward-art art-${index + 1}`}><Icon name={index === 0 ? "station" : index === 1 ? "bolt" : "settings"} size={27} /><span>PILOT</span></div>
              <small>{reward.detail.toUpperCase()}</small>
              <h3>{reward.name}</h3>
              <div><b>{reward.cost.toLocaleString("en-US")} pts</b><span>{count} redeemed</span></div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function Campaigns() {
  return (
    <div className="campaign-page">
      <article>
        <span className="section-tag">LATER SPRINT</span>
        <h2>SMS campaigns are not in this test.</h2>
        <p>This pilot checks the loyalty loop: join, earn points on a fill-up, and redeem at the till. Sending SMS is the next backlog item, after the core loop is proven with customers.</p>
        <ul className="mvp-plan">
          <li>Audience: customers who have not visited for 30 days</li>
          <li>Message: a Friday double-points offer</li>
          <li>Channel: SMS, so feature phones are included</li>
        </ul>
      </article>
      <div className="sms-preview">
        <span>FUTURE MESSAGE PREVIEW</span>
        <div className="sms-phone"><small>9:41</small><b>PumpPerks</b><p>We miss you at Makerere Fuel. Visit this Friday and earn double PumpPerks points on your fuel purchase.</p><span>Not sent · sample only</span></div>
      </div>
    </div>
  );
}

function PurchaseModal({
  state,
  onClose,
  onSave,
}: {
  state: State;
  onClose: () => void;
  onSave: (input: { phone: string; name?: string; amount: number; fuel: Fuel; litres?: number }) => Promise<string | null>;
}) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [fuel, setFuel] = useState<Fuel>("Petrol");
  const [litres, setLitres] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const normalized = normalizePhone(phone);
  const match = normalized ? state.customers.find((customer) => customer.phone === normalized) : undefined;
  const amountValue = Number(amount.replace(/[^\d]/g, ""));
  const points = pointsForAmount(amountValue);
  const ready = Boolean(normalized && points > 0 && (match || isValidName(name)));

  const lookup = !phone.trim()
    ? "Enter the number the motorist shows you."
    : !normalized
      ? "Use a Ugandan mobile number, for example 0756 365 310."
      : match
        ? `${match.name} · ${match.points.toLocaleString("en-US")} points now`
        : "New number. Enter their name and this purchase will open the account.";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const message = await onSave({
      phone,
      name: match ? undefined : name,
      amount: amountValue,
      fuel,
      litres: litres.trim() ? Number(litres) : undefined,
    });
    setSaving(false);
    if (message) setError(message);
  };

  return (
    <div className="hi-modal-wrap" onMouseDown={onClose}>
      <form className="hi-modal" onSubmit={(event) => void submit(event)} onMouseDown={(event) => event.stopPropagation()}>
        <div><span><Icon name="station" /></span><button type="button" onClick={onClose}>×</button></div>
        <small>NEW TRANSACTION</small>
        <h2>Record a fuel purchase</h2>
        <p>4 points are added for every UGX 1,000. The motorist can see them straight away.</p>
        <label className="mvp-field">Customer phone number
          <input inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0756 365 310" />
        </label>
        <p className={match ? "lookup found" : "lookup"}>{lookup}</p>
        {normalized && !match && (
          <label className="mvp-field">Customer name
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name to open the account" />
          </label>
        )}
        <div className="field-pair">
          <label className="mvp-field">Amount (UGX)
            <input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="85000" />
          </label>
          <label className="mvp-field">Fuel type
            <select value={fuel} onChange={(event) => setFuel(event.target.value as Fuel)}><option>Petrol</option><option>Diesel</option></select>
          </label>
        </div>
        <label className="mvp-field">Litres, if known
          <input inputMode="decimal" value={litres} onChange={(event) => setLitres(event.target.value)} placeholder="Optional" />
        </label>
        <div className="points-result"><div><span><Icon name="bolt" size={17} /></span><b>Points to award</b></div><strong>{points.toLocaleString("en-US")} pts</strong></div>
        {error && <p className="mvp-error">{error}</p>}
        <button className="lime-button" type="submit" disabled={!ready || saving}>{saving ? "Saving…" : "Confirm purchase"} <Icon name="arrow" size={17} /></button>
      </form>
    </div>
  );
}

function sorted(state: State) {
  return [...state.activity].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function downloadCsv(state: State) {
  const lines = ["transaction,customer,phone,detail,amount_ugx,points,status,time"];
  for (const item of sorted(state)) {
    const customer = customerById(state, item.customerId);
    const detail = item.kind === "earn" ? item.fuel ?? "" : rewardById(item.rewardId)?.name ?? "Reward";
    lines.push([
      item.id,
      customer?.name ?? "",
      customer?.phone ?? "",
      detail,
      item.amountUgx ?? "",
      item.kind === "earn" ? item.points : -item.points,
      item.status ?? "",
      item.createdAt,
    ].map((value) => `"${String(value).replace(/"/g, "\"\"")}"`).join(","));
  }
  const file = new Blob([lines.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "pumpperks-transactions.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}
