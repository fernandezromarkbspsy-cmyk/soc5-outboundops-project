import { useEffect, useRef, useState, type ReactNode } from "react";

type IconName =
  | "grid"
  | "search"
  | "bell"
  | "mail"
  | "share"
  | "cloud"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "dots"
  | "dashboard"
  | "heart"
  | "note"
  | "calendar"
  | "reports"
  | "layers"
  | "building"
  | "contacts"
  | "laptop"
  | "settings"
  | "headset"
  | "arrow-up"
  | "arrow-down"
  | "info"
  | "users"
  | "coin"
  | "database"
  | "download"
  | "upload"
  | "more"
  | "plus"
  | "minus"
  | "expand"
  | "external"
  | "check";

function Icon({ name, size = 20, stroke = 1.8 }: { name: IconName; size?: number; stroke?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8 11 7.5-4.5M8 13l7.5 4.5" /></>,
    cloud: <><path d="M7 18.5h10.5a4 4 0 0 0 .4-8A6.1 6.1 0 0 0 6.4 9 4.9 4.9 0 0 0 7 18.5Z" /><path d="M12 11v8M9.5 16.5 12 19l2.5-2.5" /></>,
    "chevron-down": <path d="m7 10 5 5 5-5" />,
    "chevron-left": <path d="m15 18-6-6 6-6" />,
    "chevron-right": <path d="m9 18 6-6-6-6" />,
    dots: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    dashboard: <><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="9" rx="1" /><rect x="14" y="15" width="7" height="6" rx="1" /></>,
    heart: <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" />,
    note: <><path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 13h8M8 17h6" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></>,
    reports: <><path d="M5 20V10M12 20V4M19 20v-7" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    building: <><path d="M4 21h16M6 21V5h9v16M15 9h3v12M9 9h3M9 13h3M9 17h3" /></>,
    contacts: <><circle cx="12" cy="7" r="3" /><path d="M5 21v-2a7 7 0 0 1 14 0v2M18 7h1a3 3 0 0 1 0 6M19 21v-2a5 5 0 0 0-2-4" /></>,
    laptop: <><rect x="4" y="4" width="16" height="12" rx="1" /><path d="M2 20h20M9 16v4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-3v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-3h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3.6h3v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v3h-.2a1.7 1.7 0 0 0-1.5 1Z" /></>,
    headset: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4ZM20 14h-3v5h2a1 1 0 0 0 1-1v-4ZM17 19c0 2-2 2-5 2" /></>,
    "arrow-up": <><path d="M12 19V5M7 10l5-5 5 5" /></>,
    "arrow-down": <><path d="M12 5v14M17 14l-5 5-5-5" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    users: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="8" r="2" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 14a5 5 0 0 1 5 5v1" /></>,
    coin: <><circle cx="12" cy="12" r="8" /><path d="M14.5 9.5c-.5-.6-1.3-1-2.5-1-1.5 0-2.5.7-2.5 1.8 0 2.7 5 1.1 5 4 0 1.1-1 1.8-2.5 1.8-1.2 0-2.2-.4-2.8-1.2M12 7v10" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
    download: <><path d="M12 3v12M8 11l4 4 4-4M5 21h14" /></>,
    upload: <><path d="M12 15V3M8 7l4-4 4 4M5 21h14" /></>,
    more: <><circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    expand: <><path d="M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function PivoraMark() {
  return <span className="pivora-mark" aria-hidden="true"><i /><b /></span>;
}

function ToolButton({ children, label, className = "" }: { children: ReactNode; label: string; className?: string }) {
  return <button className={`tool-button ${className}`} aria-label={label}>{children}</button>;
}

const navItems: { label: string; icon: IconName }[] = [
  { label: "Dashboard", icon: "dashboard" }, { label: "Deals", icon: "heart" }, { label: "Notes", icon: "note" },
  { label: "Calendar", icon: "calendar" }, { label: "Reports", icon: "reports" }, { label: "Projects", icon: "layers" },
];

function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const [activeNav, setActiveNav] = useState("Dashboard");
  return (
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} aria-label="Workspace navigation">
      <div className="brand-row"><div className="brand-lockup"><PivoraMark /><span><strong>Pivora</strong><small>CRM Platform</small></span></div><button className="collapse-button" onClick={onClose} aria-label="Collapse navigation"><Icon name="chevron-left" size={18} /></button></div>
      <div className="profile-row"><img src="https://i.pravatar.cc/80?img=12" alt="Williams profile" /><span>williams@mesh.com</span><button aria-label="Open account menu"><Icon name="chevron-down" size={15} /></button></div>
      <nav className="primary-nav" aria-label="Main navigation">
        {navItems.map((item) => <button key={item.label} className={`nav-link ${activeNav === item.label ? "nav-active" : ""}`} onClick={() => setActiveNav(item.label)}><Icon name={item.icon} size={20} /><span>{item.label}</span></button>)}
      </nav>
      <section className="side-section favorites-section" aria-labelledby="favorites-title">
        <div className="side-section-title"><button className="section-toggle" aria-label="Collapse favorites"><Icon name="chevron-down" size={16} /></button><h2 id="favorites-title">Favorites</h2><button className="compact-icon" aria-label="Favorite options"><Icon name="dots" size={17} /></button><button className="compact-icon" aria-label="Add favorite"><Icon name="plus" size={17} /></button></div>
        <div className="favorite-links"><button><Icon name="building" size={19} /><span>Companies</span><b>1,212</b></button><button><Icon name="contacts" size={19} /><span>Contacts</span><b>898</b></button><button><Icon name="laptop" size={19} /><span>Meetings</span><b>32</b></button></div>
      </section>
      <section className="side-section projects-section" aria-label="Projects"><div className="side-section-title"><button className="section-toggle" aria-label="Expand projects"><Icon name="chevron-right" size={16} /></button><h2>Projects</h2><button className="compact-icon" aria-label="Project options"><Icon name="dots" size={17} /></button><button className="compact-icon" aria-label="Add project"><Icon name="plus" size={17} /></button></div></section>
      <div className="sidebar-bottom"><section className="storage-box" aria-label="Cloud storage"><div><strong>Cloud Storage</strong><span>90%</span></div><p>1.8 GB of 2 GB used</p><div className="storage-meter" aria-label="90 percent used"><i /></div><button>Upgrade Storage <small>(up to 25GB)</small><span className="round-arrow"><Icon name="chevron-right" size={15} /></span></button></section><div className="sidebar-footer"><button><Icon name="settings" size={20} /><span>Settings</span><Icon name="chevron-right" size={17} /></button><button><Icon name="headset" size={20} /><span>Help Center</span><Icon name="chevron-right" size={17} /></button></div></div>
    </aside>
  );
}

