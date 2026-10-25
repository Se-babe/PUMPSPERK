export const STATION_NAME = "Makerere Fuel";
export const POINTS_PER_THOUSAND = 4;
export const SHILLINGS_PER_POINT = 5;
export const DEMO_PHONE = "+256756365310";

export type Fuel = "Petrol" | "Diesel";

export type Reward = {
  id: string;
  name: string;
  detail: string;
  cost: number;
  active: boolean;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  points: number;
  createdAt: string;
};

export type Activity = {
  id: string;
  customerId: string;
  kind: "earn" | "redeem" | "adjust";
  note?: string;
  points: number;
  amountUgx?: number;
  fuel?: Fuel;
  litres?: number;
  rewardId?: string;
  code?: string;
  status?: "pending" | "used";
  createdAt: string;
  stationName: string;
};

export type State = {
  revision: number;
  seq: number;
  customers: Customer[];
  activity: Activity[];
  rewards: Reward[];
};

export type Action =
  | { type: "register"; name: string; phone: string }
  | { type: "purchase"; phone: string; name?: string; amount: number; fuel: Fuel; litres?: number }
  | { type: "redeem"; phone: string; rewardId: string }
  | { type: "confirm"; activityId: string }
  | { type: "adjust"; phone: string; points: number; note: string }
  | { type: "reward"; rewardId: string; cost: number; active: boolean }
  | { type: "reset" };

export type ApplyResult = {
  state: State;
  error?: string;
  activityId?: string;
};

export const REWARDS: Reward[] = [
  { id: "fuel", name: "UGX 5,000 fuel discount", detail: "Taken off a fuel purchase at the till.", cost: 1000, active: true },
  { id: "wash", name: "Free standard car wash", detail: "One standard wash at this station.", cost: 1800, active: true },
  { id: "service", name: "15% off an oil change", detail: "Discount on a standard oil change.", cost: 2200, active: true },
];

export function pointsForAmount(amount: number) {
  if (!Number.isFinite(amount) || amount < 1000) return 0;
  return Math.floor(amount / 1000) * POINTS_PER_THOUSAND;
}

export function pointsValue(points: number) {
  return Math.max(0, points) * SHILLINGS_PER_POINT;
}

export function normalizePhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("256")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!/^7\d{8}$/.test(digits)) return null;
  return `+256${digits}`;
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^256/, "");
  if (digits.length !== 9) return phone;
  return `+256 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function formatUgx(value: number) {
  return `UGX ${Math.round(value).toLocaleString("en-US")}`;
}

export function formatPoints(kind: Activity["kind"], points: number) {
  const amount = Math.abs(points).toLocaleString("en-US");
  const positive = kind === "earn" || (kind === "adjust" && points > 0);
  return positive ? `+${amount}` : `-${amount}`;
}

export function isValidName(value: string) {
  return cleanName(value).length > 0;
}

export function formatWhen(iso: string, now = new Date()) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((today - day) / 86_400_000);
  if (diff === 0) return `Today, ${time}`;
  if (diff === 1) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${time}`;
}

export function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function rewardById(id: string | undefined) {
  return REWARDS.find((reward) => reward.id === id);
}

export function customerById(state: State, id: string) {
  return state.customers.find((customer) => customer.id === id);
}

export function accountState(state: State, phoneRaw: string): State | null {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return null;
  const customer = state.customers.find((item) => item.phone === phone);
  if (!customer) return null;
  return {
    revision: state.revision,
    seq: state.seq,
    customers: [customer],
    activity: state.activity.filter((item) => item.customerId === customer.id),
    rewards: state.rewards,
  };
}

export function normalizeState(value: Partial<State> | null | undefined): State | null {
  if (!value || !Array.isArray(value.customers) || !Array.isArray(value.activity)) return null;
  const saved = Array.isArray(value.rewards) ? value.rewards : [];
  return {
    revision: Number(value.revision) || 0,
    seq: Number(value.seq) || 0,
    customers: value.customers,
    activity: value.activity,
    rewards: REWARDS.map((reward) => {
      const match = saved.find((item) => item.id === reward.id);
      const cost = Math.round(Number(match?.cost));
      return {
        ...reward,
        cost: Number.isFinite(cost) && cost >= 100 ? cost : reward.cost,
        active: match ? match.active !== false : reward.active,
      };
    }),
  };
}

export function visitCount(state: State, customerId: string) {
  return state.activity.filter((item) => item.customerId === customerId && item.kind === "earn").length;
}

