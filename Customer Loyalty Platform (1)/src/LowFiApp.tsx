import { FormEvent, useState } from "react";

type Experience = "overview" | "motorist" | "station";
type StationView = "dashboard" | "transactions" | "customers" | "rewards" | "campaigns";

const Arrow = () => <span aria-hidden="true">→</span>;

const Logo = () => (
  <div className="logo-lockup">
    <span className="logo-mark">P</span>
    <span>PUMPPERKS</span>
  </div>
);

const TopBar = ({
  active,
  onChange,
}: {
  active: Experience;
  onChange: (value: Experience) => void;
}) => (
  <header className="topbar">
    <Logo />
    <nav className="experience-switcher" aria-label="Prototype views">
      {[
        ["overview", "Business"],
        ["motorist", "Motorist app"],
        ["station", "Station portal"],
      ].map(([value, label]) => (
        <button
          className={active === value ? "active" : ""}
          key={value}
          onClick={() => onChange(value as Experience)}
        >
          {label}
        </button>
      ))}
    </nav>
    <span className="prototype-tag">LOW-FI PROTOTYPE</span>
  </header>
);

function Overview({ onChange }: { onChange: (value: Experience) => void }) {
  return (
    <main className="overview">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">LOYALTY, BUILT FOR EVERY STATION</div>
          <h1>Every fuel-up deserves a reward.</h1>
          <p>
            A simple, brand-agnostic loyalty platform helping Ugandan petrol stations
            turn everyday fuel purchases into lasting customer relationships.
          </p>
          <div className="button-row">
            <button className="primary-button" onClick={() => onChange("station")}>
              Explore station portal <Arrow />
            </button>
            <button className="secondary-button" onClick={() => onChange("motorist")}>
              View motorist app
            </button>
          </div>
          <div className="trust-row">
            <span>PHONE NUMBER</span>
            <i />
            <span>QR CODE</span>
            <i />
            <span>USSD / SMS</span>
          </div>
        </div>
        <div className="hero-wireframe" aria-label="Loyalty journey wireframe">
          <div className="sketch-note">The core loyalty loop</div>
          {[
            ["01", "Fuel", "Visit any participating station"],
            ["02", "Earn", "Points land on your phone"],
            ["03", "Redeem", "Get fuel and service rewards"],
          ].map(([number, title, copy]) => (
            <div className="journey-card" key={number}>
              <span>{number}</span>
              <div>
                <strong>{title}</strong>
                <p>{copy}</p>
              </div>
              <Arrow />
            </div>
          ))}
        </div>
      </section>

      <section className="metrics-strip">
        <div><strong>3,000+</strong><span>stations nationwide</span></div>
        <div><strong>50</strong><span>Year 1 station goal</span></div>
        <div><strong>25K</strong><span>active motorists goal</span></div>
        <div><strong>UGX 150K</strong><span>starting monthly plan</span></div>
      </section>

      <section className="split-section">
        <div>
          <div className="eyebrow">THE OPPORTUNITY</div>
          <h2>Independent stations deserve the same loyalty tools as major brands.</h2>
        </div>
        <div className="problem-grid">
          {[
            ["No customer visibility", "Stations cannot identify regular or high-value customers."],
            ["Manual rewards fail", "Paper cards are inconsistent, forgettable, and easy to misuse."],
            ["Promotions miss", "Without data, every campaign becomes a broad, expensive guess."],
            ["Loyalty stays closed", "Existing programmes only work inside one major fuel brand."],
          ].map(([title, copy], index) => (
            <article className="problem-card" key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="platform-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">ONE CONNECTED PLATFORM</div>
            <h2>Simple for motorists. Useful for stations.</h2>
          </div>
          <p>Designed mobile-first for Uganda, with a path for every kind of phone.</p>
        </div>
        <div className="platform-grid">
          <article className="platform-card">
            <div className="placeholder-icon">01</div>
            <h3>Motorist experience</h3>
            <p>Check points, find participating stations, and redeem rewards.</p>
            <button onClick={() => onChange("motorist")}>Open prototype <Arrow /></button>
          </article>
          <article className="platform-card featured">
            <div className="placeholder-icon">02</div>
            <h3>Station portal</h3>
            <p>Record purchases, understand customers, and launch promotions.</p>
            <button onClick={() => onChange("station")}>Open prototype <Arrow /></button>
          </article>
          <article className="platform-card">
            <div className="placeholder-icon">03</div>
            <h3>USSD + SMS</h3>
            <p>Bring rewards to feature-phone customers without an app download.</p>
            <button>Dial *284*8# <Arrow /></button>
          </article>
        </div>
      </section>

      <section className="pricing-section">
        <div className="eyebrow">BUILT TO START SMALL</div>
        <h2>Pricing that grows with the station.</h2>
        <div className="price-grid">
          {[
            ["Basic", "150,000", "Core loyalty and points tracking"],
            ["Standard", "300,000", "Analytics and campaign tools"],
            ["Enterprise", "Custom", "Multi-branch controls and reporting"],
          ].map(([name, price, detail], index) => (
            <article className={index === 1 ? "price-card selected" : "price-card"} key={name}>
              {index === 1 && <span className="popular">PILOT FAVOURITE</span>}
              <h3>{name}</h3>
              <div className="price">{price !== "Custom" && <small>UGX</small>}{price}</div>
              <p>{price !== "Custom" && "per station / month"}</p>
              <hr />
              <strong>{detail}</strong>
              <button>{index === 2 ? "Talk to the team" : "Start a 3-month pilot"}</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const mobileNav = ["Home", "Rewards", "History", "Profile"];

function MotoristApp() {
  const [tab, setTab] = useState("Home");
  const [notice, setNotice] = useState("");

  const redeem = (reward: string) => {
    setNotice(`${reward} reserved. Show code PP-2048 at the till.`);
  };

  return (
    <main className="prototype-stage">
      <div className="stage-intro">
        <div className="eyebrow">MOTORIST EXPERIENCE</div>
        <h1>Rewards that travel with you.</h1>
        <p>This clickable wireframe demonstrates the core customer loyalty journey.</p>
        <div className="annotation-list">
          <span><b>1</b> Register with a phone number</span>
          <span><b>2</b> Earn points automatically</span>
          <span><b>3</b> Redeem at the till</span>
        </div>
      </div>

      <div className="phone">
        <div className="phone-speaker" />
        <div className="mobile-header">
          <Logo />
          <button className="avatar">AK</button>
        </div>
        <div className="phone-content">
          {notice && (
            <button className="notice" onClick={() => setNotice("")}>
              {notice} <span>×</span>
            </button>
          )}
          {tab === "Home" && (
            <>
              <p className="mobile-greeting">Good morning, Andrew</p>
              <section className="points-card">
                <span>AVAILABLE POINTS</span>
                <strong>2,480 <small>pts</small></strong>
                <div><span>About UGX 12,400 in value</span><button onClick={() => setTab("Rewards")}>Use points</button></div>
              </section>
              <section className="quick-actions">
                <button><b>＋</b><span>Earn points</span></button>
                <button><b>⌁</b><span>My QR code</span></button>
                <button><b>⌖</b><span>Find station</span></button>
              </section>
              <div className="mobile-section-title"><strong>Nearby offers</strong><button>See all</button></div>
              <article className="offer-card">
                <div className="image-placeholder">STATION IMAGE</div>
                <div><span>1.2 KM AWAY</span><strong>Double points this Friday</strong><p>Kampala Road Fuel Centre</p></div>
              </article>
              <div className="mobile-section-title"><strong>Recent activity</strong><button onClick={() => setTab("History")}>View all</button></div>
              <Transaction compact />
            </>
          )}
          {tab === "Rewards" && (
            <>
              <div className="mobile-page-title"><div><span>2,480 points</span><h2>Choose a reward</h2></div><button>Filter</button></div>
              <div className="reward-list">
                {[
                  ["Fuel", "UGX 5,000 fuel discount", "1,000"],
                  ["Wash", "Free standard car wash", "1,800"],
                  ["Service", "15% off an oil change", "2,200"],
                ].map(([type, title, points]) => (
                  <article key={title}>
                    <div className="reward-thumb">{type}</div>
                    <div><span>{type.toUpperCase()}</span><strong>{title}</strong><p>{points} points</p></div>
                    <button onClick={() => redeem(title)}>Redeem</button>
                  </article>
                ))}
              </div>
            </>
          )}
          {tab === "History" && (
            <>
              <div className="mobile-page-title"><div><span>YOUR ACTIVITY</span><h2>Points history</h2></div></div>
              <div className="history-balance"><span>Earned this month</span><strong>+760 pts</strong></div>
              <div className="transactions-list">
                <Transaction />
                <Transaction name="Ntinda Service Station" date="14 Sep, 4:10 PM" points="+180" />
                <Transaction name="Reward redeemed" date="10 Sep, 9:05 AM" points="-1,000" negative />
                <Transaction name="Wandegeya Fuel Point" date="06 Sep, 7:44 AM" points="+240" />
              </div>
            </>
          )}
          {tab === "Profile" && (
            <div className="profile-page">
              <div className="large-avatar">AK</div>
              <h2>Andrew Kato</h2>
              <p>+256 756 365 310</p>
              {["Personal details", "Notification preferences", "Help & support", "Terms and privacy"].map((item) => (
                <button key={item}><span>{item}</span><Arrow /></button>
              ))}
            </div>
          )}
        </div>
        <nav className="mobile-nav">
          {mobileNav.map((item, index) => (
            <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>
              <b>{["⌂", "◇", "≡", "○"][index]}</b><span>{item}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}

function Transaction({
  compact = false,
  name = "Makerere Hill Station",
  date = "Today, 8:32 AM",
  points = "+340",
  negative = false,
}: {
  compact?: boolean;
  name?: string;
  date?: string;
  points?: string;
  negative?: boolean;
}) {
  return (
    <article className={`transaction ${compact ? "compact" : ""}`}>
      <div className="transaction-icon">F</div>
      <div><strong>{name}</strong><span>{date} · UGX 85,000</span></div>
      <b className={negative ? "negative" : ""}>{points}</b>
    </article>
  );
}

const sidebarItems: [StationView, string, string][] = [
  ["dashboard", "Overview", "01"],
  ["transactions", "Transactions", "02"],
  ["customers", "Customers", "03"],
  ["rewards", "Rewards", "04"],
  ["campaigns", "Campaigns", "05"],
];

function StationPortal() {
  const [view, setView] = useState<StationView>("dashboard");
  const [recordOpen, setRecordOpen] = useState(false);
  const [success, setSuccess] = useState("");

  const submitPurchase = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecordOpen(false);
    setSuccess("Purchase recorded. 340 points sent to customer.");
  };

  return (
    <main className="portal">
      <aside className="sidebar">
        <Logo />
        <div className="station-chip"><span>MF</span><div><strong>Makerere Fuel</strong><small>Kampala · Station 01</small></div></div>
        <nav>
          {sidebarItems.map(([key, label, number]) => (
            <button className={view === key ? "active" : ""} key={key} onClick={() => setView(key)}>
              <span>{number}</span>{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button><span>?</span> Help centre</button>
          <div className="user-chip"><span>AK</span><div><strong>Andrew Kato</strong><small>Station manager</small></div></div>
        </div>
      </aside>

      <section className="portal-main">
        <header className="portal-header">
          <div>
            <button className="mobile-menu">MENU</button>
            <span>STATION PORTAL / {view.toUpperCase()}</span>
            <h1>{sidebarItems.find(([key]) => key === view)?.[1]}</h1>
          </div>
          <div className="portal-actions">
            <button className="outline-button">Export report</button>
            <button className="primary-button" onClick={() => setRecordOpen(true)}>＋ Record purchase</button>
          </div>
        </header>

        {success && <button className="success-banner" onClick={() => setSuccess("")}>{success}<span>×</span></button>}

        {view === "dashboard" && <Dashboard onNavigate={setView} />}
        {view === "transactions" && <TransactionsPage />}
        {view === "customers" && <CustomersPage />}
        {view === "rewards" && <RewardsPage />}
        {view === "campaigns" && <CampaignsPage />}
      </section>

      {recordOpen && (
        <div className="modal-backdrop" onMouseDown={() => setRecordOpen(false)}>
          <form className="purchase-modal" onSubmit={submitPurchase} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-heading"><div><span>NEW TRANSACTION</span><h2>Record a fuel purchase</h2></div><button type="button" onClick={() => setRecordOpen(false)}>×</button></div>
            <label>Customer phone number<input required defaultValue="+256 " placeholder="+256 7XX XXX XXX" /></label>
            <label>Purchase amount (UGX)<input required type="number" defaultValue="85000" /></label>
            <div className="form-row">
              <label>Fuel type<select defaultValue="Petrol"><option>Petrol</option><option>Diesel</option></select></label>
              <label>Litres<input type="number" defaultValue="17" /></label>
            </div>
            <div className="points-preview"><span>Customer will earn</span><strong>340 points</strong></div>
            <button className="primary-button" type="submit">Confirm and award points <Arrow /></button>
          </form>
        </div>
      )}
    </main>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (view: StationView) => void }) {
  return (
    <>
      <div className="date-filter"><span>PERFORMANCE</span><button>Last 30 days⌄</button></div>
      <section className="stat-grid">
        {[
          ["Total transactions", "1,284", "+12.4%", "vs last month"],
          ["Loyalty revenue", "UGX 48.2M", "+8.7%", "vs last month"],
          ["Active customers", "842", "+68", "new this month"],
          ["Points redeemed", "124K", "18.2%", "redemption rate"],
        ].map(([label, value, change, note]) => (
          <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong><div><b>{change}</b> {note}</div></article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="chart-card">
          <div className="card-heading"><div><span>TRANSACTION ACTIVITY</span><h3>Purchases this month</h3></div><div className="legend"><i /> Transactions</div></div>
          <div className="chart">
            {[34, 48, 40, 62, 54, 78, 72, 94, 76, 88, 68, 96].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
          </div>
          <div className="chart-labels"><span>01 Sep</span><span>07 Sep</span><span>14 Sep</span><span>21 Sep</span><span>30 Sep</span></div>
        </article>
        <article className="rewards-summary">
          <div className="card-heading"><div><span>REWARDS</span><h3>Most redeemed</h3></div><button onClick={() => onNavigate("rewards")}>View all</button></div>
          {[
            ["UGX 5,000 fuel discount", "82", "48%"],
            ["Free standard car wash", "51", "31%"],
            ["10% shop purchase discount", "29", "17%"],
          ].map(([name, count, width], index) => (
            <div className="reward-row" key={name}><b>0{index + 1}</b><div><strong>{name}</strong><span><i style={{ width }} /></span></div><em>{count}</em></div>
          ))}
        </article>
      </section>
      <section className="table-card">
        <div className="card-heading"><div><span>LIVE FEED</span><h3>Recent transactions</h3></div><button onClick={() => onNavigate("transactions")}>View all transactions <Arrow /></button></div>
        <TransactionTable />
      </section>
    </>
  );
}

const transactionRows = [
  ["#PP-2048", "Andrew Kato", "+256 756 365 310", "UGX 85,000", "+340", "Today, 08:32"],
  ["#PP-2047", "Sarah Nakato", "+256 772 614 982", "UGX 120,000", "+480", "Today, 08:19"],
  ["#PP-2046", "Moses Kidega", "+256 701 228 401", "UGX 50,000", "+200", "Today, 07:54"],
  ["#PP-2045", "Joan Atim", "+256 783 440 126", "UGX 200,000", "+800", "Yesterday, 18:46"],
];

function TransactionTable() {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Transaction</th><th>Customer</th><th>Phone</th><th>Amount</th><th>Points</th><th>Time</th></tr></thead>
        <tbody>{transactionRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={cell} className={index === 4 ? "points-cell" : ""}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function TransactionsPage() {
  return <section className="table-card full-page-card"><div className="list-tools"><input placeholder="Search by customer or transaction ID" /><button>All fuel types⌄</button><button>18 Sep – 18 Oct⌄</button></div><TransactionTable /></section>;
}

function CustomersPage() {
  return (
    <section className="customer-grid">
      {[
        ["AK", "Andrew Kato", "34 visits", "12,480 pts", "High value"],
        ["SN", "Sarah Nakato", "28 visits", "8,250 pts", "Frequent"],
        ["MK", "Moses Kidega", "21 visits", "6,120 pts", "Frequent"],
        ["JA", "Joan Atim", "18 visits", "4,890 pts", "At risk"],
        ["DO", "David Otema", "15 visits", "3,400 pts", "New"],
        ["RN", "Rita Namusoke", "14 visits", "3,180 pts", "New"],
      ].map(([initials, name, visits, points, segment]) => (
        <article className="customer-card" key={name}><div className="customer-top"><span>{initials}</span><em>{segment}</em></div><h3>{name}</h3><p>Member since Jan 2026</p><div><span><b>{visits}</b> this year</span><span><b>{points}</b> balance</span></div><button>View customer <Arrow /></button></article>
      ))}
    </section>
  );
}

function RewardsPage() {
  return (
    <section className="management-grid">
      {[
        ["ACTIVE", "Fuel discount", "UGX 5,000 off", "1,000 pts", "82 redemptions"],
        ["ACTIVE", "Car wash", "Free standard wash", "1,800 pts", "51 redemptions"],
        ["ACTIVE", "Service", "15% off oil change", "2,200 pts", "24 redemptions"],
        ["DRAFT", "Store offer", "Free bottled water", "400 pts", "Not published"],
      ].map(([status, type, name, points, usage]) => (
        <article className="management-card" key={name}><div><span>{status}</span><button>•••</button></div><small>{type}</small><h3>{name}</h3><strong>{points}</strong><p>{usage}</p><button>Edit reward</button></article>
      ))}
      <button className="add-card"><b>＋</b><strong>Create a new reward</strong><span>Set points, availability, and limits</span></button>
    </section>
  );
}

function CampaignsPage() {
  return (
    <section className="campaign-layout">
      <article className="campaign-builder"><span>NEW SMS CAMPAIGN</span><h2>Bring customers back</h2><p>Send a targeted offer to customers who have not visited recently.</p><label>Audience<select><option>Inactive for 30+ days · 186 customers</option></select></label><label>Message<textarea defaultValue="We miss you at Makerere Fuel. Visit this Friday and earn double PumpPerks points on your fuel purchase." /></label><div className="message-meta"><span>112 / 160 characters</span><strong>Estimated cost: UGX 9,300</strong></div><button className="primary-button">Review and schedule <Arrow /></button></article>
      <aside className="phone-preview"><span>SMS PREVIEW</span><div><small>PUMPPERKS</small><p>We miss you at Makerere Fuel. Visit this Friday and earn double PumpPerks points on your fuel purchase.</p><em>Now</em></div></aside>
    </section>
  );
}

export default function App() {
  const [experience, setExperience] = useState<Experience>("overview");

  return (
    <div className="app-shell">
      <TopBar active={experience} onChange={setExperience} />
      {experience === "overview" && <Overview onChange={setExperience} />}
      {experience === "motorist" && <MotoristApp />}
      {experience === "station" && <StationPortal />}
    </div>
  );
}

import "./lowfi.css";