function MetricCard({ icon, label, value, change, trend, comparison }: { icon: IconName; label: string; value: string; change: string; trend: "up" | "down"; comparison: string }) {
  return <article className="metric-card reveal" data-reveal><div className="metric-header"><span className="metric-icon"><Icon name={icon} size={19} /></span><h2>{label}</h2><button aria-label={`${label} information`}><Icon name="info" size={19} /></button></div><div className="metric-value"><strong>{value}</strong><span className={trend === "up" ? "trend-up" : "trend-down"}><Icon name={trend === "up" ? "arrow-up" : "arrow-down"} size={13} /> {change}</span></div><p>{comparison}</p></article>;
}

function MoreButton({ label = "More options" }: { label?: string }) { return <button className="more-button" aria-label={label}><Icon name="more" size={18} /></button>; }

function RevenueChart() {
  const [period, setPeriod] = useState("1Y");
  const bars = [62, 45, 53, 35, 53, 18, 53, 45, 52, 26, 18, 22];
  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Des", "Jan", "Feb"];
  return (
    <article className="chart-card reveal" data-reveal><header className="chart-heading"><div><h2>Revenue <Icon name="chevron-down" size={16} /></h2><p><strong>$32.209</strong><span>+22% vs last month</span></p></div><div className="period-switch" aria-label="Chart period">{["1D", "1W", "1M", "6M", "1Y", "ALL"].map((item) => <button key={item} className={period === item ? "period-active" : ""} onClick={() => setPeriod(item)}>{item}</button>)}</div></header><div className="revenue-chart" aria-label="Revenue chart from March to February"><div className="axis-labels"><span>40k</span><span>30k</span><span>20k</span><span>10k</span><span>0k</span></div><div className="plot-area"><div className="grid-lines"><i /><i /><i /><i /><i /></div><svg className="trend-line" viewBox="0 0 700 210" preserveAspectRatio="none" aria-hidden="true"><path d="M25,180 L80,166 L135,187 L190,166 L245,147 L300,162 L355,130 L410,178 L465,128 L520,163 L575,174 L630,156" /></svg><div className="bars">{bars.map((height, index) => <div className="bar-column" key={months[index]}><span className={index === 8 ? "bar selected-bar" : "bar"} style={{ height: `${height}%` }} /></div>)}</div><div className="revenue-marker"><span /><i /></div><div className="chart-tooltip"><span>Sept, 2025</span><strong>$18.202 <em><Icon name="arrow-up" size={12} />2%</em></strong></div></div><div className="month-labels">{months.map((month) => <span className={month === "Nov" ? "month-current" : ""} key={month}>{month}</span>)}</div></div></article>
  );
}

