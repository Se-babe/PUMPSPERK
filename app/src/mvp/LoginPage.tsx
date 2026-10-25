import { useState, type FormEvent } from "react";
import { Icon, type IconName } from "../icons";
import { isValidName } from "./logic";
import { usePumpPerks } from "./PumpPerksProvider";
import { ADMIN_CODE, ADMIN_KEY, STATION_CODE, STAFF_KEY, saveNamedSession } from "./sessions";

type Destination = "driver" | "station" | "admin";

export function LoginPage({ onEnter }: { onEnter: (view: Destination) => void }) {
  const { logIn, createAccount } = usePumpPerks();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const result = await signIn(name, phone, code, logIn, createAccount);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onEnter(result.role);
  };

  const demo = async () => {
    setSaving(true);
    setError("");
    const message = await logIn("0756 365 310");
    setSaving(false);
    if (message) {
      setError(message);
      return;
    }
    onEnter("driver");
  };

  return (
    <main className="land">
      <header className="land-bar">
        <div className="brand"><span className="brand-symbol"><Icon name="bolt" size={17} /></span><span>Pump<span>Perks</span></span></div>
        <span>Makerere Fuel · loyalty pilot</span>
      </header>
      <section className="land-hero">
        <div className="land-story">
          <span className="section-tag">HOW THE PILOT WORKS</span>
          <h1>Every fill-up can earn something back.</h1>
          <p>PumpPerks is the loyalty account for this station. A motorist uses a phone number instead of a card. The attendant records the fuel. Points show up on that customer’s phone, and only on theirs.</p>
          <div className="land-facts">
            <article><b>4</b><span>points for every UGX 1,000 of fuel</span></article>
            <article><b>5</b><span>shillings of reward value in each point</span></article>
            <article><b>1</b><span>phone number is the whole membership card</span></article>
          </div>
          <div className="land-roles">
            {ROLES.map(([icon, title, copy]) => (
              <article key={title}>
                <span><Icon name={icon} size={18} /></span>
                <div><b>{title}</b><p>{copy}</p></div>
              </article>
            ))}
          </div>
        </div>
        <form className="land-card" onSubmit={(event) => void submit(event)}>
          <span className="section-tag">SIGN IN</span>
          <h2>Open your side of the pilot.</h2>
          <p>One page for customers, the till, and the admin. The access code chooses the screen.</p>
          <label className="mvp-field">Full name
            <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Amina Nakiwala" />
          </label>
          <label className="mvp-field">Mobile number
            <input autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0772 000 111" />
          </label>
          <label className="mvp-field">Access code
            <input inputMode="numeric" autoComplete="off" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Leave empty for a customer" />
          </label>
          {error && <p className="mvp-error">{error}</p>}
          <button className="lime-button large" type="submit" disabled={saving}>{saving ? "Please wait…" : "Log in"}</button>
          <button className="mvp-secondary" type="button" disabled={saving} onClick={() => void demo()}>Log in as Andrew Kato</button>
          <small>New customers add their name and leave the code empty. Station code {STATION_CODE}. Admin code {ADMIN_CODE}. Andrew’s sample number is 0756 365 310.</small>
        </form>
      </section>
      <section className="land-path">
        <div className="section-lead">
          <span className="section-tag">A VISIT</span>
          <h2>From the pump to the points.</h2>
        </div>
        <div className="land-steps">
          {STEPS.map(([icon, title, copy], index) => (
            <article key={title}>
              <em>0{index + 1}</em>
              <span><Icon name={icon} size={20} /></span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const ROLES: [IconName, string, string][] = [
  ["phone", "Motorist", "Log in with your number and see only your points, rewards, and fill-ups."],
  ["station", "Station", "Record a purchase at the till and mark a reward as given."],
  ["settings", "Admin", "Correct a balance, open or close a reward, and restore the sample data."],
];

const STEPS: [IconName, string, string][] = [
  ["people", "Join with a number", "A new motorist enters a name and a Ugandan mobile number. No card is issued."],
  ["station", "Fuel is recorded", "The attendant enters the amount. UGX 85,000 earns 340 points."],
  ["gift", "Redeem at the till", "The motorist chooses a reward and shows the code. The attendant confirms it."],
  ["check", "Each person sees their own screen", "Customers never see another balance. Staff and admin use their codes."],
];

async function signIn(
  name: string,
  phone: string,
  codeRaw: string,
  logIn: (phone: string) => Promise<string | null>,
  createAccount: (name: string, phone: string) => Promise<string | null>,
): Promise<{ role: Destination; error?: undefined } | { role?: undefined; error: string }> {
  const nextName = name.trim().replace(/\s+/g, " ");
  const code = codeRaw.trim();
  if (code === STATION_CODE || code === ADMIN_CODE) {
    if (!isValidName(nextName)) return { error: "Enter your name using letters only." };
    if (code === ADMIN_CODE) {
      saveNamedSession(ADMIN_KEY, nextName);
      return { role: "admin" };
    }
    saveNamedSession(STAFF_KEY, nextName);
    return { role: "station" };
  }
  if (code) return { error: `That code is not recognised. Station staff use ${STATION_CODE}. Admins use ${ADMIN_CODE}. Customers leave the code empty.` };
  const existing = await logIn(phone);
  if (!existing) return { role: "driver" };
  if (!existing.startsWith("No account")) return { error: existing };
  if (!isValidName(nextName)) return { error: "No account uses this number yet. Enter your name to create one." };
  const created = await createAccount(nextName, phone);
  if (created) return { error: created };
  return { role: "driver" };
}
