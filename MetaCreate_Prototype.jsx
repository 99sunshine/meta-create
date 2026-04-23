import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import _ from "lodash";

// ═══════════════════════════════════════════════
// MetaCreate — Interactive Prototype v3.3
// Dark Cosmic Theme | All 7 P0 Features
// + RedBook Project Gallery + Team Matching
// ═══════════════════════════════════════════════

// ─── CONSTANTS & DATA ───────────────────────────
const ROLES = {
  visionary: { icon: "🔥", label: "Visionary", desc: "Ideas, big picture, energy", color: "#FF6B35" },
  builder: { icon: "⚙️", label: "Builder", desc: "Code, design, prototype, make things", color: "#4EA8DE" },
  strategist: { icon: "🧭", label: "Strategist", desc: "Plan, analyze, manage, de-risk", color: "#7B68EE" },
  connector: { icon: "🌏", label: "Connector", desc: "Bridge people, disciplines, resources", color: "#2ECC71" },
};

const DOMAIN_COLORS = {
  Engineering: "#4EA8DE", Design: "#9B59B6", Arts: "#FF6B35",
  Science: "#2ECC71", Business: "#F1C40F",
};

const DOMAIN_EMOJIS = {
  Engineering: "🚀", Design: "🎨", Arts: "🎭", Science: "🔬", Business: "💼",
};

const SKILLS = [
  "JavaScript", "Python", "React", "UI/UX Design", "Machine Learning", "Data Science",
  "Product Management", "Graphic Design", "3D Modeling", "Video Editing", "Writing",
  "Public Speaking", "Business Strategy", "Marketing", "Robotics", "Game Development",
  "Mobile Dev", "Cloud/DevOps", "Blockchain", "AR/VR", "Hardware", "Music Production",
  "Photography", "Animation", "Research", "Prototyping", "CAD", "Sustainability",
];

const INTERESTS = [
  "Space Exploration", "AI & Ethics", "Climate Tech", "Education", "Healthcare",
  "Future Cities", "Digital Art", "Social Impact", "Gaming", "Biotech",
  "Quantum Computing", "Neuroscience", "Philosophy", "Entrepreneurship", "Music",
  "Film & Media", "Architecture", "Food Tech", "Fashion Tech", "Web3",
];

const COLLAB_STYLES = ["Async-first", "Daily syncs", "Weekend sprints", "Flexible / hybrid"];

const HACKATHON_TRACKS = [
  { id: "engineering", label: "Space Engineering & Technology", icon: "🚀" },
  { id: "society", label: "Space Society & Governance", icon: "🏛️" },
  { id: "aesthetics", label: "Space Aesthetics & Design", icon: "🎨" },
  { id: "open", label: "Open Innovation", icon: "💡" },
];

const AI_TAGS_POOL = [
  "Systems Thinker", "Creative Catalyst", "Data Whisperer", "Future Architect",
  "Bridge Builder", "Rapid Prototyper", "Story Weaver", "Pattern Finder",
  "Community Spark", "Technical Poet", "Design Philosopher", "Code Artisan",
  "Impact Driver", "Curiosity Engine", "Boundary Crosser", "Moonshot Dreamer",
  "Empathy Navigator", "Logic Sculptor", "Chaos Organizer", "Vision Translator",
];

// Richer work/project data for the gallery
const ALL_WORKS = [
  { id: "w1", title: "Lunar Habitat VR", domain: "Engineering", userId: "u1", desc: "VR walkthrough of a modular lunar base designed for 50 inhabitants. Built with Three.js and WebXR.", tags: ["VR", "Space", "3D"], likes: 47, comments: 12, coverHue: 210, aspectRatio: 1.2 },
  { id: "w2", title: "Neural Garden", domain: "Arts", userId: "u1", desc: "Interactive art installation using brainwave data to grow virtual plants in real-time. EEG headset + p5.js.", tags: ["BCI", "Generative", "Interactive"], likes: 83, comments: 24, coverHue: 25, aspectRatio: 0.8 },
  { id: "w3", title: "EduBridge", domain: "Science", userId: "u2", desc: "Platform connecting rural students with urban mentors through AI-powered skill matching and adaptive learning paths.", tags: ["EdTech", "AI", "Social Impact"], likes: 61, comments: 18, coverHue: 140, aspectRatio: 1.0 },
  { id: "w4", title: "Carbon Mapper", domain: "Science", userId: "u3", desc: "Real-time carbon footprint tracker for university campuses. Satellite data + IoT sensors + beautiful dashboard.", tags: ["Climate", "Data Viz", "IoT"], likes: 55, comments: 9, coverHue: 160, aspectRatio: 1.3 },
  { id: "w5", title: "Orbital Aesthetics", domain: "Design", userId: "u4", desc: "Complete visual identity system for a space tourism company. Logo, wayfinding, zero-G packaging, AR companions.", tags: ["Branding", "Space", "AR"], likes: 112, comments: 31, coverHue: 280, aspectRatio: 0.7 },
  { id: "w6", title: "Silk Road AR", domain: "Arts", userId: "u4", desc: "Augmented reality experience mapping ancient Silk Road trade routes onto modern cities. Walk through history.", tags: ["AR", "History", "Cultural"], likes: 76, comments: 19, coverHue: 35, aspectRatio: 1.1 },
  { id: "w7", title: "NeuroNav", domain: "Engineering", userId: "u5", desc: "ML-powered autonomous navigation for spacecraft. Reinforcement learning agent trained on 10M simulated trajectories.", tags: ["ML", "Space", "Robotics"], likes: 39, comments: 7, coverHue: 200, aspectRatio: 0.9 },
  { id: "w8", title: "Echoes of 2050", domain: "Arts", userId: "u6", desc: "Interactive narrative game exploring three possible futures. Choice-driven story with 47 branching paths and 6 endings.", tags: ["Game", "Narrative", "Speculative"], likes: 94, comments: 28, coverHue: 310, aspectRatio: 1.4 },
  { id: "w9", title: "Green Grid", domain: "Business", userId: "u8", desc: "Community-powered urban farming network connecting 50+ rooftop gardens. App + marketplace + impact tracking.", tags: ["AgriTech", "Community", "Sustainability"], likes: 68, comments: 15, coverHue: 120, aspectRatio: 1.0 },
  { id: "w10", title: "Quantum Canvas", domain: "Arts", userId: "u6", desc: "Art pieces generated from quantum random number generators. Each piece is provably unique — truly random beauty.", tags: ["Quantum", "Generative", "NFT"], likes: 52, comments: 11, coverHue: 260, aspectRatio: 0.85 },
  { id: "w11", title: "MindMeld VR", domain: "Engineering", userId: "u1", desc: "Multiplayer VR workspace where team members can see each other's thought maps and co-create in spatial 3D.", tags: ["VR", "Collaboration", "Spatial"], likes: 88, comments: 22, coverHue: 190, aspectRatio: 1.15 },
  { id: "w12", title: "Policy Simulator", domain: "Science", userId: "u3", desc: "Agent-based simulation of policy impacts on urban inequality. 10,000 synthetic citizens, real-time visualization.", tags: ["Simulation", "Policy", "Data"], likes: 43, comments: 8, coverHue: 170, aspectRatio: 1.0 },
];