function Meeting({ title, time, channel, avatars, plus = false }: { title: string; time: string; channel: string; avatars: string[]; plus?: boolean }) {
  return <div className="meeting"><div className="meeting-top"><strong>{title}</strong><span>{time}</span></div><div className="meeting-bottom"><div className="avatar-stack">{avatars.map((id) => <img src={`https://i.pravatar.cc/40?img=${id}`} alt="" key={id} />)}{plus && <i>+7</i>}</div><button>{channel} <Icon name="chevron-right" size={15} /></button></div></div>;
}

function CalendarPanel() {
  const [selectedDate, setSelectedDate] = useState(8);
  const dates = [5, 6, 7, 8, 9, 10, 11];
  return <article className="calendar-card reveal" data-reveal><header className="panel-heading"><h2>Calendar</h2><MoreButton label="Calendar options" /></header><div className="month-nav"><button aria-label="Previous month"><Icon name="chevron-left" size={18} /></button><strong>October 2025</strong><button aria-label="Next month"><Icon name="chevron-right" size={18} /></button></div><div className="calendar-days" role="grid" aria-label="October 2025">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day}>{day}</span>)}{dates.map((date) => <button key={date} onClick={() => setSelectedDate(date)} className={date === selectedDate ? "date-selected" : ""}>{date}</button>)}</div><div className="meeting-list"><Meeting title="Mesh Weekly Meeting" time="9.00 am - 10.00 am" channel="On Google Meet" avatars={["15", "28", "45"]} plus /><Meeting title="Gamification Demo" time="10.45 am - 11.45 am" channel="On Slack" avatars={["32", "47", "49"]} /></div></article>;
}

