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
  const [motoristPhone, setMotoristPhone] = useState<string | null>(() => readSession());
  const stateRef = useRef<State | null>(null);
  const revisionRef = useRef(0);
  const remoteRef = useRef(false);

  const accept = (next: State) => {
    if (next.revision < revisionRef.current) return;
    revisionRef.current = next.revision;
    stateRef.current = next;
    setState(next);
  };

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      const shared = await fetchState();
      if (stopped) return;
      if (shared) {
        remoteRef.current = true;
        setRemote(true);
        accept(shared);
        return;
      }
      accept(readLocal() ?? createSeed());
    };
    void load();
    return () => {
      stopped = true;
    };
  }, []);

  useEffect(() => {
    if (!remote) return;
    const timer = window.setInterval(async () => {
      const shared = await fetchState();
      if (shared) accept(shared);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [remote]);

  useEffect(() => {
    if (!state || !motoristPhone) return;
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