const MOCK_USERS = [
  {
    id: "u1", name: "Kai Zhang", avatar: "KZ", city: "Beijing", school: "Peking University",
    role: "builder", skills: ["React", "Python", "3D Modeling", "AR/VR"],
    interests: ["Space Exploration", "AI & Ethics", "Gaming"],
    tags: ["Code Artisan", "Rapid Prototyper", "Systems Thinker", "Technical Poet", "Moonshot Dreamer", "Future Architect"],
    manifesto: "I turn wild ideas into working prototypes — the messier the problem, the more I thrive.",
    collabStyle: "Weekend sprints", availability: "available", hackathonTrack: "engineering",
  },
  {
    id: "u2", name: "Sophia Chen", avatar: "SC", city: "New York", school: "Columbia University",
    role: "visionary", skills: ["Product Management", "Writing", "Public Speaking", "Business Strategy"],
    interests: ["Social Impact", "Education", "Climate Tech", "Future Cities"],
    tags: ["Creative Catalyst", "Vision Translator", "Community Spark", "Impact Driver", "Empathy Navigator", "Story Weaver"],
    manifesto: "Every big change starts with a conversation nobody expected. I start those conversations.",
    collabStyle: "Daily syncs", availability: "available", hackathonTrack: "society",
  },
  {
    id: "u3", name: "Marcus Rivera", avatar: "MR", city: "New York", school: "Columbia University",
    role: "strategist", skills: ["Data Science", "Marketing", "Research", "Sustainability"],
    interests: ["Climate Tech", "Biotech", "Entrepreneurship", "AI & Ethics"],
    tags: ["Pattern Finder", "Data Whisperer", "Logic Sculptor", "Chaos Organizer", "Boundary Crosser", "Systems Thinker"],
    manifesto: "I find the signal in the noise and build the roadmap nobody else can see.",
    collabStyle: "Async-first", availability: "available", hackathonTrack: "open",
  },
  {
    id: "u4", name: "Yuki Tanaka", avatar: "YT", city: "Beijing", school: "Tsinghua University",
    role: "connector", skills: ["UI/UX Design", "Graphic Design", "Photography", "Animation"],
    interests: ["Digital Art", "Architecture", "Film & Media", "Fashion Tech"],
    tags: ["Design Philosopher", "Bridge Builder", "Curiosity Engine", "Creative Catalyst", "Story Weaver", "Empathy Navigator"],
    manifesto: "Design is my language for connecting worlds that don't know they need each other.",
    collabStyle: "Flexible / hybrid", availability: "available", hackathonTrack: "aesthetics",
  },
  {
    id: "u5", name: "Lena Okafor", avatar: "LO", city: "Beijing", school: "Peking University",
    role: "builder", skills: ["Machine Learning", "Python", "Cloud/DevOps", "Robotics"],
    interests: ["Space Exploration", "Neuroscience", "Quantum Computing", "Healthcare"],
    tags: ["Data Whisperer", "Future Architect", "Systems Thinker", "Rapid Prototyper", "Logic Sculptor", "Moonshot Dreamer"],
    manifesto: "I teach machines to think, so humans can dream bigger.",
    collabStyle: "Async-first", availability: "busy", hackathonTrack: "engineering",
  },
  {
    id: "u6", name: "Amir Hassan", avatar: "AH", city: "New York", school: "Columbia University",
    role: "visionary", skills: ["Writing", "Video Editing", "Music Production", "Game Development"],
    interests: ["Gaming", "Philosophy", "Film & Media", "Web3"],
    tags: ["Story Weaver", "Creative Catalyst", "Moonshot Dreamer", "Curiosity Engine", "Vision Translator", "Boundary Crosser"],
    manifesto: "I build worlds in code, words, and sound — then invite everyone inside.",
    collabStyle: "Weekend sprints", availability: "available", hackathonTrack: "open",
  },
  {
    id: "u7", name: "Chen Wei", avatar: "CW", city: "Beijing", school: "Peking University",
    role: "strategist", skills: ["Business Strategy", "Product Management", "Data Science", "Marketing"],
    interests: ["Entrepreneurship", "AI & Ethics", "Education", "Social Impact"],
    tags: ["Chaos Organizer", "Pattern Finder", "Impact Driver", "Systems Thinker", "Logic Sculptor", "Bridge Builder"],
    manifesto: "Strategy without heart is just spreadsheets. I bring both.",
    collabStyle: "Daily syncs", availability: "available", hackathonTrack: "society",
  },
  {
    id: "u8", name: "Priya Sharma", avatar: "PS", city: "New York", school: "Columbia University",
    role: "connector", skills: ["Public Speaking", "Marketing", "Photography", "Sustainability"],
    interests: ["Climate Tech", "Social Impact", "Food Tech", "Architecture"],
    tags: ["Community Spark", "Empathy Navigator", "Bridge Builder", "Creative Catalyst", "Vision Translator", "Impact Driver"],
    manifesto: "I connect the dots between people, ideas, and movements — and sparks fly.",
    collabStyle: "Flexible / hybrid", availability: "available", hackathonTrack: "aesthetics",
  },
];

const MOCK_TEAMS = [
  {
    id: "t1", name: "Orbital Architects", desc: "Designing the ultimate space habitat for 1000 people. We're tackling life-support, radiation shielding, and modular construction.",
    category: "Engineering", track: "engineering", members: ["u1", "u5"],
    lookingFor: ["visionary", "strategist"], chatLink: "https://discord.gg/example",
    tags: ["Space", "Hardware", "Systems"],
  },
  {
    id: "t2", name: "New Eden Council", desc: "Building governance frameworks for space colonies. How do you run a democracy in zero gravity?",
    category: "Society", track: "society", members: ["u2", "u7"],
    lookingFor: ["builder", "connector"], chatLink: "",
    tags: ["Governance", "Policy", "Ethics"],
  },
  {
    id: "t3", name: "Cosmos Canvas", desc: "Creating the visual identity for humanity's first off-world settlement. From wayfinding to zero-G fashion.",
    category: "Design", track: "aesthetics", members: ["u4"],
    lookingFor: ["builder", "visionary", "strategist"], chatLink: "https://discord.gg/example2",
    tags: ["Design", "Branding", "AR"],
  },
  {
    id: "t4", name: "AstroPlay", desc: "Making a multiplayer space exploration game that teaches real orbital mechanics. Fun meets physics.",
    category: "Open", track: "open", members: ["u6"],
    lookingFor: ["builder", "connector", "strategist"], chatLink: "",
    tags: ["Gaming", "Education", "Simulation"],
  },
  {
    id: "t5", name: "BioSphere One", desc: "Designing closed-loop ecosystems for long-term space habitation. Plants, algae, and recycling systems.",
    category: "Engineering", track: "engineering", members: ["u3"],
    lookingFor: ["builder", "visionary"], chatLink: "https://discord.gg/example3",
    tags: ["Biology", "Sustainability", "Systems"],
  },
];

// ─── METAFIRE MASCOT SVG ────────────────────────
const MetaFire = ({ expression = "default", size = 48 }) => {
  const expressions = {
    default: { eyes: "◆ ◆", mouth: "" },
    happy: { eyes: "◆ ◆", mouth: "‿" },
    excited: { eyes: "★ ★", mouth: "▽" },
    thinking: { eyes: "◆ ◇", mouth: "~" },
    celebrating: { eyes: "✦ ✦", mouth: "▽" },
    waving: { eyes: "◆ ◆", mouth: "‿" },
  };
  const exp = expressions[expression] || expressions.default;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <linearGradient id={`fg${size}`} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#4A7BD4" />
            <stop offset="50%" stopColor="#8B6BAE" />
            <stop offset="100%" stopColor="#E8945A" />
          </linearGradient>
        </defs>
        <path d="M50 5 C55 25, 80 35, 82 55 C84 72, 72 90, 50 92 C28 90, 16 72, 18 55 C20 35, 45 25, 50 5Z" fill={`url(#fg${size})`} />
        <text x="50" y="60" textAnchor="middle" fontSize="14" fill="#1a1a2e" fontWeight="bold" letterSpacing="4">{exp.eyes}</text>
        {exp.mouth && <text x="50" y="75" textAnchor="middle" fontSize="12" fill="#1a1a2e">{exp.mouth}</text>}
      </svg>
      {expression === "waving" && <span style={{ position: "absolute", top: -2, right: -6, fontSize: size * 0.35, animation: "wave 1s infinite" }}>👋</span>}
      {expression === "celebrating" && <span style={{ position: "absolute", top: -6, right: -4, fontSize: size * 0.3 }}>✨</span>}
    </div>
  );
};

// ─── UTILITY FUNCTIONS ──────────────────────────
function computeMatchScore(me, other) {
  if (!me || !other) return 0;
  const jaccard = (a, b) => {
    if (!a?.length || !b?.length) return 0;
    const setA = new Set(a), setB = new Set(b);
    const inter = [...setA].filter((x) => setB.has(x)).length;
    return inter / (setA.size + setB.size - inter);
  };
  const skillComp = 1 - jaccard(me.skills, other.skills);
  const roleCompMap = { "visionary-builder": 1, "builder-visionary": 1, "visionary-strategist": 0.8, "strategist-visionary": 0.8, "builder-connector": 0.7, "connector-builder": 0.7, "strategist-connector": 0.6, "connector-strategist": 0.6 };
  const roleKey = `${me.role}-${other.role}`;
  const roleComp = me.role === other.role ? 0.2 : (roleCompMap[roleKey] || 0.5);
  const interestOverlap = jaccard(me.interests, other.interests);
  const availMap = { "available-available": 1, "available-busy": 0.5, "busy-available": 0.5 };
  const availKey = `${me.availability}-${other.availability}`;
  let avail = availMap[availKey] || 0;
  if (me.hackathonTrack && me.hackathonTrack === other.hackathonTrack) avail = Math.min(avail + 0.2, 1);
  return Math.round(skillComp * 40 + roleComp * 25 + interestOverlap * 20 + avail * 15);
}

function computeTeamMatchScore(user, team, allUsers) {
  if (!user || !team) return 0;
  const members = allUsers.filter((u) => team.members.includes(u.id));
  // 50% role gap fill
  const fillsGap = team.lookingFor.includes(user.role);
  const roleGapScore = fillsGap ? 1.0 : (team.lookingFor.length > 0 && !members.some((m) => m.role === user.role) ? 0.6 : 0.2);
  // 50% avg member compatibility
  const memberScores = members.map((m) => computeMatchScore(user, m));
  const avgMemberScore = memberScores.length > 0 ? memberScores.reduce((a, b) => a + b, 0) / memberScores.length : 50;
  return Math.round(roleGapScore * 50 + (avgMemberScore / 100) * 50);
}