function LeadsManagement() {
  const [tab, setTab] = useState("Status");
  const rows = [{ label: "Qualified", value: 88 }, { label: "Contacted", value: 68 }, { label: "Lost", value: 18 }, { label: "Won", value: 82 }];
  return <article className="leads-card reveal" data-reveal><header className="panel-heading"><h2>Leads Management</h2><MoreButton label="Lead management options" /></header><div className="lead-tabs">{["Status", "Sources", "Qualification"].map((item) => <button className={tab === item ? "lead-tab-active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</div><div className="lead-bars">{rows.map((row) => <div className="lead-row" key={row.label}><span>{row.label}</span><div><i style={{ width: `${row.value}%` }} /></div></div>)}</div></article>;
}

function MapIllustration() {
  return <svg className="asia-map" viewBox="0 0 320 220" aria-label="Sales distribution map of Asia Pacific" role="img"><defs><linearGradient id="mapFade" x1="0" x2="1"><stop stopColor="#e7e1ff"/><stop offset="1" stopColor="#fcfbff"/></linearGradient></defs><rect width="320" height="220" fill="url(#mapFade)" /><g fill="#ddd6fe" stroke="#fff" strokeWidth="1.2"><path d="M0 38 18 21l16 13 17-4 15 10-4 18-21 8-19-7-22 4Z"/><path d="m69 31 17 5 12 19-10 21-21-3-11-18Z"/><path d="m102 15 35 2 15 19-10 24-30 11-19-17 7-24Z"/><path d="m145 34 31-8 30 18-4 21-25 6-23-14Z"/><path d="m194 44 31-7 26 12 1 19-20 13-25-8Z"/><path d="m243 66 29-7 24 14-7 22-30 1-14-13Z"/><path d="m38 76 32-9 29 18-9 29-35 3-20-20Z"/><path d="m94 67 29-8 24 16-5 31-23 12-24-18Z"/><path d="m145 72 38-9 19 22-11 31-29 7-22-21Z"/><path d="m202 83 31-7 20 17-9 28-27 3-18-17Z"/><path d="m108 113 25-9 21 19-9 32-22 5-18-20Z"/><path d="m159 116 24-9 29 17-8 31-30 6-19-18Z"/></g><g fill="#6538de" stroke="#fff" strokeWidth="1.2"><path d="m101 90 14-12 18 5 2 15-15 12-14-5Z"/><path d="m119 107 18-9 12 12-5 19-17 5-13-12Z"/><path d="m143 129 23-12 20 9-2 23-23 9-17-13Z"/><path d="m169 147 29-14 30 13 5 28-27 14-32-13Z"/><path d="m111 137 19-2 11 17-8 18-19-4-7-14Z"/><path d="m223 190 12-6 13 8-7 12-13-2Z"/></g><g fill="#a78bfa"><circle cx="259" cy="141" r="4"/><circle cx="283" cy="154" r="3"/><circle cx="298" cy="132" r="3"/></g></svg>;
}

function TopCountry() {
  const countries = [["australia", "Australia", "48%"], ["malaysia", "Malaysia", "33%"], ["indonesia", "Indonesia", "25%"], ["singapore", "Singapore", "17%"]];
  return <article className="country-card reveal" data-reveal><div className="map-box"><MapIllustration /><button aria-label="Expand map"><Icon name="expand" size={17} /></button><div className="map-zoom"><button aria-label="Zoom in"><Icon name="plus" size={15} /></button><button aria-label="Zoom out"><Icon name="minus" size={15} /></button></div></div><div className="country-side"><header className="panel-heading"><h2>Top Country</h2><MoreButton label="Country options" /></header><ol className="country-list">{countries.map(([flag, name, value], index) => <li key={name}><span>{index + 1}</span><i className={`flag flag-${flag}`} /><b>{name}</b><strong>{value}</strong></li>)}</ol><button className="view-more">View more <Icon name="arrow-up" size={17} /></button></div></article>;
}

function RetentionRate() {
  const bars = [{ month: "Jun", a: 33, b: 25, c: 35 }, { month: "Jul", a: 20, b: 24, c: 35 }, { month: "Aug", a: 32, b: 31, c: 37 }, { month: "Sep", a: 20, b: 40, c: 31 }, { month: "Oct", a: 0, b: 0, c: 2 }, { month: "Nov", a: 0, b: 0, c: 2 }, { month: "Dec", a: 0, b: 0, c: 2 }];
  return <article className="retention-card reveal" data-reveal><header className="panel-heading"><div><h2>Retention Rate</h2><p><strong>95%</strong><span>+12% vs last month</span></p></div><MoreButton label="Retention options" /></header><div className="retention-legend"><span><i className="legend-sme" />SMEs</span><span><i className="legend-startup" />Startups</span><span><i className="legend-enterprise" />Enterprises</span></div><div className="retention-bars">{bars.map((bar) => <div className={`retention-column ${bar.month === "Sep" ? "retention-current" : ""}`} key={bar.month}><div className="retention-stack"><i style={{ height: `${bar.a}px` }} /><i style={{ height: `${bar.b}px` }} /><i style={{ height: `${bar.c}px` }} /></div><span>{bar.month}</span></div>)}</div></article>;
}

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const appRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const nodes = appRef.current?.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!nodes) return;
    const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }); }, { threshold: 0.08 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return <div className="app-canvas" ref={appRef}>{mobileMenuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}<Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} /><main className="dashboard-main"><header className="topbar"><div className="page-title"><button className="mobile-menu" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation"><span /><span /><span /></button><Icon name="grid" size={25} /><h1>Dashboard</h1></div><div className="top-actions"><label className="search-field"><Icon name="search" size={21} /><input placeholder="Search AI Mode" aria-label="Search AI Mode" /></label><ToolButton label="Notifications" className="notification-button"><Icon name="bell" size={21} /><i>1</i></ToolButton><ToolButton label="Messages" className="message-button"><Icon name="mail" size={21} /><i>121</i></ToolButton><ToolButton label="Share"><Icon name="share" size={21} /></ToolButton></div></header><section className="workspace-header"><p><Icon name="check" size={19} />Last updated now</p><div><button className="outline-action"><Icon name="note" size={20} />Customize Widget</button><button className="split-action"><Icon name="cloud" size={20} />Imports <span><Icon name="chevron-down" size={17} /></span></button><button className="split-action primary-action"><Icon name="cloud" size={20} />Exports <span><Icon name="chevron-down" size={17} /></span></button></div></section><section className="metrics-grid" aria-label="Performance overview"><MetricCard icon="users" label="Leads" value="129" change="2%" trend="up" comparison="vs last week" /><MetricCard icon="users" label="CLV" value="14d" change="4%" trend="down" comparison="vs last week" /><MetricCard icon="coin" label="Conversion Rate" value="24%" change="2%" trend="up" comparison="vs last week" /><MetricCard icon="database" label="Revenue" value="$1.4K" change="4%" trend="down" comparison="vs last month" /></section><section className="dashboard-grid" aria-label="Dashboard widgets"><RevenueChart /><CalendarPanel /><div className="lower-pair"><LeadsManagement /><TopCountry /></div><RetentionRate /></section></main></div>;
}