export function totalSpend(state: State, customerId: string) {
  return state.activity
    .filter((item) => item.customerId === customerId && item.kind === "earn")
    .reduce((sum, item) => sum + (item.amountUgx ?? 0), 0);
}

export function segment(state: State, customer: Customer, now = new Date()) {
  const earns = state.activity.filter((item) => item.customerId === customer.id && item.kind === "earn");
  const latest = earns.reduce((max, item) => Math.max(max, new Date(item.createdAt).getTime()), 0);
  const days = latest ? (now.getTime() - latest) / 86_400_000 : 99;
  if (earns.length <= 1) return "New";
  if (days > 21) return "At risk";
  if (customer.points >= 2000 && earns.length >= 4) return "High value";
  return "Frequent";
}

export function metrics(state: State) {
  const earns = state.activity.filter((item) => item.kind === "earn");
  const redeems = state.activity.filter((item) => item.kind === "redeem");
  const earnedPoints = earns.reduce((sum, item) => sum + item.points, 0);
  const redeemedPoints = redeems.reduce((sum, item) => sum + item.points, 0);
  return {
    revenue: earns.reduce((sum, item) => sum + (item.amountUgx ?? 0), 0),
    transactions: earns.length,
    customers: state.customers.length,
    redeemedPoints,
    redemptionRate: earnedPoints === 0 ? 0 : Math.round((redeemedPoints / earnedPoints) * 1000) / 10,
  };
}