function generateIceBreakers(me, other) {
  const sharedInterests = me?.interests?.filter((i) => other?.interests?.includes(i)) || [];
  const shared = sharedInterests[0] || "creative collaboration";
  return [
    `I noticed we're both into ${shared} — I've been working on something in that space and think your ${ROLES[other.role]?.label} perspective could be exactly what's missing. Want to jam on ideas?`,
    `Your manifesto really resonated with me! As a ${ROLES[me.role]?.label}, I bring ${me.skills?.[0]} and ${me.skills?.[1]} to the table. I'd love to explore how our skills could complement each other.`,
    `Looking at your work${ALL_WORKS.find((w) => w.userId === other.id) ? ` on "${ALL_WORKS.find((w) => w.userId === other.id).title}"` : ""}, I think there's a cool intersection with what I'm building. Coffee chat to explore?`,
  ];
}

function generateTeamFitBlurb(user, team, allUsers) {
  const members = allUsers.filter((u) => team.members.includes(u.id));
  const fillsGap = team.lookingFor.includes(user.role);
  const sharedInterests = members.flatMap((m) => m.interests).filter((i) => user.interests.includes(i));
  const uniqueShared = [...new Set(sharedInterests)];
  if (fillsGap) {
    return `${team.name} is actively looking for a ${ROLES[user.role]?.label}! Your ${user.skills?.[0]} skills would fill a key gap. ${uniqueShared.length > 0 ? `Shared interests: ${uniqueShared.slice(0, 2).join(", ")}.` : ""}`;
  }
  return `Your skills in ${user.skills?.slice(0, 2).join(" and ")} could add depth to ${team.name}. ${uniqueShared.length > 0 ? `Common ground: ${uniqueShared.slice(0, 2).join(", ")}.` : ""}`;
}

// ─── GLOBAL STYLES ──────────────────────────────
const globalCSS = `
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  @keyframes wave { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(20deg); } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes glow { 0%, 100% { box-shadow: 0 0 15px rgba(78,168,222,0.3); } 50% { box-shadow: 0 0 25px rgba(78,168,222,0.6); } }
  @keyframes swipeRight { 0% { transform: translateX(0) rotate(0); opacity: 1; } 100% { transform: translateX(300px) rotate(15deg); opacity: 0; } }
  @keyframes swipeLeft { 0% { transform: translateX(0) rotate(0); opacity: 1; } 100% { transform: translateX(-300px) rotate(-15deg); opacity: 0; } }
  @keyframes cardEnter { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #12122a; }
  ::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 3px; }
  input:focus, textarea:focus, select:focus { outline: none; box-shadow: 0 0 0 2px rgba(78,168,222,0.5); }
`;

// ─── SUB-COMPONENTS ─────────────────────────────
const RoleBadge = ({ role, size = "md" }) => {
  const r = ROLES[role]; if (!r) return null;
  const s = size === "sm" ? { fontSize: 11, padding: "2px 8px" } : size === "lg" ? { fontSize: 15, padding: "6px 14px" } : { fontSize: 13, padding: "4px 10px" };
  return (
    <span style={{ ...s, background: `${r.color}22`, color: r.color, borderRadius: 20, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, border: `1px solid ${r.color}44`, whiteSpace: "nowrap" }}>
      {r.icon} {r.label}
    </span>
  );
};

const TagChip = ({ tag, highlight = false }) => (
  <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500, background: highlight ? "rgba(78,168,222,0.2)" : "rgba(255,255,255,0.08)", color: highlight ? "#4EA8DE" : "#b0b0cc", border: `1px solid ${highlight ? "rgba(78,168,222,0.3)" : "rgba(255,255,255,0.06)"}`, whiteSpace: "nowrap" }}>
    {tag}
  </span>
);

const MatchScoreBadge = ({ score, size = 36 }) => {
  const color = score >= 70 ? "#2ECC71" : score >= 45 ? "#F1C40F" : "#e74c3c";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 700, color }}>
      {score}
    </div>
  );
};

const AvailabilityDot = ({ status }) => {
  const colors = { available: "#2ECC71", busy: "#F1C40F", unavailable: "#e74c3c" };
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[status] || "#666", display: "inline-block" }} />;
};

