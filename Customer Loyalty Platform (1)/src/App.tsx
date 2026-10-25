import { lazy, Suspense, useState } from "react";
import { Icon, type IconName } from "./icons";
import { MotoristApp } from "./mvp/MotoristApp";
import { PumpPerksProvider } from "./mvp/PumpPerksProvider";
import { StationApp } from "./mvp/StationApp";

const LowFiApp = lazy(() => import("./LowFiApp"));

type View = "home" | "driver" | "station";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1723021939081-31f4ab31456a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=85&w=1600";

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-symbol"><Icon name="bolt" size={17} /></span>
      <span>Pump<span>Perks</span></span>
    </div>
  );
}

function Header({ view, setView }: { view: View; setView: (view: View) => void }) {
  const [open, setOpen] = useState(false);
  const navigate = (next: View) => {
    setView(next);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <header className="hi-header">
      <button className="brand-button" onClick={() => navigate("home")}><Brand /></button>
      <nav className={open ? "header-nav open" : "header-nav"}>
        <button className={view === "home" ? "active" : ""} onClick={() => navigate("home")}>Why PumpPerks</button>
        <button className={view === "driver" ? "active" : ""} onClick={() => navigate("driver")}>For motorists</button>
        <button className={view === "station" ? "active" : ""} onClick={() => navigate("station")}>For stations</button>
        <button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>Pricing</button>
      </nav>
      <div className="header-actions">
        <button className="text-button" onClick={() => navigate("station")}>Sign in</button>
        <button className="lime-button" onClick={() => navigate("station")}>Station portal <Icon name="arrow" size={16} /></button>
        <button className="menu-button" aria-label="Open menu" onClick={() => setOpen(!open)}><Icon name="menu" /></button>
      </div>
    </header>
  );
}