export function dailyEarnCounts(state: State, days = 12, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - (days - 1));
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      iso: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      count: 0,
    };
  });
  for (const item of state.activity) {
    if (item.kind !== "earn") continue;
    const date = new Date(item.createdAt);
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const index = Math.round((day.getTime() - start.getTime()) / 86_400_000);
    const bucket = buckets[index];
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export function apply(state: State, action: Action): ApplyResult {
  switch (action.type) {
    case "reset": {
      const seed = createSeed();
      return { state: { ...seed, revision: state.revision + 1 } };
    }
    case "register":
      return register(state, action);
    case "purchase":
      return purchase(state, action);
    case "redeem":
      return redeemReward(state, action);
    case "confirm":
      return confirmRedemption(state, action);
    case "adjust":
      return adjustPoints(state, action);
    case "reward":
      return updateReward(state, action);
    default:
      return { state, error: "That action is not available in this test build." };
  }
}

export function createSeed(now = new Date()): State {
  const customers: Customer[] = [
    { id: "c-andrew", name: "Andrew Kato", phone: DEMO_PHONE, points: 0, createdAt: at(now, 40, 8, 0) },
    { id: "c-sarah", name: "Sarah Nakato", phone: "+256772614982", points: 0, createdAt: at(now, 36, 9, 0) },
    { id: "c-moses", name: "Moses Kidega", phone: "+256701228401", points: 0, createdAt: at(now, 20, 10, 0) },
    { id: "c-joan", name: "Joan Atim", phone: "+256783440126", points: 0, createdAt: at(now, 32, 11, 0) },
  ];
  const activity: Activity[] = [
    seedEarn("PP-2030", "c-sarah", 400_000, "Petrol", at(now, 12, 10, 0)),
    seedEarn("PP-2031", "c-andrew", 50_000, "Petrol", at(now, 11, 8, 10)),
    seedEarn("PP-2033", "c-joan", 250_000, "Diesel", at(now, 30, 8, 0)),
    seedEarn("PP-2034", "c-andrew", 120_000, "Diesel", at(now, 8, 16, 40)),
    seedEarn("PP-2035", "c-sarah", 300_000, "Diesel", at(now, 7, 12, 15)),
    seedEarn("PP-2036", "c-andrew", 250_000, "Petrol", at(now, 6, 9, 5)),
    seedEarn("PP-2037", "c-joan", 200_000, "Petrol", at(now, 24, 15, 30)),
    seedEarn("PP-2038", "c-andrew", 165_000, "Petrol", at(now, 5, 18, 12)),
    seedRedeem("PP-2041", "c-andrew", "fuel", at(now, 4, 11, 20), "used"),
    seedEarn("PP-2040", "c-sarah", 350_000, "Petrol", at(now, 3, 17, 5)),
    seedEarn("PP-2043", "c-moses", 125_000, "Petrol", at(now, 2, 13, 22)),
    seedEarn("PP-2044", "c-andrew", 200_000, "Diesel", at(now, 2, 7, 48)),
    seedEarn("PP-2045", "c-sarah", 250_000, "Diesel", at(now, 1, 9, 40)),
    seedEarn("PP-2047", "c-moses", 100_000, "Petrol", at(now, 0, 7, 54)),
    seedEarn("PP-2048", "c-andrew", 85_000, "Petrol", at(now, 0, 8, 32)),
  ];
  const state: State = {
    revision: 1,
    seq: 2048,
    customers: withPoints(customers, activity),
    activity,
    rewards: REWARDS.map((reward) => ({ ...reward })),
  };
  const expected: Record<string, number> = {
    "c-andrew": 2480,
    "c-sarah": 5200,
    "c-moses": 900,
    "c-joan": 1800,
  };
  for (const [id, points] of Object.entries(expected)) {
    const customer = state.customers.find((item) => item.id === id);
    if (!customer || customer.points !== points) {
      throw new Error(`Sample balance for ${id} is ${customer?.points}, expected ${points}.`);
    }
  }
  return state;
}

function register(state: State, action: { name: string; phone: string }): ApplyResult {
  const phone = normalizePhone(action.phone);
  if (!phone) return { state, error: "Enter a valid Ugandan mobile number, such as 0756 365 310." };
  if (state.customers.some((customer) => customer.phone === phone)) {
    return { state, error: "That number already has a PumpPerks account." };
  }
  const name = cleanName(action.name);
  if (!name) return { state, error: "Enter a customer name using letters only." };
  const customer: Customer = {
    id: `c-${phone.replace(/\D/g, "")}`,
    name,
    phone,
    points: 0,
    createdAt: new Date().toISOString(),
  };
  return {
    state: {
      ...state,
      revision: state.revision + 1,
      customers: [customer, ...state.customers],
    },
  };
}

function purchase(state: State, action: { phone: string; name?: string; amount: number; fuel: Fuel; litres?: number }): ApplyResult {
  const phone = normalizePhone(action.phone);
  if (!phone) return { state, error: "Enter a valid Ugandan mobile number." };
  const amount = Math.round(action.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { state, error: "Enter the purchase amount in shillings." };
  if (amount > 5_000_000) return { state, error: "Check the amount. This form is for a single fill-up." };
  if (action.fuel !== "Petrol" && action.fuel !== "Diesel") return { state, error: "Choose petrol or diesel." };
  const points = pointsForAmount(amount);
  if (points === 0) return { state, error: "Purchases under UGX 1,000 earn no points." };

  let litres: number | undefined;
  if (action.litres != null && String(action.litres) !== "") {
    if (!Number.isFinite(action.litres) || action.litres <= 0 || action.litres > 500) {
      return { state, error: "Check the litres. Leave the field empty if you do not have them." };
    }
    litres = Math.round(action.litres * 10) / 10;
  }

  let customers = state.customers;
  let customer = customers.find((item) => item.phone === phone);
  if (!customer) {
    const name = cleanName(action.name ?? "");
    if (!name) return { state, error: "This number is new. Enter the customer's name to open an account." };
    customer = {
      id: `c-${phone.replace(/\D/g, "")}`,
      name,
      phone,
      points: 0,
      createdAt: new Date().toISOString(),
    };
    customers = [customer, ...customers];
  }

  const seq = state.seq + 1;
  const entry: Activity = {
    id: `PP-${seq}`,
    customerId: customer.id,
    kind: "earn",
    points,
    amountUgx: amount,
    fuel: action.fuel,
    litres,
    createdAt: new Date().toISOString(),
    stationName: STATION_NAME,
  };
  return {
    state: {
      ...state,
      revision: state.revision + 1,
      seq,
      customers: customers.map((item) => (item.id === customer.id ? { ...item, points: item.points + points } : item)),
      activity: [entry, ...state.activity],
    },
    activityId: entry.id,
  };
}

function redeemReward(state: State, action: { phone: string; rewardId: string }): ApplyResult {
  const phone = normalizePhone(action.phone);
  if (!phone) return { state, error: "Sign in with your phone number first." };
  const customer = state.customers.find((item) => item.phone === phone);
  if (!customer) return { state, error: "No PumpPerks account was found for this number." };
  const reward = state.rewards.find((item) => item.id === action.rewardId && item.active);
  if (!reward) return { state, error: "That reward is not available." };
  if (customer.points < reward.cost) {
    const missing = (reward.cost - customer.points).toLocaleString("en-US");
    return { state, error: `You need ${missing} more points for this reward.` };
  }
  const seq = state.seq + 1;
  const code = `PP-${seq}`;
  const entry: Activity = {
    id: code,
    customerId: customer.id,
    kind: "redeem",
    points: reward.cost,
    rewardId: reward.id,
    code,
    status: "pending",
    createdAt: new Date().toISOString(),
    stationName: STATION_NAME,
  };
  return {
    state: {
      ...state,
      revision: state.revision + 1,
      seq,
      customers: state.customers.map((item) => (item.id === customer.id ? { ...item, points: item.points - reward.cost } : item)),
      activity: [entry, ...state.activity],
    },
    activityId: code,
  };
}

function confirmRedemption(state: State, action: { activityId: string }): ApplyResult {
  const item = state.activity.find((entry) => entry.id === action.activityId);
  if (!item || item.kind !== "redeem") return { state, error: "That reward code was not found." };
  if (item.status === "used") return { state, error: "This code has already been used." };
  return {
    state: {
      ...state,
      revision: state.revision + 1,
      activity: state.activity.map((entry) => (entry.id === item.id ? { ...entry, status: "used" } : entry)),
    },
    activityId: item.id,
  };
}

function adjustPoints(state: State, action: { phone: string; points: number; note: string }): ApplyResult {
  const phone = normalizePhone(action.phone);
  if (!phone) return { state, error: "Enter a valid Ugandan mobile number." };
  const customer = state.customers.find((item) => item.phone === phone);
  if (!customer) return { state, error: "No PumpPerks account was found for this number." };
  const points = Math.round(action.points);
  if (!Number.isFinite(points) || points === 0 || Math.abs(points) > 100_000) {
    return { state, error: "Enter a points change between -100,000 and 100,000, other than zero." };
  }
  if (customer.points + points < 0) return { state, error: "That change would take the balance below zero." };
  const note = cleanNote(action.note);
  if (!note) return { state, error: "Add a short reason, using letters and numbers." };
  const seq = state.seq + 1;
  const entry: Activity = {
    id: `PP-${seq}`,
    customerId: customer.id,
    kind: "adjust",
    points,
    note,
    createdAt: new Date().toISOString(),
    stationName: STATION_NAME,
  };
  return {
    state: {
      ...state,
      revision: state.revision + 1,
      seq,
      customers: state.customers.map((item) => (item.id === customer.id ? { ...item, points: item.points + points } : item)),
      activity: [entry, ...state.activity],
    },
    activityId: entry.id,
  };
}

function updateReward(state: State, action: { rewardId: string; cost: number; active: boolean }): ApplyResult {
  if (!state.rewards.some((reward) => reward.id === action.rewardId)) {
    return { state, error: "That reward was not found." };
  }
  const cost = Math.round(action.cost);
  if (!Number.isFinite(cost) || cost < 100 || cost > 100_000) {
    return { state, error: "Set a reward cost between 100 and 100,000 points." };
  }
  return {
    state: {
      ...state,
      revision: state.revision + 1,
      rewards: state.rewards.map((reward) => (reward.id === action.rewardId ? { ...reward, cost, active: action.active } : reward)),
    },
  };
}

function seedEarn(id: string, customerId: string, amountUgx: number, fuel: Fuel, createdAt: string): Activity {
  return {
    id,
    customerId,
    kind: "earn",
    points: pointsForAmount(amountUgx),
    amountUgx,
    fuel,
    createdAt,
    stationName: STATION_NAME,
  };
}

function seedRedeem(id: string, customerId: string, rewardId: string, createdAt: string, status: "pending" | "used"): Activity {
  const reward = rewardById(rewardId);
  return {
    id,
    customerId,
    kind: "redeem",
    points: reward?.cost ?? 0,
    rewardId,
    code: id,
    status,
    createdAt,
    stationName: STATION_NAME,
  };
}

function withPoints(customers: Customer[], activity: Activity[]) {
  return customers.map((customer) => ({
    ...customer,
    points: activity
      .filter((item) => item.customerId === customer.id)
      .reduce((sum, item) => sum + (item.kind === "earn" ? item.points : item.kind === "adjust" ? item.points : -item.points), 0),
  }));
}

function cleanNote(value: string) {
  const note = value.replace(/\s+/g, " ").trim();
  if (note.length < 3 || note.length > 80) return "";
  if (!/^[\p{L}\p{N}][\p{L}\p{N} '.,:-]*$/u.test(note)) return "";
  return note;
}

function cleanName(value: string) {
  const name = value.replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 40) return "";
  if (!/^[\p{L}][\p{L} '.-]*$/u.test(name)) return "";
  return name;
}

function at(now: Date, daysAgo: number, hours: number, minutes: number) {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}