const Button = ({ children, variant = "primary", size = "md", onClick, disabled, style: es }) => {
  const base = { border: "none", borderRadius: 10, cursor: disabled ? "default" : "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s", opacity: disabled ? 0.5 : 1, fontFamily: "inherit" };
  const sizes = { sm: { padding: "6px 14px", fontSize: 12 }, md: { padding: "10px 20px", fontSize: 14 }, lg: { padding: "14px 28px", fontSize: 16 } };
  const variants = {
    primary: { background: "linear-gradient(135deg, #4A7BD4, #E8945A)", color: "#fff" },
    secondary: { background: "rgba(255,255,255,0.08)", color: "#b0b0cc", border: "1px solid rgba(255,255,255,0.12)" },
    ghost: { background: "transparent", color: "#4EA8DE" },
    danger: { background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)" },
    success: { background: "rgba(46,204,113,0.15)", color: "#2ECC71", border: "1px solid rgba(46,204,113,0.3)" },
  };
  return <button style={{ ...base, ...sizes[size], ...variants[variant], ...es }} onClick={onClick} disabled={disabled}>{children}</button>;
};

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "#1a1a2e", borderRadius: 16, padding: 24, maxWidth: 520, width: "100%", maxHeight: "85vh", overflow: "auto", border: "1px solid rgba(255,255,255,0.1)", animation: "slideUp 0.3s ease" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ─── NAV BAR ────────────────────────────────────
const Navbar = ({ currentPage, setPage, notifCount }) => (
  <nav style={{ position: "fixed", top: 0, left: 0, right: 0, height: 56, background: "rgba(12,12,26,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 100 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setPage("explore")}>
      <MetaFire expression="default" size={32} />
      <span style={{ fontWeight: 800, fontSize: 17, background: "linear-gradient(135deg, #4A7BD4, #E8945A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MetaCreate</span>
    </div>
    <div style={{ display: "flex", gap: 4 }}>
      {[
        { key: "explore", label: "Explore", icon: "🔍" },
        { key: "projects", label: "Projects", icon: "🪐" },
        { key: "teams", label: "Teams", icon: "👥" },
        { key: "event", label: "Event", icon: "🚀" },
        { key: "profile", label: "Me", icon: "👤" },
      ].map((item) => (
        <button key={item.key} onClick={() => setPage(item.key)}
          style={{ background: currentPage === item.key ? "rgba(78,168,222,0.15)" : "transparent", border: "none", borderRadius: 8, padding: "6px 10px", color: currentPage === item.key ? "#4EA8DE" : "#666", fontSize: 12, cursor: "pointer", fontWeight: currentPage === item.key ? 600 : 400, display: "flex", alignItems: "center", gap: 3, fontFamily: "inherit", position: "relative" }}>
          <span>{item.icon}</span> {item.label}
          {item.key === "profile" && notifCount > 0 && (
            <span style={{ position: "absolute", top: 2, right: 2, width: 14, height: 14, borderRadius: "50%", background: "#e74c3c", color: "#fff", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{notifCount}</span>
          )}
        </button>
      ))}
    </div>
  </nav>
);

// ─── F1: ONBOARDING ─────────────────────────────
const OnboardingPage = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", city: "", school: "", skills: [], role: "", interests: [], collabStyle: "", hackathonTrack: "", tags: [], manifesto: "" });
  const [aiLoading, setAiLoading] = useState(false);

  const generateTags = useCallback(() => {
    setAiLoading(true);
    setTimeout(() => {
      const tags = _.shuffle(AI_TAGS_POOL).slice(0, 7);
      const roleLabel = ROLES[form.role]?.label || "Creator";
      const manifesto = `A ${roleLabel} who blends ${form.skills[0] || "creativity"} with ${form.skills[1] || "passion"} to build what the world hasn't imagined yet.`;
      setForm((f) => ({ ...f, tags, manifesto }));
      setAiLoading(false);
    }, 2000);
  }, [form.role, form.skills]);

  useEffect(() => { if (step === 3 && form.tags.length === 0) generateTags(); }, [step, form.tags.length, generateTags]);

  const mascotMsg = { 1: "Hey there! Let's spark your creator profile. This'll take about 5 minutes.", 2: "Awesome! Now tell me about your superpowers.", 3: "Almost there! I've crafted some tags. Edit them to make them truly you!" };
  const mascotExp = { 1: "waving", 2: "thinking", 3: "celebrating" };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c1a", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 480, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          {["Ignition", "Your Universe", "Launch"].map((l, i) => (
            <span key={i} style={{ fontSize: 11, color: step > i ? "#4EA8DE" : "#555", fontWeight: step === i + 1 ? 700 : 400 }}>{l}</span>
          ))}
        </div>
        <div style={{ height: 4, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((step - 1) / 3) * 100}%`, background: "linear-gradient(90deg, #4A7BD4, #E8945A)", borderRadius: 2, transition: "width 0.5s" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", maxWidth: 480, width: "100%", marginBottom: 24, animation: "fadeIn 0.5s" }}>
        <MetaFire expression={mascotExp[step]} size={48} />
        <div style={{ background: "#1a1a2e", borderRadius: "4px 16px 16px 16px", padding: "12px 16px", color: "#b0b0cc", fontSize: 14, lineHeight: 1.5, flex: 1, border: "1px solid rgba(255,255,255,0.06)" }}>{mascotMsg[step]}</div>
      </div>

      <div style={{ maxWidth: 480, width: "100%", animation: "slideUp 0.4s" }}>
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>Step 1: Ignition 🔥</h2>
            {[{ key: "name", label: "Your name", ph: "What should people call you?" }, { key: "city", label: "City", ph: "Beijing / New York / ..." }, { key: "school", label: "School", ph: "Your university" }].map((f) => (
              <div key={f.key}>
                <label style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>{f.label}</label>
                <input value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph}
                  style={{ width: "100%", padding: "12px 16px", background: "#12122a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 15, fontFamily: "inherit" }} />
              </div>
            ))}
            <Button variant="primary" size="lg" onClick={() => setStep(2)} disabled={!form.name || !form.city || !form.school} style={{ width: "100%" }}>Continue →</Button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>Step 2: Your Universe 🌌</h2>
            <div style={{ border: "2px dashed rgba(78,168,222,0.3)", borderRadius: 12, padding: 20, textAlign: "center", cursor: "pointer", background: "rgba(78,168,222,0.05)" }}>
              <p style={{ color: "#4EA8DE", fontSize: 14, fontWeight: 600 }}>📄 Upload Resume (AI will parse it)</p>
              <p style={{ color: "#666", fontSize: 12, marginTop: 4 }}>or select your skills manually below</p>
            </div>
            <div>
              <label style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 8, display: "block" }}>Pick your role (one)</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Object.entries(ROLES).map(([key, r]) => (
                  <button key={key} onClick={() => setForm({ ...form, role: key })}
                    style={{ padding: "14px 12px", background: form.role === key ? `${r.color}22` : "#12122a", border: form.role === key ? `2px solid ${r.color}` : "2px solid rgba(255,255,255,0.06)", borderRadius: 12, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ fontSize: 22 }}>{r.icon}</div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{r.label}</div>
                    <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 8, display: "block" }}>Skills (min 3) — {form.skills.length} selected</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SKILLS.map((skill) => (
                  <button key={skill} onClick={() => setForm({ ...form, skills: form.skills.includes(skill) ? form.skills.filter((s) => s !== skill) : [...form.skills, skill] })}
                    style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, border: form.skills.includes(skill) ? "1px solid #4EA8DE" : "1px solid rgba(255,255,255,0.1)", background: form.skills.includes(skill) ? "rgba(78,168,222,0.15)" : "#12122a", color: form.skills.includes(skill) ? "#4EA8DE" : "#888", cursor: "pointer", fontWeight: form.skills.includes(skill) ? 600 : 400 }}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 8, display: "block" }}>Interests</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {INTERESTS.map((i) => (
                  <button key={i} onClick={() => setForm({ ...form, interests: form.interests.includes(i) ? form.interests.filter((x) => x !== i) : [...form.interests, i] })}
                    style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, border: form.interests.includes(i) ? "1px solid #E8945A" : "1px solid rgba(255,255,255,0.1)", background: form.interests.includes(i) ? "rgba(232,148,90,0.15)" : "#12122a", color: form.interests.includes(i) ? "#E8945A" : "#888", cursor: "pointer", fontWeight: form.interests.includes(i) ? 600 : 400 }}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 8, display: "block" }}>Collab style</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {COLLAB_STYLES.map((cs) => (
                  <button key={cs} onClick={() => setForm({ ...form, collabStyle: cs })}
                    style={{ padding: "8px 14px", borderRadius: 10, fontSize: 13, border: form.collabStyle === cs ? "1px solid #7B68EE" : "1px solid rgba(255,255,255,0.1)", background: form.collabStyle === cs ? "rgba(123,104,238,0.15)" : "#12122a", color: form.collabStyle === cs ? "#7B68EE" : "#888", cursor: "pointer", fontFamily: "inherit" }}>
                    {cs}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
              <Button variant="primary" size="lg" onClick={() => setStep(3)} disabled={form.skills.length < 3 || !form.role} style={{ flex: 1 }}>Generate My Profile ✨</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>Step 3: Launch! 🚀</h2>
            {aiLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <MetaFire expression="thinking" size={64} />
                <p style={{ color: "#4EA8DE", marginTop: 16, fontSize: 14, animation: "pulse 1.5s infinite" }}>MetaFire is analyzing your profile...</p>
                <div style={{ width: 200, height: 4, background: "#1a1a2e", borderRadius: 2, margin: "12px auto", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "linear-gradient(90deg, #4A7BD4, #E8945A, #4A7BD4)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 8, display: "block" }}>✨ Your AI-Generated Tags</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {form.tags.map((tag) => (
                      <button key={tag} onClick={() => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })}
                        style={{ padding: "6px 14px", borderRadius: 20, fontSize: 13, background: "linear-gradient(135deg, rgba(74,123,212,0.2), rgba(232,148,90,0.2))", border: "1px solid rgba(78,168,222,0.3)", color: "#fff", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
                        {tag} <span style={{ opacity: 0.5 }}>✕</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 8, display: "block" }}>✨ Your Manifesto</label>
                  <textarea value={form.manifesto} onChange={(e) => setForm({ ...form, manifesto: e.target.value })} rows={3}
                    style={{ width: "100%", padding: "12px 16px", background: "#12122a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 14, lineHeight: 1.6, fontFamily: "inherit", resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
                  <Button variant="primary" size="lg" onClick={() => onComplete({ ...form, id: "me", avatar: form.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(), availability: "available", works: [] })} style={{ flex: 1 }}>🚀 Launch My Profile</Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── F2: PROFILE PAGE ───────────────────────────
const ProfilePage = ({ user, currentUser, onConnect, onBack }) => {
  const isOwn = user?.id === currentUser?.id;
  const score = useMemo(() => currentUser && user ? computeMatchScore(currentUser, user) : 0, [currentUser, user]);
  const sharedTags = currentUser?.tags?.filter((t) => user?.tags?.includes(t)) || [];
  const userWorks = ALL_WORKS.filter((w) => w.userId === user?.id);
  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c1a", paddingTop: 56 }}>
      <div style={{ background: "linear-gradient(180deg, #12122a 0%, #0c0c1a 100%)", padding: "24px 16px", textAlign: "center", position: "relative" }}>
        {onBack && <button onClick={onBack} style={{ position: "absolute", left: 16, top: 16, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "6px 12px", color: "#888", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>← Back</button>}
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${ROLES[user.role]?.color || "#4EA8DE"}, #E8945A)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28, fontWeight: 700, color: "#fff", border: "3px solid rgba(255,255,255,0.1)" }}>{user.avatar}</div>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{user.name}</h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <RoleBadge role={user.role} />
          <AvailabilityDot status={user.availability} />
          <span style={{ color: "#666", fontSize: 12 }}>{user.availability}</span>
        </div>
        <p style={{ color: "#666", fontSize: 13 }}>{user.school} · {user.city}</p>
        {!isOwn && score > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}>
            <MatchScoreBadge score={score} />
            <span style={{ color: "#888", fontSize: 12 }}>match</span>
          </div>
        )}
      </div>
      <div style={{ padding: "0 16px 100px", maxWidth: 520, margin: "0 auto" }}>
        <div style={{ padding: "20px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "#e0e0f0", fontSize: 15, lineHeight: 1.6, fontStyle: "italic" }}>"{user.manifesto}"</p>
        </div>
        <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Tags</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {user.tags?.map((t) => <TagChip key={t} tag={t} highlight={sharedTags.includes(t)} />)}
          </div>
        </div>
        <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Skills</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {user.skills?.map((s) => <span key={s} style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, background: "rgba(255,255,255,0.06)", color: "#b0b0cc" }}>{s}</span>)}
          </div>
        </div>
        {userWorks.length > 0 && (
          <div style={{ padding: "16px 0" }}>
            <h3 style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Works</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {userWorks.map((w) => (
                <div key={w.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "#12122a" }}>
                  <div style={{ height: 100, background: `linear-gradient(135deg, ${DOMAIN_COLORS[w.domain]}33, ${DOMAIN_COLORS[w.domain]}11)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>{DOMAIN_EMOJIS[w.domain]}</div>
                  <div style={{ padding: 10 }}>
                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{w.title}</div>
                    <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>{w.domain}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {!isOwn && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px", background: "rgba(12,12,26,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
          <Button variant="primary" size="lg" onClick={() => onConnect(user)} style={{ flex: 1 }}>Send Collab Request ✨</Button>
          <Button variant="secondary" size="lg">Save</Button>
        </div>
      )}
    </div>
  );
};

// ─── F3: EXPLORE PAGE (People) ──────────────────
const ExplorePage = ({ currentUser, onViewProfile, onConnect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ role: "", availability: "", location: "" });
  const [sortBy, setSortBy] = useState("match");

  const filtered = useMemo(() => {
    let r = MOCK_USERS.filter((u) => u.id !== currentUser?.id);
    if (searchQuery) { const q = searchQuery.toLowerCase(); r = r.filter((u) => u.name.toLowerCase().includes(q) || u.skills.some((s) => s.toLowerCase().includes(q)) || u.tags.some((t) => t.toLowerCase().includes(q))); }
    if (filters.role) r = r.filter((u) => u.role === filters.role);
    if (filters.availability) r = r.filter((u) => u.availability === filters.availability);
    if (filters.location) r = r.filter((u) => u.city === filters.location);
    return r.map((u) => ({ ...u, score: computeMatchScore(currentUser, u) })).sort((a, b) => sortBy === "match" ? b.score - a.score : 0);
  }, [searchQuery, filters, sortBy, currentUser]);

  const toggle = (k, v) => setFilters((f) => ({ ...f, [k]: f[k] === v ? "" : v }));

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c1a", paddingTop: 56 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px 80px" }}>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#555" }}>🔍</span>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search creators by name, skill, or tag..."
            style={{ width: "100%", padding: "12px 16px 12px 40px", background: "#12122a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", fontSize: 14, fontFamily: "inherit" }} />
        </div>

        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 8 }}>
          {Object.entries(ROLES).map(([k, r]) => (
            <button key={k} onClick={() => toggle("role", k)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, border: filters.role === k ? `1px solid ${r.color}` : "1px solid rgba(255,255,255,0.08)", background: filters.role === k ? `${r.color}22` : "#12122a", color: filters.role === k ? r.color : "#888", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>{r.icon} {r.label}</button>
          ))}
          {["Beijing", "New York"].map((l) => (
            <button key={l} onClick={() => toggle("location", l)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, border: filters.location === l ? "1px solid #4EA8DE" : "1px solid rgba(255,255,255,0.08)", background: filters.location === l ? "rgba(78,168,222,0.15)" : "#12122a", color: filters.location === l ? "#4EA8DE" : "#888", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>📍 {l}</button>
          ))}
          <button onClick={() => toggle("availability", "available")} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, border: filters.availability ? "1px solid #2ECC71" : "1px solid rgba(255,255,255,0.08)", background: filters.availability ? "rgba(46,204,113,0.15)" : "#12122a", color: filters.availability ? "#2ECC71" : "#888", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>🟢 Available</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ color: "#555", fontSize: 12 }}>Sort:</span>
          {["match", "newest"].map((s) => (
            <button key={s} onClick={() => setSortBy(s)} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, background: sortBy === s ? "rgba(78,168,222,0.15)" : "transparent", color: sortBy === s ? "#4EA8DE" : "#666", border: "none", cursor: "pointer", fontWeight: sortBy === s ? 600 : 400, fontFamily: "inherit" }}>{s === "match" ? "Best Match" : "Newest"}</button>
          ))}
          <span style={{ marginLeft: "auto", color: "#555", fontSize: 12 }}>{filtered.length} results</span>
        </div>

        {/* New Creators */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, marginBottom: 12 }}>✨ New Creators This Week</h3>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {MOCK_USERS.slice(0, 5).map((u) => (
              <div key={u.id} onClick={() => onViewProfile(u)} style={{ minWidth: 110, background: "#12122a", borderRadius: 14, padding: "14px 10px", textAlign: "center", cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${ROLES[u.role]?.color}, #E8945A)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px", color: "#fff", fontWeight: 700, fontSize: 13 }}>{u.avatar}</div>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{u.name.split(" ")[0]}</div>
                <RoleBadge role={u.role} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((user) => {
            const shared = currentUser?.tags?.filter((t) => user.tags?.includes(t)) || [];
            return (
              <div key={user.id} style={{ background: "#12122a", borderRadius: 14, padding: 16, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "border-color 0.2s" }}
                onClick={() => onViewProfile(user)}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(78,168,222,0.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${ROLES[user.role]?.color}, #E8945A)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{user.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{user.name}</span>
                      <RoleBadge role={user.role} size="sm" />
                      <AvailabilityDot status={user.availability} />
                    </div>
                    <p style={{ color: "#666", fontSize: 12, marginTop: 2 }}>{user.school} · {user.city}</p>
                  </div>
                  <MatchScoreBadge score={user.score} />
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 10 }}>
                  {user.tags?.slice(0, 3).map((t) => <TagChip key={t} tag={t} highlight={shared.includes(t)} />)}
                  {shared.length > 0 && <span style={{ color: "#4EA8DE", fontSize: 11, alignSelf: "center" }}>{shared.length} shared</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                  <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); onConnect(user); }}>Connect ✨</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── NEW: PROJECT GALLERY (RedBook/TikTok Style) ──
const ProjectGallery = ({ currentUser, onViewProfile }) => {
  const [expandedWork, setExpandedWork] = useState(null);
  const [likedWorks, setLikedWorks] = useState(new Set());
  const [savedWorks, setSavedWorks] = useState(new Set());
  const [domainFilter, setDomainFilter] = useState("");

  const works = useMemo(() => {
    let w = [...ALL_WORKS];
    if (domainFilter) w = w.filter((x) => x.domain === domainFilter);
    return w;
  }, [domainFilter]);

  const toggleLike = (id, e) => { e?.stopPropagation(); setLikedWorks((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const toggleSave = (id, e) => { e?.stopPropagation(); setSavedWorks((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  const getCreator = (uid) => MOCK_USERS.find((u) => u.id === uid);

  // Masonry layout: split into two columns
  const col1 = works.filter((_, i) => i % 2 === 0);
  const col2 = works.filter((_, i) => i % 2 === 1);

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c1a", paddingTop: 56 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 12px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>🪐 Projects</h1>
          <Button variant="primary" size="sm">+ Share Work</Button>
        </div>

        {/* Domain filter tabs */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, marginBottom: 12 }}>
          <button onClick={() => setDomainFilter("")} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, border: !domainFilter ? "1px solid #4EA8DE" : "1px solid rgba(255,255,255,0.08)", background: !domainFilter ? "rgba(78,168,222,0.15)" : "#12122a", color: !domainFilter ? "#4EA8DE" : "#888", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", fontWeight: 600 }}>All</button>
          {Object.entries(DOMAIN_COLORS).map(([d, c]) => (
            <button key={d} onClick={() => setDomainFilter(domainFilter === d ? "" : d)} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, border: domainFilter === d ? `1px solid ${c}` : "1px solid rgba(255,255,255,0.08)", background: domainFilter === d ? `${c}22` : "#12122a", color: domainFilter === d ? c : "#888", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>{DOMAIN_EMOJIS[d]} {d}</button>
          ))}
        </div>

        {/* Masonry Grid */}
        <div style={{ display: "flex", gap: 10 }}>
          {[col1, col2].map((col, ci) => (
            <div key={ci} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {col.map((work) => {
                const creator = getCreator(work.userId);
                const liked = likedWorks.has(work.id);
                const h = 140 + (work.aspectRatio || 1) * 60;
                return (
                  <div key={work.id} onClick={() => setExpandedWork(work)}
                    style={{ borderRadius: 14, overflow: "hidden", cursor: "pointer", background: "#12122a", border: "1px solid rgba(255,255,255,0.06)", transition: "transform 0.2s, border-color 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.borderColor = `${DOMAIN_COLORS[work.domain]}44`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
                    {/* Cover */}
                    <div style={{ height: h, background: `linear-gradient(${135 + work.coverHue}deg, hsl(${work.coverHue},40%,15%), hsl(${(work.coverHue + 60) % 360},50%,20%))`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <span style={{ fontSize: 48, opacity: 0.6 }}>{DOMAIN_EMOJIS[work.domain]}</span>
                      {/* Domain badge */}
                      <span style={{ position: "absolute", top: 8, left: 8, padding: "2px 8px", borderRadius: 6, fontSize: 10, background: `${DOMAIN_COLORS[work.domain]}44`, color: DOMAIN_COLORS[work.domain], fontWeight: 600, backdropFilter: "blur(4px)" }}>{work.domain}</span>
                    </div>
                    {/* Info */}
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{work.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: `linear-gradient(135deg, ${ROLES[creator?.role]?.color || "#4EA8DE"}, #E8945A)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#fff", fontWeight: 700 }}>{creator?.avatar}</div>
                        <span style={{ color: "#888", fontSize: 11 }}>{creator?.name}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={(e) => toggleLike(work.id, e)} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e74c3c" : "#555", fontSize: 12, display: "flex", alignItems: "center", gap: 3, fontFamily: "inherit" }}>
                            {liked ? "❤️" : "🤍"} {work.likes + (liked ? 1 : 0)}
                          </button>
                          <span style={{ color: "#555", fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>💬 {work.comments}</span>
                        </div>
                        <button onClick={(e) => toggleSave(work.id, e)} style={{ background: "none", border: "none", cursor: "pointer", color: savedWorks.has(work.id) ? "#F1C40F" : "#555", fontSize: 14 }}>
                          {savedWorks.has(work.id) ? "★" : "☆"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Project View (Full-Screen) */}
      {expandedWork && (() => {
        const w = expandedWork;
        const creator = getCreator(w.userId);
        const liked = likedWorks.has(w.id);
        const saved = savedWorks.has(w.id);
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#0c0c1a", overflowY: "auto", animation: "slideUp 0.3s ease" }}>
            {/* Header */}
            <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(12,12,26,0.95)", backdropFilter: "blur(12px)" }}>
              <button onClick={() => setExpandedWork(null)} style={{ background: "none", border: "none", color: "#888", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
              <span style={{ padding: "3px 10px", borderRadius: 8, fontSize: 11, background: `${DOMAIN_COLORS[w.domain]}22`, color: DOMAIN_COLORS[w.domain], fontWeight: 600 }}>{DOMAIN_EMOJIS[w.domain]} {w.domain}</span>
            </div>

            {/* Hero image */}
            <div style={{ height: 320, background: `linear-gradient(${135 + w.coverHue}deg, hsl(${w.coverHue},45%,18%), hsl(${(w.coverHue + 60) % 360},55%,25%))`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <span style={{ fontSize: 80, opacity: 0.4 }}>{DOMAIN_EMOJIS[w.domain]}</span>
              {/* Side action buttons (TikTok-style) */}
              <div style={{ position: "absolute", right: 16, bottom: 20, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
                <button onClick={(e) => toggleLike(w.id, e)} style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, backdropFilter: "blur(4px)" }}>
                  {liked ? "❤️" : "🤍"}
                </button>
                <span style={{ color: "#fff", fontSize: 11 }}>{w.likes + (liked ? 1 : 0)}</span>
                <button style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, backdropFilter: "blur(4px)" }}>💬</button>
                <span style={{ color: "#fff", fontSize: 11 }}>{w.comments}</span>
                <button onClick={(e) => toggleSave(w.id, e)} style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, backdropFilter: "blur(4px)" }}>
                  {saved ? "★" : "☆"}
                </button>
                <button style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, backdropFilter: "blur(4px)" }}>↗</button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: "20px 16px 40px", maxWidth: 520, margin: "0 auto" }}>
              <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, marginBottom: 12 }}>{w.title}</h1>
              <p style={{ color: "#b0b0cc", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{w.desc}</p>

              {/* Tags */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {w.tags.map((t) => <TagChip key={t} tag={t} />)}
              </div>

              {/* Creator card */}
              <div onClick={() => { setExpandedWork(null); onViewProfile(creator); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "#12122a", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${ROLES[creator?.role]?.color}, #E8945A)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{creator?.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{creator?.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <RoleBadge role={creator?.role} size="sm" />
                    <span style={{ color: "#666", fontSize: 12 }}>{creator?.school}</span>
                  </div>
                </div>
                <span style={{ color: "#4EA8DE", fontSize: 13, fontWeight: 600 }}>View →</span>
              </div>

              {/* More from this creator */}
              {ALL_WORKS.filter((x) => x.userId === w.userId && x.id !== w.id).length > 0 && (
                <div>
                  <h3 style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>More from {creator?.name?.split(" ")[0]}</h3>
                  <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
                    {ALL_WORKS.filter((x) => x.userId === w.userId && x.id !== w.id).map((other) => (
                      <div key={other.id} onClick={() => setExpandedWork(other)} style={{ minWidth: 140, borderRadius: 10, overflow: "hidden", background: "#12122a", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", flexShrink: 0 }}>
                        <div style={{ height: 80, background: `linear-gradient(135deg, ${DOMAIN_COLORS[other.domain]}33, ${DOMAIN_COLORS[other.domain]}11)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{DOMAIN_EMOJIS[other.domain]}</div>
                        <div style={{ padding: 8, color: "#fff", fontSize: 12, fontWeight: 600 }}>{other.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ─── F4: ICE-BREAKER MODAL ─────────────────────
const IceBreakerModal = ({ open, onClose, sender, recipient, onSend }) => {
  const [reqType, setReqType] = useState("hackathon");
  const [message, setMessage] = useState("");
  const [iceBreakers, setIceBreakers] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open && sender && recipient) {
      setGenerating(true); setSent(false); setMessage("");
      setTimeout(() => { setIceBreakers(generateIceBreakers(sender, recipient)); setGenerating(false); }, 1500);
    }
  }, [open, sender, recipient]);

  if (!recipient) return null;
  const score = computeMatchScore(sender, recipient);

  return (
    <Modal open={open} onClose={onClose} title="Send Collab Request">
      {sent ? (
        <div style={{ textAlign: "center", padding: 20 }}>
          <MetaFire expression="celebrating" size={64} />
          <p style={{ color: "#2ECC71", fontSize: 16, fontWeight: 700, marginTop: 16 }}>Request sent! 🎉</p>
          <p style={{ color: "#888", fontSize: 13, marginTop: 8 }}>{recipient.name} will see your message.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${ROLES[recipient.role]?.color}, #E8945A)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>{recipient.avatar}</div>
            <div style={{ flex: 1 }}><div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{recipient.name}</div><RoleBadge role={recipient.role} size="sm" /></div>
            <MatchScoreBadge score={score} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Type</label>
            <div style={{ display: "flex", gap: 6 }}>
              {[{ k: "hackathon", l: "🚀 Hackathon" }, { k: "project", l: "💡 Project" }, { k: "general", l: "☕ General" }].map((t) => (
                <button key={t.k} onClick={() => setReqType(t.k)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, border: reqType === t.k ? "1px solid #4EA8DE" : "1px solid rgba(255,255,255,0.08)", background: reqType === t.k ? "rgba(78,168,222,0.15)" : "transparent", color: reqType === t.k ? "#4EA8DE" : "#888", cursor: "pointer", fontFamily: "inherit" }}>{t.l}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><MetaFire expression="happy" size={20} /><label style={{ color: "#888", fontSize: 12, fontWeight: 600 }}>Suggestions</label></div>
            {generating ? (
              <div style={{ padding: 16, textAlign: "center" }}><div style={{ width: 120, height: 3, background: "#1a1a2e", borderRadius: 2, margin: "0 auto", overflow: "hidden" }}><div style={{ height: "100%", background: "linear-gradient(90deg, #4A7BD4, #E8945A, #4A7BD4)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} /></div></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {iceBreakers.map((ib, i) => (
                  <button key={i} onClick={() => setMessage(ib)} style={{ padding: "10px 12px", background: message === ib ? "rgba(78,168,222,0.1)" : "rgba(255,255,255,0.03)", border: message === ib ? "1px solid rgba(78,168,222,0.3)" : "1px solid rgba(255,255,255,0.06)", borderRadius: 10, color: "#b0b0cc", fontSize: 12, lineHeight: 1.5, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>{ib}</button>
                ))}
              </div>
            )}
          </div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Write your own or pick above..."
            style={{ width: "100%", padding: 12, background: "#0c0c1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 13, fontFamily: "inherit", resize: "vertical", marginBottom: 16 }} />
          <Button variant="primary" size="lg" onClick={() => { setSent(true); setTimeout(() => { onSend?.(); onClose(); }, 1500); }} disabled={!message} style={{ width: "100%" }}>Send Request ✨</Button>
        </>
      )}
    </Modal>
  );
};

// ─── F5: TEAMS PAGE (with Dating-App Matching) ──
const TeamsPage = ({ currentUser }) => {
  const [viewMode, setViewMode] = useState("list"); // "list" or "swipe"
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [swipeAnim, setSwipeAnim] = useState(null); // "left" or "right"
  const [showCreate, setShowCreate] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", desc: "", track: "", lookingFor: [] });
  const [joinedTeams, setJoinedTeams] = useState([]);
  const [skippedTeams, setSkippedTeams] = useState(new Set());

  const rankedTeams = useMemo(() => {
    return MOCK_TEAMS
      .map((t) => ({ ...t, teamScore: computeTeamMatchScore(currentUser, t, MOCK_USERS), fitBlurb: generateTeamFitBlurb(currentUser, t, MOCK_USERS) }))
      .sort((a, b) => b.teamScore - a.teamScore);
  }, [currentUser]);

  const swipeableTeams = rankedTeams.filter((t) => !skippedTeams.has(t.id) && !joinedTeams.includes(t.id));
  const currentSwipeTeam = swipeableTeams[0];

  const handleSwipe = (direction) => {
    if (!currentSwipeTeam) return;
    setSwipeAnim(direction);
    setTimeout(() => {
      if (direction === "right") setJoinedTeams((j) => [...j, currentSwipeTeam.id]);
      else setSkippedTeams((s) => new Set([...s, currentSwipeTeam.id]));
      setSwipeAnim(null);
    }, 400);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c1a", paddingTop: 56 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>Teams</h1>
          <div style={{ display: "flex", gap: 8 }}>
            {/* View mode toggle */}
            <div style={{ display: "flex", background: "#12122a", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <button onClick={() => setViewMode("list")} style={{ padding: "6px 12px", fontSize: 12, background: viewMode === "list" ? "rgba(78,168,222,0.15)" : "transparent", color: viewMode === "list" ? "#4EA8DE" : "#666", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>📋 List</button>
              <button onClick={() => setViewMode("swipe")} style={{ padding: "6px 12px", fontSize: 12, background: viewMode === "swipe" ? "rgba(78,168,222,0.15)" : "transparent", color: viewMode === "swipe" ? "#4EA8DE" : "#666", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>🔥 Match</button>
            </div>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>+ Create</Button>
          </div>
        </div>

        {/* Joined teams notification */}
        {joinedTeams.length > 0 && (
          <div style={{ background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🎉</span>
            <span style={{ color: "#2ECC71", fontSize: 13 }}>You've requested to join {joinedTeams.length} team{joinedTeams.length > 1 ? "s" : ""}!</span>
          </div>
        )}

        {/* ═══ SWIPE MODE ═══ */}
        {viewMode === "swipe" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <MetaFire expression="excited" size={28} />
              <span style={{ color: "#b0b0cc", fontSize: 13 }}>Find your perfect team — swipe to match!</span>
            </div>

            {currentSwipeTeam ? (
              <>
                <div style={{
                  width: "100%", maxWidth: 380, background: "#12122a", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden",
                  animation: swipeAnim === "right" ? "swipeRight 0.4s forwards" : swipeAnim === "left" ? "swipeLeft 0.4s forwards" : "cardEnter 0.3s ease",
                  position: "relative",
                }}>
                  {/* Score band */}
                  <div style={{ background: `linear-gradient(135deg, ${currentSwipeTeam.teamScore >= 70 ? "rgba(46,204,113,0.15)" : "rgba(78,168,222,0.15)"}, transparent)`, padding: "20px 20px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>👥</div>
                        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>{currentSwipeTeam.name}</h2>
                      </div>
                      <MatchScoreBadge score={currentSwipeTeam.teamScore} size={48} />
                    </div>
                    {currentSwipeTeam.teamScore >= 70 && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, padding: "3px 10px", borderRadius: 20, background: "rgba(46,204,113,0.15)", color: "#2ECC71", fontSize: 11, fontWeight: 600 }}>
                        ✨ Great match!
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "0 20px 20px" }}>
                    <p style={{ color: "#b0b0cc", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{currentSwipeTeam.desc}</p>

                    {/* Track */}
                    {currentSwipeTeam.track && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                        <span style={{ fontSize: 16 }}>{HACKATHON_TRACKS.find((t) => t.id === currentSwipeTeam.track)?.icon}</span>
                        <span style={{ color: "#888", fontSize: 12 }}>{HACKATHON_TRACKS.find((t) => t.id === currentSwipeTeam.track)?.label}</span>
                      </div>
                    )}

                    {/* Members */}
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ color: "#666", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Team Members</span>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        {MOCK_USERS.filter((u) => currentSwipeTeam.members.includes(u.id)).map((m) => (
                          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${ROLES[m.role]?.color}, #E8945A)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700 }}>{m.avatar}</div>
                            <div>
                              <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{m.name.split(" ")[0]}</div>
                              <div style={{ color: ROLES[m.role]?.color, fontSize: 10 }}>{ROLES[m.role]?.icon} {ROLES[m.role]?.label}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Looking for */}
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                      <span style={{ color: "#888", fontSize: 11 }}>Looking for: </span>
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        {currentSwipeTeam.lookingFor.map((r) => (
                          <span key={r} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: currentUser?.role === r ? `${ROLES[r]?.color}33` : `${ROLES[r]?.color}15`, color: ROLES[r]?.color, border: currentUser?.role === r ? `2px solid ${ROLES[r]?.color}` : `1px solid ${ROLES[r]?.color}44` }}>
                            {ROLES[r]?.icon} {ROLES[r]?.label} {currentUser?.role === r ? "← You!" : ""}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI fit blurb */}
                    <div style={{ padding: 12, background: "rgba(78,168,222,0.05)", borderRadius: 10, border: "1px solid rgba(78,168,222,0.1)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                        <MetaFire expression="happy" size={16} />
                        <span style={{ color: "#4EA8DE", fontSize: 11, fontWeight: 600 }}>Why you'd fit</span>
                      </div>
                      <p style={{ color: "#b0b0cc", fontSize: 12, lineHeight: 1.5 }}>{currentSwipeTeam.fitBlurb}</p>
                    </div>
                  </div>
                </div>

                {/* Swipe buttons */}
                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                  <button onClick={() => handleSwipe("left")}
                    style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(231,76,60,0.1)", border: "2px solid rgba(231,76,60,0.3)", color: "#e74c3c", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                    ✕
                  </button>
                  <span style={{ color: "#555", fontSize: 12 }}>Skip / Join</span>
                  <button onClick={() => handleSwipe("right")}
                    style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(46,204,113,0.1)", border: "2px solid rgba(46,204,113,0.3)", color: "#2ECC71", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                    ✓
                  </button>
                </div>
                <p style={{ color: "#555", fontSize: 11 }}>{swipeableTeams.length} teams remaining</p>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 40 }}>
                <MetaFire expression="celebrating" size={64} />
                <p style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginTop: 16 }}>You've seen all teams!</p>
                <p style={{ color: "#888", fontSize: 13, marginTop: 8 }}>Check back later or create your own team.</p>
                <Button variant="primary" size="md" onClick={() => { setSkippedTeams(new Set()); }} style={{ marginTop: 16 }}>Start Over</Button>
              </div>
            )}
          </div>
        )}

        {/* ═══ LIST MODE ═══ */}
        {viewMode === "list" && (
          <>
            <h3 style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Recommended for You</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {rankedTeams.map((team) => {
                const members = MOCK_USERS.filter((u) => team.members.includes(u.id));
                const track = HACKATHON_TRACKS.find((t) => t.id === team.track);
                const fillsGap = team.lookingFor.includes(currentUser?.role);
                return (
                  <div key={team.id} style={{ background: "#12122a", borderRadius: 14, padding: 16, border: fillsGap ? "1px solid rgba(46,204,113,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #4A7BD4, #E8945A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>👥</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{team.name}</span>
                          <MatchScoreBadge score={team.teamScore} size={30} />
                        </div>
                        <p style={{ color: "#b0b0cc", fontSize: 13, marginTop: 4 }}>{team.desc}</p>
                        {track && <span style={{ display: "inline-block", marginTop: 6, padding: "2px 8px", borderRadius: 6, fontSize: 11, background: "rgba(78,168,222,0.1)", color: "#4EA8DE" }}>{track.icon} {track.label}</span>}
                      </div>
                    </div>
                    {/* Members */}
                    <div style={{ display: "flex", gap: -4, marginBottom: 10 }}>
                      {members.map((m, i) => (
                        <div key={m.id} style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${ROLES[m.role]?.color}, #E8945A)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 9, border: "2px solid #12122a", marginLeft: i > 0 ? -8 : 0 }}>{m.avatar}</div>
                      ))}
                      <span style={{ color: "#666", fontSize: 12, marginLeft: 8, alignSelf: "center" }}>{team.members.length}/6</span>
                    </div>
                    {/* Role gaps */}
                    {team.lookingFor.length > 0 && (
                      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                        <span style={{ color: "#888", fontSize: 11, marginRight: 6 }}>Looking for:</span>
                        {team.lookingFor.map((r) => (
                          <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "2px 8px", borderRadius: 12, fontSize: 11, background: currentUser?.role === r ? `${ROLES[r]?.color}33` : `${ROLES[r]?.color}15`, color: ROLES[r]?.color, marginRight: 4, fontWeight: currentUser?.role === r ? 700 : 500 }}>
                            {ROLES[r]?.icon} {ROLES[r]?.label}{currentUser?.role === r ? " ← You!" : ""}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* AI fit blurb */}
                    <div style={{ padding: "8px 10px", background: "rgba(78,168,222,0.04)", borderRadius: 8, marginBottom: 10, display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <MetaFire expression="happy" size={16} />
                      <p style={{ color: "#888", fontSize: 11, lineHeight: 1.4 }}>{team.fitBlurb}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button variant={fillsGap ? "success" : "primary"} size="sm" style={{ flex: 1 }}>
                        {fillsGap ? "✨ Great fit — Request to Join" : "Request to Join"}
                      </Button>
                      {team.chatLink && <Button variant="secondary" size="sm">💬</Button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Create Team Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create a Team">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>Team Name *</label>
            <input value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} placeholder="e.g. Orbital Architects"
              style={{ width: "100%", padding: "10px 14px", background: "#0c0c1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" }}>Description *</label>
            <textarea value={newTeam.desc} onChange={(e) => setNewTeam({ ...newTeam, desc: e.target.value })} rows={3} placeholder="What's your team building?"
              style={{ width: "100%", padding: "10px 14px", background: "#0c0c1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
          </div>
          <div>
            <label style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Challenge Track</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {HACKATHON_TRACKS.map((t) => (
                <button key={t.id} onClick={() => setNewTeam({ ...newTeam, track: t.id })} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13, border: newTeam.track === t.id ? "1px solid #4EA8DE" : "1px solid rgba(255,255,255,0.06)", background: newTeam.track === t.id ? "rgba(78,168,222,0.1)" : "transparent", color: newTeam.track === t.id ? "#fff" : "#888", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>{t.icon} {t.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>Looking for</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(ROLES).map(([k, r]) => (
                <button key={k} onClick={() => setNewTeam({ ...newTeam, lookingFor: newTeam.lookingFor.includes(k) ? newTeam.lookingFor.filter((x) => x !== k) : [...newTeam.lookingFor, k] })}
                  style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, border: newTeam.lookingFor.includes(k) ? `1px solid ${r.color}` : "1px solid rgba(255,255,255,0.08)", background: newTeam.lookingFor.includes(k) ? `${r.color}22` : "transparent", color: newTeam.lookingFor.includes(k) ? r.color : "#888", cursor: "pointer", fontFamily: "inherit" }}>{r.icon} {r.label}</button>
              ))}
            </div>
          </div>
          <Button variant="primary" size="lg" disabled={!newTeam.name || !newTeam.desc} style={{ width: "100%", marginTop: 8 }}>Create Team 🚀</Button>
        </div>
      </Modal>
    </div>
  );
};

// ─── F7: EVENT HUB ──────────────────────────────
const EventPage = ({ currentUser }) => {
  const [selectedTrack, setSelectedTrack] = useState(null);
  return (
    <div style={{ minHeight: "100vh", background: "#0c0c1a", paddingTop: 56 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px 80px" }}>
        <div style={{ background: "linear-gradient(135deg, #0d1b3e, #1a1a2e)", borderRadius: 20, padding: "32px 24px", marginBottom: 24, border: "1px solid rgba(78,168,222,0.15)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 10, right: 20, fontSize: 40, opacity: 0.15 }}>🚀</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <MetaFire expression="excited" size={36} />
            <span style={{ color: "#E8945A", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>April 2026</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 900, lineHeight: 1.3, marginBottom: 8 }}>Space Base Challenge 🛰️</h1>
          <p style={{ color: "#b0b0cc", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>Design humanity's next home. A multi-node creative hackathon by Columbia & Peking University.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, background: "rgba(78,168,222,0.15)", color: "#4EA8DE", fontWeight: 600 }}>📍 New York</span>
            <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, background: "rgba(232,148,90,0.15)", color: "#E8945A", fontWeight: 600 }}>📍 Beijing</span>
          </div>
        </div>

        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Challenge Tracks</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {HACKATHON_TRACKS.map((track) => {
            const isS = selectedTrack === track.id;
            const tUsers = MOCK_USERS.filter((u) => u.hackathonTrack === track.id);
            const tTeams = MOCK_TEAMS.filter((t) => t.track === track.id);
            return (
              <div key={track.id}>
                <button onClick={() => setSelectedTrack(isS ? null : track.id)}
                  style={{ width: "100%", padding: 16, background: isS ? "rgba(78,168,222,0.08)" : "#12122a", border: isS ? "1px solid rgba(78,168,222,0.3)" : "1px solid rgba(255,255,255,0.06)", borderRadius: isS ? "14px 14px 0 0" : 14, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 28 }}>{track.icon}</span>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{track.label}</div>
                        <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>{tUsers.length} creators · {tTeams.length} teams</div>
                      </div>
                    </div>
                    <span style={{ color: "#555", fontSize: 18, transform: isS ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>▾</span>
                  </div>
                </button>
                {isS && (
                  <div style={{ background: "#12122a", borderRadius: "0 0 14px 14px", padding: 16, border: "1px solid rgba(78,168,222,0.3)", borderTopWidth: 0, animation: "fadeIn 0.2s" }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                      {tUsers.slice(0, 4).map((u) => (
                        <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 8 }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg, ${ROLES[u.role]?.color}, #E8945A)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 7, fontWeight: 700 }}>{u.avatar}</div>
                          <span style={{ color: "#b0b0cc", fontSize: 11 }}>{u.name.split(" ")[0]}</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="primary" size="sm" style={{ width: "100%" }}>🔍 Find Teammates</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Timeline</h2>
        <div style={{ paddingLeft: 24, borderLeft: "2px solid rgba(78,168,222,0.2)", display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>
          {[
            { date: "Mar 2026", label: "Team Formation Opens", desc: "Find co-creators on MetaCreate", active: true },
            { date: "Early Apr", label: "Online Pre-Match (1 week)", desc: "Cross-node collaboration prep" },
            { date: "Mid Apr", label: "In-Person Hackathon (3 days)", desc: "Simultaneous creation at all nodes" },
            { date: "Late Apr", label: "Demo Day & Awards", desc: "Present prototypes, celebrate wins" },
          ].map((item, i) => (
            <div key={i} style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: -29, top: 4, width: 12, height: 12, borderRadius: "50%", background: item.active ? "#4EA8DE" : "#2a2a4a", border: item.active ? "2px solid rgba(78,168,222,0.5)" : "2px solid #333", animation: item.active ? "glow 2s infinite" : "none" }} />
              <span style={{ color: item.active ? "#4EA8DE" : "#666", fontSize: 11, fontWeight: 600 }}>{item.date}</span>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginTop: 2 }}>{item.label}</div>
              <p style={{ color: "#888", fontSize: 12, marginTop: 2 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ background: "linear-gradient(135deg, rgba(74,123,212,0.15), rgba(232,148,90,0.15))", borderRadius: 16, padding: 24, textAlign: "center", border: "1px solid rgba(78,168,222,0.2)" }}>
          <MetaFire expression="excited" size={48} />
          <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginTop: 12 }}>Ready to build the future?</h3>
          <p style={{ color: "#b0b0cc", fontSize: 13, marginTop: 8, marginBottom: 16 }}>Register your team for the Space Base Challenge</p>
          <Button variant="primary" size="lg">Register Your Team 🚀</Button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ───────────────────────────────────
export default function MetaCreateApp() {
  const [page, setPage] = useState("onboarding");
  const [currentUser, setCurrentUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [connectTarget, setConnectTarget] = useState(null);
  const [notifications, setNotifications] = useState(2);

  const handleOnboardingComplete = (user) => { setCurrentUser(user); setPage("explore"); };
  const handleViewProfile = (user) => { setViewingUser(user); setPage("viewProfile"); };
  const handleConnect = (user) => setConnectTarget(user);
  const handleRequestSent = () => { setConnectTarget(null); setNotifications((n) => Math.max(0, n - 1)); };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: "#fff", background: "#0c0c1a", minHeight: "100vh" }}>
      <style>{globalCSS}</style>
      {page !== "onboarding" && <Navbar currentPage={page} setPage={setPage} notifCount={notifications} />}
      {page === "onboarding" && <OnboardingPage onComplete={handleOnboardingComplete} />}
      {page === "explore" && <ExplorePage currentUser={currentUser} onViewProfile={handleViewProfile} onConnect={handleConnect} />}
      {page === "projects" && <ProjectGallery currentUser={currentUser} onViewProfile={handleViewProfile} />}
      {page === "viewProfile" && <ProfilePage user={viewingUser} currentUser={currentUser} onConnect={handleConnect} onBack={() => setPage("explore")} />}
      {page === "profile" && <ProfilePage user={currentUser} currentUser={currentUser} onBack={null} />}
      {page === "teams" && <TeamsPage currentUser={currentUser} />}
      {page === "event" && <EventPage currentUser={currentUser} />}
      <IceBreakerModal open={!!connectTarget} onClose={() => setConnectTarget(null)} sender={currentUser} recipient={connectTarget} onSend={handleRequestSent} />
    </div>
  );
}