function HomePage({ setView }: { setView: (view: View) => void }) {
  return (
    <main>
      <section className="hi-hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-kicker"><span /><b>Built for Uganda’s fuel economy</b></div>
          <h1>Fuel loyalty.<br /><em>Finally rewarding.</em></h1>
          <p>PumpPerks helps every petrol station turn everyday fill-ups into lasting relationships—while motorists earn more from every litre.</p>
          <div className="hero-buttons">
            <button className="lime-button large" onClick={() => setView("station")}>Open station portal <Icon name="arrow" /></button>
            <button className="ghost-button" onClick={() => setView("driver")}><span><Icon name="phone" /></span> Explore the app</button>
          </div>
          <div className="hero-proof">
            <div className="avatars"><span>AK</span><span>SN</span><span>MK</span><span>+2k</span></div>
            <div><b>Trusted by everyday motorists</b><small>Rewards without cards or complications</small></div>
          </div>
        </div>
        <div className="hero-visual">
          <img src={HERO_IMAGE} alt="Petrol station illuminated at night" />
          <div className="hero-overlay" />
          <div className="earned-toast">
            <span><Icon name="check" /></span>
            <div><small>POINTS EARNED</small><b>+340 points</b><p>Makerere Hill Station · just now</p></div>
          </div>
          <div className="balance-card">
            <div><Brand light /><span className="live-pill">LIVE</span></div>
            <small>YOUR REWARD BALANCE</small>
            <strong>2,480 <i>pts</i></strong>
            <span className="balance-value">≈ UGX 12,400 in rewards</span>
            <div className="progress"><i /></div>
            <div className="balance-footer"><span>520 pts to your next reward</span><b>83%</b></div>
          </div>
          <div className="image-credit">Photo by Kingsley Hemans on Unsplash</div>
        </div>
      </section>

      <section className="trust-bar">
        <span>BUILT FOR EVERY FUEL RETAILER</span>
        {["Independent stations", "Growing chains", "Fuel companies", "Fleet operators"].map((item) => <b key={item}><i />{item}</b>)}
      </section>

      <section className="hi-section opportunity">
        <div className="section-lead">
          <span className="section-tag">THE OPPORTUNITY</span>
          <h2>Turn passing traffic into <em>loyal customers.</em></h2>
          <p>Most independent stations know the faces of their regulars, but not the data behind them. PumpPerks changes that.</p>
        </div>
        <div className="benefit-grid">
          {[
            ["people", "Know your customers", "See who visits, what they spend, and when they are likely to return.", "Customer intelligence"],
            ["gift", "Reward real loyalty", "Offer fuel discounts, car washes, and custom perks customers actually value.", "Flexible rewards"],
            ["send", "Bring them back", "Reach the right customers with timely, targeted SMS promotions.", "Smart campaigns"],
          ].map(([icon, title, copy, label], index) => (
            <article className={`benefit-card card-${index + 1}`} key={title}>
              <div className="benefit-icon"><Icon name={icon as IconName} size={25} /></div>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <div>{label}<Icon name="arrow" size={16} /></div>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section">
        <div className="section-lead centered">
          <span className="section-tag dark-tag">HOW IT WORKS</span>
          <h2>Three steps. Zero friction.</h2>
          <p>No plastic cards. No long forms. Just a phone number and a better reason to return.</p>
        </div>
        <div className="steps">
          {[
            ["phone", "Join in seconds", "Register with a phone number through the app, QR code, or USSD."],
            ["station", "Fuel as usual", "An attendant records the purchase securely at any partner station."],
            ["gift", "Earn and enjoy", "Points arrive instantly and can be redeemed for rewards at the till."],
          ].map(([icon, title, copy], index) => (
            <article key={title}>
              <span className="step-number">0{index + 1}</span>
              <div className="step-icon"><Icon name={icon as IconName} size={28} /></div>
              <h3>{title}</h3><p>{copy}</p>
              {index < 2 && <i className="step-line" />}
            </article>
          ))}
        </div>
      </section>

      <section className="product-showcase">
        <div className="showcase-copy">
          <span className="section-tag">FOR MOTORISTS</span>
          <h2>Your fuel spend should take you further.</h2>
          <p>One account. Every partner station. Clear points, useful rewards, and no card to remember.</p>
          <ul>
            {["Earn automatically with your phone number", "See points and rewards in real time", "Works through app, QR, SMS, and USSD"].map((item) => <li key={item}><span><Icon name="check" size={15} /></span>{item}</li>)}
          </ul>
          <button className="forest-button" onClick={() => setView("driver")}>Explore the motorist app <Icon name="arrow" /></button>
        </div>
        <div className="showcase-device">
          <AppPhone />
          <div className="reward-float"><span><Icon name="gift" /></span><div><small>NEXT REWARD</small><b>Free car wash</b><p>320 points to go</p></div></div>
        </div>
      </section>

      <section className="station-showcase">
        <div className="section-lead centered">
          <span className="section-tag">FOR STATIONS</span>
          <h2>See what’s happening.<br />Know what to do next.</h2>
          <p>A clear operating picture of your loyalty programme, from every transaction to your next campaign.</p>
        </div>
        <DashboardPreview />
        <button className="forest-button dashboard-cta" onClick={() => setView("station")}>Open the station experience <Icon name="arrow" /></button>
      </section>

      <Pricing setView={setView} />
      <section className="final-cta">
        <div><span className="section-tag dark-tag">START YOUR PILOT</span><h2>Make your next customer<br />a regular customer.</h2></div>
        <div><p>Join the first generation of independent Ugandan stations building loyalty with data.</p><button className="lime-button large" onClick={() => setView("station")}>Open station portal <Icon name="arrow" /></button></div>
      </section>
      <Footer />
    </main>
  );
}

function AppPhone() {
  return (
    <div className="app-phone">
      <div className="phone-top"><span>9:41</span><i /><b>● )))</b></div>
      <div className="phone-user"><div><small>GOOD MORNING</small><b>Andrew</b></div><span>AK</span></div>
      <div className="mobile-balance"><small>AVAILABLE BALANCE</small><strong>2,480 <i>pts</i></strong><div><span>Worth UGX 12,400</span><button>Use points</button></div></div>
      <div className="quick-grid">
        <button><span><Icon name="qr" /></span>My QR</button>
        <button><span><Icon name="pin" /></span>Stations</button>
        <button><span><Icon name="gift" /></span>Rewards</button>
      </div>
      <div className="phone-section-title"><b>Nearby offer</b><span>See all</span></div>
      <div className="nearby-offer"><div className="offer-photo"><img src={HERO_IMAGE} alt="" /><span>2× POINTS</span></div><div><b>Friday fuel boost</b><p>Makerere Hill · 1.2 km</p></div><Icon name="chevron" size={16} /></div>
      <div className="phone-section-title"><b>Recent activity</b><span>View all</span></div>
      <div className="activity-row"><span><Icon name="station" size={16} /></span><div><b>Makerere Hill Station</b><small>Today · UGX 85,000</small></div><strong>+340</strong></div>
      <div className="phone-tabs"><span className="active"><Icon name="home" size={17} />Home</span><span><Icon name="gift" size={17} />Rewards</span><span><Icon name="clock" size={17} />Activity</span><span><Icon name="people" size={17} />Profile</span></div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="dashboard-preview">
      <aside><Brand light /><div className="mini-station"><span>MF</span><div><b>Makerere Fuel</b><small>Kampala · Station 01</small></div></div>{[["dashboard","Overview"],["wallet","Transactions"],["people","Customers"],["gift","Rewards"],["send","Campaigns"]].map(([icon,label], index) => <span className={index === 0 ? "active" : ""} key={label}><Icon name={icon as IconName} size={16} />{label}</span>)}</aside>
      <div className="dash-body">
        <div className="dash-head"><div><small>MONDAY, 18 SEPTEMBER</small><h3>Good morning, Andrew</h3></div><button><Icon name="plus" size={15} /> Record purchase</button></div>
        <div className="metric-row">{[["LOYALTY REVENUE","UGX 48.2M","+8.7%"],["ACTIVE CUSTOMERS","842","+68"],["POINTS REDEEMED","124K","18.2%"]].map(([label,value,change]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{change} <i>this month</i></small></div>)}</div>
        <div className="dash-grid">
          <article><div><span>TRANSACTION ACTIVITY</span><b>Purchases this month</b></div><div className="hi-chart">{[38,51,44,66,56,81,74,92,71,85,78,96].map((height,index) => <i key={index} style={{height:`${height}%`}} />)}</div><div className="chart-dates"><span>01 Sep</span><span>10 Sep</span><span>20 Sep</span><span>30 Sep</span></div></article>
          <article className="top-rewards"><div><span>TOP REWARDS</span><b>Most redeemed</b></div>{[["Fuel discount","82","68%"],["Free car wash","51","46%"],["Shop discount","29","28%"]].map(([label,count,width]) => <section key={label}><div><b>{label}</b><span>{count}</span></div><i><em style={{width}} /></i></section>)}</article>
        </div>
      </div>
    </div>
  );
}

function Pricing({ setView }: { setView: (view: View) => void }) {
  const plans = [
    ["Starter", "150,000", "For independent stations ready to build repeat business.", ["Points and rewards", "Attendant transaction tool", "Customer SMS confirmations"]],
    ["Growth", "300,000", "For stations ready to understand and engage customers.", ["Everything in Starter", "Customer analytics", "Targeted SMS campaigns"]],
    ["Enterprise", "Custom", "For fuel companies and multi-branch station networks.", ["Multi-station management", "Consolidated reporting", "POS integration support"]],
  ];
  return (
    <section className="pricing hi-section" id="pricing">
      <div className="section-lead centered"><span className="section-tag">SIMPLE PRICING</span><h2>Start lean. Grow confidently.</h2><p>Try PumpPerks with a three-month pilot before choosing the plan that fits.</p></div>
      <div className="plans">{plans.map(([name,price,copy,features],index) => <article className={index === 1 ? "featured" : ""} key={name as string}>{index === 1 && <span className="recommended">MOST POPULAR</span>}<h3>{name as string}</h3><p>{copy as string}</p><div className="plan-price">{price !== "Custom" && <small>UGX</small>}<strong>{price as string}</strong>{price !== "Custom" && <span>/ month</span>}</div><ul>{(features as string[]).map(feature => <li key={feature}><Icon name="check" size={15} />{feature}</li>)}</ul><button className={index === 1 ? "lime-button" : "plan-button"} onClick={() => setView("station")}>{index === 2 ? "Open station portal" : "Start your pilot"}<Icon name="arrow" size={16} /></button></article>)}</div>
    </section>
  );
}

function Footer() {
  return <footer className="hi-footer"><div><Brand light /><p>Every fuel-up deserves a reward.</p></div><div><span>PRODUCT</span><button>For motorists</button><button>For stations</button><button>Pricing</button></div><div><span>COMPANY</span><button>About us</button><button>Contact</button><button>Privacy</button></div><div><span>GET IN TOUCH</span><b>hello@pumpperks.ug</b><b>+256 756 365 310</b></div><small>© 2026 PumpPerks Uganda. Built at Makerere University.</small></footer>;
}

function HighFiApp() {
  const [view, setViewState] = useState<View>(initialView);
  const setView = (next: View) => {
    const url = new URL(window.location.href);
    if (next === "home") url.searchParams.delete("app");
    else url.searchParams.set("app", next === "driver" ? "motorist" : "station");
    window.history.replaceState({}, "", url);
    setViewState(next);
  };
  return <div className="high-fi"><Header view={view} setView={setView} />{view === "home" && <HomePage setView={setView} />}{view === "driver" && <MotoristApp />}{view === "station" && <StationApp />}</div>;
}

function initialView(): View {
  const app = new URLSearchParams(window.location.search).get("app");
  if (app === "motorist" || app === "driver") return "driver";
  if (app === "station") return "station";
  return "home";
}

export default function App() {
  const lowFi = window.location.pathname.startsWith("/low-fi");
  if (lowFi) return <Suspense fallback={<div className="route-loader">Loading low-fi prototype…</div>}><LowFiApp /></Suspense>;
  return <PumpPerksProvider><HighFiApp /></PumpPerksProvider>;
}
