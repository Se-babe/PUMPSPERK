import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  apply,
  createSeed,
  normalizePhone,
  type Action,
  type ApplyResult,
  type Customer,
  type State,
} from "./logic";

const STATE_KEY = "pumpperks-mvp-state";
const SESSION_KEY = "pumpperks-mvp-phone";
const VIEW_EVENT = "pumpperks-view";

type PurchaseInput = {
  phone: string;
  name?: string;
  amount: number;
  fuel: "Petrol" | "Diesel";
  litres?: number;
};

type PumpApi = {
  remote: boolean;
  state: State;
  motorist: Customer | null;
  logIn: (phone: string) => Promise<string | null>;
  createAccount: (name: string, phone: string) => Promise<string | null>;
  signOut: () => void;
  recordPurchase: (input: PurchaseInput) => Promise<ApplyResult>;
  redeem: (rewardId: string) => Promise<ApplyResult>;
  confirmRedemption: (activityId: string) => Promise<ApplyResult>;
  resetDemo: () => Promise<ApplyResult>;
};

const PumpContext = createContext<PumpApi | null>(null);

export function PumpPerksProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [remote, setRemote] = useState(false);
  const [role, setRole] = useState<AppRole>(readRole);
  const [motoristPhone, setMotoristPhone] = useState<string | null>(() => readSession());
  const stateRef = useRef<State | null>(null);
  const revisionRef = useRef(0);
  const remoteRef = useRef(false);
  const roleRef = useRef(role);
  const phoneRef = useRef(motoristPhone);
  roleRef.current = role;
  phoneRef.current = motoristPhone;

  const accept = (next: State, force = false) => {
    if (!force && next.revision < revisionRef.current) return;
    revisionRef.current = next.revision;
    stateRef.current = next;
    setState(next);
  };

  useEffect(() => {
    const sync = () => setRole(readRole());
    window.addEventListener(VIEW_EVENT, sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener(VIEW_EVENT, sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      const online = await probeApi();
      if (stopped) return;
      if (!online) {
        remoteRef.current = false;
        setRemote(false);
        accept(readLocal() ?? createSeed(), true);
        return;
      }
      remoteRef.current = true;
      setRemote(true);
      if (readRole() === "station") {
        const shared = await fetchState();
        if (!stopped && readRole() === "station" && shared) accept(shared, true);
        return;
      }
      const phone = readSession();
      if (!phone) {
        if (!phoneRef.current && readRole() !== "station") accept(emptyState(), true);
        return;
      }
      const account = await fetchAccount(phone);
      if (stopped || readRole() === "station") return;
      if (account === "missing") {
        localStorage.removeItem(SESSION_KEY);
        setMotoristPhone(null);
        accept(emptyState(), true);
        return;
      }
      if (account !== "offline") accept(account, true);
    };
    void load();
    return () => {
      stopped = true;
    };
  }, [role]);

  useEffect(() => {
    if (!remote) return;
    const timer = window.setInterval(async () => {
      if (roleRef.current === "station") {
        const shared = await fetchState();
        if (roleRef.current === "station" && shared) accept(shared);
        return;
      }
      const phone = phoneRef.current;
      if (roleRef.current !== "motorist" || !phone) return;
      const account = await fetchAccount(phone);
      if (roleRef.current !== "motorist") return;
      if (account === "missing") {
        localStorage.removeItem(SESSION_KEY);
        setMotoristPhone(null);
        accept(emptyState(), true);
        return;
      }
      if (account !== "offline") accept(account);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [remote]);

  useEffect(() => {
    if (!state || !motoristPhone || state.customers.length === 0) return;
    if (!state.customers.some((customer) => customer.phone === motoristPhone)) {
      localStorage.removeItem(SESSION_KEY);
      setMotoristPhone(null);
    }
  }, [state, motoristPhone]);

  const dispatch = async (action: Action): Promise<ApplyResult> => {
    const current = stateRef.current;
    if (!current) return { state: createSeed(), error: "PumpPerks is still loading." };
    if (remoteRef.current) {
      try {
        const response = await fetch("/api/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });
        if (!response.ok) return { state: current, error: "Could not save that change. Stay on this network and try again." };
        const result = (await response.json()) as ApplyResult;
        if (result.state) accept(result.state);
        return result;
      } catch {
        return { state: current, error: "Could not reach the test server. Stay on this network and try again." };
      }
    }
    const result = apply(current, action);
    accept(result.state);
    localStorage.setItem(STATE_KEY, JSON.stringify(result.state));
    return result;
  };

  const rememberMotorist = (phone: string) => {
    localStorage.setItem(SESSION_KEY, phone);
    setMotoristPhone(phone);
  };

  const logIn = async (phoneRaw: string) => {
    const phone = normalizePhone(phoneRaw);
    if (!phone) return "Enter a valid Ugandan mobile number, such as 0756 365 310.";
    if (remoteRef.current) {
      const account = await fetchAccount(phone);
      if (account === "offline") return "Could not reach the test server. Stay on this network and try again.";
      if (account === "missing") return "No account uses this number. Create an account first.";
      accept(account, true);
      rememberMotorist(phone);
      return null;
    }
    const existing = stateRef.current?.customers.some((customer) => customer.phone === phone);
    if (!existing) return "No account uses this number. Create an account first.";
    rememberMotorist(phone);
    return null;
  };

  const createAccount = async (name: string, phoneRaw: string) => {
    const phone = normalizePhone(phoneRaw);
    if (!phone) return "Enter a valid Ugandan mobile number, such as 0756 365 310.";
    const result = await dispatch({ type: "register", name, phone });
    if (result.error) return result.error;
    rememberMotorist(phone);
    return null;
  };

  const api: PumpApi | null = state
    ? {
        remote,
        state,
        motorist: state.customers.find((customer) => customer.phone === motoristPhone) ?? null,
        logIn,
        createAccount,
        signOut: () => {
          localStorage.removeItem(SESSION_KEY);
          setMotoristPhone(null);
        },
        recordPurchase: (input) => dispatch({ type: "purchase", ...input }),
        redeem: (rewardId) => {
          const phone = motoristPhone;
          if (!phone) return Promise.resolve({ state, error: "Sign in before redeeming a reward." });
          return dispatch({ type: "redeem", phone, rewardId });
        },
        confirmRedemption: (activityId) => dispatch({ type: "confirm", activityId }),
        resetDemo: () => dispatch({ type: "reset" }),
      }
    : null;

  if (!api) return <div className="route-loader">Loading PumpPerks…</div>;
  return <PumpContext.Provider value={api}>{children}</PumpContext.Provider>;
}

export function usePumpPerks() {
  const api = useContext(PumpContext);
  if (!api) throw new Error("PumpPerks is not ready.");
  return api;
}

function emptyState(): State {
  return { revision: 0, seq: 0, customers: [], activity: [] };
}

type AppRole = "motorist" | "station" | "public";

function readRole(): AppRole {
  const app = new URLSearchParams(window.location.search).get("app");
  if (app === "motorist" || app === "driver") return "motorist";
  if (app === "station") return "station";
  return "public";
}

async function probeApi() {
  try {
    const response = await fetch("/api/account", { headers: { Accept: "application/json" } });
    return response.status === 400;
  } catch {
    return false;
  }
}

async function fetchAccount(phone: string): Promise<State | "missing" | "offline"> {
  try {
    const response = await fetch(`/api/account?phone=${encodeURIComponent(phone)}`, { headers: { Accept: "application/json" } });
    if (response.status === 404) return "missing";
    if (!response.ok) return "offline";
    const data = (await response.json()) as State;
    if (!data || !Array.isArray(data.customers) || data.customers.length !== 1) return "offline";
    return data;
  } catch {
    return "offline";
  }
}

async function fetchState() {
  try {
    const response = await fetch("/api/state", { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const data = (await response.json()) as State;
    if (!data || !Array.isArray(data.customers) || !Array.isArray(data.activity)) return null;
    return data;
  } catch {
    return null;
  }
}

function readLocal() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as State;
    if (!Array.isArray(data.customers) || !Array.isArray(data.activity)) return null;
    return data;
  } catch {
    return null;
  }
}

function readSession() {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
