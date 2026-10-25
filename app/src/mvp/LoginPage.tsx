import { useState, type FormEvent } from "react";
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
    <main className="mvp-motorist">
      <form className="mvp-phone mvp-join" onSubmit={(event) => void submit(event)}>
        <span className="section-tag">PUMPPERKS</span>
        <h1>Log in</h1>
        <p>Customers, station staff, and admins use this page. The code decides where you go.</p>
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
        <small>Customers use a mobile number and leave the code empty. New customers also enter their name. Station code {STATION_CODE}. Admin code {ADMIN_CODE}.</small>
      </form>
    </main>
  );
}

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
