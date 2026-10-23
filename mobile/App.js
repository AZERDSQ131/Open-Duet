import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Ellipse, Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { HERMES_ENABLED, askHermes } from "./src/hermes";

const C = {
  app: "#F9F9F7",
  card: "#FBFBF9",
  raise: "#F1F0EC",
  bubble: "#EDEDEB",
  peach: "#F5D3C2",
  ink: "#171714",
  muted: "#7D7D75",
  faint: "#A4A49C",
  line: "#E9E7E2",
  accent: "#D97757",
  accentDeep: "#B9613F",
  green: "#3E7B37",
  greenSoft: "#EAF2E7",
  white: "#FFFFFF",
};

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });
const SCREEN_W = Dimensions.get("window").width;

const shadow = {
  shadowColor: "#1C1A12",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 4,
};

const shadowSoft = {
  shadowColor: "#1C1A12",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 6,
  elevation: 1,
};

/* ------------------------------------------------------------------ data */

const TASKS = [
  {
    id: "series-a-meeting",
    title: "Series A meeting",
    status: "input",
    group: "active",
    meta: "Slides for Thursday · 2 need your eye",
    detail: "email",
    done: false,
  },
  {
    id: "chicago-cafe",
    title: "Chicago cafe opening",
    status: "input",
    group: "active",
    meta: "Approve the health permit · $640",
    detail: "permit",
    done: false,
  },
  {
    id: "series-a-deck",
    title: "Series A deck",
    status: "review",
    group: "active",
    meta: "12 slides rebuilt with Q3",
    detail: "deck",
    done: false,
  },
  {
    id: "partner-prep",
    title: "Partner meeting prep",
    status: "review",
    group: "active",
    meta: "A 2-minute read before Thursday",
    detail: "note",
    done: false,
  },
  {
    id: "cover-art",
    title: "Make cover art for the game",
    status: "review",
    group: "active",
    meta: "Which cover should I take forward?",
    detail: "note",
    done: false,
  },
  {
    id: "sum-up",
    title: "Sum up where Null District stands",
    status: "review",
    group: "active",
    meta: "Ready to mark this done?",
    detail: "note",
    done: false,
  },
  {
    id: "tokyo-hotel",
    title: "Pick the Tokyo hotel",
    status: "upcoming",
    group: "upnext",
    when: "Tomorrow",
    meta: "Three options within budget",
    detail: "note",
    done: false,
  },
  {
    id: "q3-pricing",
    title: "Review the Q3 pricing memo",
    status: "upcoming",
    group: "upnext",
    when: "Thu 10:00",
    meta: "Harbor meeting follows at 10",
    detail: "note",
    done: false,
  },
  {
    id: "harbor-contract",
    title: "Sign the Harbor contract",
    status: "upcoming",
    group: "upnext",
    when: "Fri",
    meta: "Waiting on Tomas",
    detail: "note",
    done: false,
  },
];

const NOTES = {
  "partner-prep": {
    summary:
      "I put the six questions we need to settle before Thursday into one page. The pricing slide is the only open item.",
    items: [
      "Lead with the 8.4% Q3 variance, not the plan.",
      "Ask about Northfield’s Net 60 before the deck goes out.",
      "Keep the appendix short — 2 slides maximum.",
    ],
  },
  "cover-art": {
    summary:
      "I made three covers. The second one tested best against the current key art — same warm palette, less noise.",
    items: [
      "Cover 02 keeps the terracotta mark and adds depth.",
      "Cover 01 is the safest, most legible at store size.",
      "Cover 03 needs one more pass on the typography.",
    ],
  },
  "sum-up": {
    summary:
      "Null District is on track for the Windows build. The Unity license is the only thing blocking the handoff.",
    items: [
      "12 of 14 build tasks are green.",
      "The settings menu is in review.",
      "Windows build waits on license secrets.",
    ],
  },
  "tokyo-hotel": {
    summary:
      "Three hotels are within budget and all within 15 minutes of the office. The Trunk is the closest by far.",
    items: [
      "The Trunk — 4 min walk, quiet rooms.",
      "Aoyama Grand — 12 min, better gym.",
      "Shibuya House — 14 min, most flexible cancel.",
    ],
  },
  "q3-pricing": {
    summary:
      "The memo is ready. The 10% uplift holds at every tier except Enterprise, where Net 60 changes the math.",
    items: [
      "Keep Pro at 10% with annual prepay.",
      "Enterprise needs a 6% cap if Net 60 stays.",
      "Add a one-page summary for Thursday.",
    ],
  },
  "harbor-contract": {
    summary:
      "Net 60 is the only change from the last redline. I flagged the two clauses to read before signing.",
    items: [
      "Clause 4.2 — payment terms moved to Net 60.",
      "Clause 9.1 — data room access survives termination.",
      "Everything else matches the signed template.",
    ],
  },
};

const STATUS = {
  input: { label: "Needs input", color: C.accentDeep, dot: C.accentDeep },
  review: { label: "Ready for review", color: C.green, dot: C.green },
  sent: { label: "Sent", color: C.green, dot: C.green },
  upcoming: { label: "Scheduled", color: "#9E7A3B", dot: "#B5A06C" },
};

const ARTIFACTS = {
  q3: {
    id: "q3",
    eyebrow: "Finance · Board prep",
    title: "Q3 variance",
    date: "Wednesday, 21 Oct 2026",
    read: "2 min read",
    cardEyebrow: "Finance · Board prep",
    cardTitle: "Q3 variance",
    cardBody: "Net revenue 8.4% above plan. One collection risk to watch.",
    cardDate: "Wed 21 Oct",
    view: "q3",
  },
  daily: {
    id: "daily",
    eyebrow: "Day sheet · Pacific time",
    title: "Daily todo",
    date: "Wednesday, 21 Oct 2026",
    read: "1 min read",
    cardEyebrow: "Day sheet · Pacific time",
    cardTitle: "Daily todo",
    cardBody: "Two meetings, one decision, and a quiet afternoon.",
    cardDate: "Wed 21 Oct",
    view: "daily",
  },
  brief: {
    id: "brief",
    eyebrow: "Morning note · 7:00 AM",
    title: "Morning brief",
    date: "Wednesday, 21 Oct 2026",
    read: "2 min read",
    cardEyebrow: "Morning note",
    cardTitle: "Morning brief",
    cardBody: "Hiring, Northfield, Chicago, Series A, Customers.",
    cardDate: "Wed 21 Oct",
    view: "brief",
  },
  email: {
    id: "email",
    eyebrow: "Inbox · Triage",
    title: "Email triage",
    date: "Wednesday, 21 Oct 2026",
    read: "1 min read",
    cardEyebrow: "Inbox · Triage",
    cardTitle: "Email triage",
    cardBody: "27 new since yesterday. 3 need you, 4 are FYI.",
    cardDate: "Wed 21 Oct",
    view: "email",
  },
  tokyo: {
    id: "tokyo",
    eyebrow: "Travel · Tokyo",
    title: "Tokyo trip",
    date: "Nov 12–19, 2026",
    read: "2 min read",
    cardEyebrow: "Travel · Tokyo",
    cardTitle: "Tokyo trip",
    cardBody: "Flights held. Three hotels near the office.",
    cardDate: "Nov 12–19",
    view: "tokyo",
  },
  deck: {
    id: "deck",
    eyebrow: "Series A · Deck",
    title: "Series A deck",
    date: "Thursday, 22 Oct 2026",
    read: "12 slides",
    cardEyebrow: "Series A · Deck",
    cardTitle: "Series A deck",
    cardBody: "12 slides rebuilt with Q3. Two need your eye.",
    cardDate: "12 slides",
    view: "deck",
  },
};

const SEARCH_ITEMS = [
  { id: "q3", title: "Q3 variance", sub: "Artifact · 2 min read", icon: "bar-chart-2" },
  { id: "brief", title: "Morning brief", sub: "Chat · 5 things today", icon: "clock" },
  { id: "daily", title: "Daily todo", sub: "Artifact · Day sheet", icon: "check-square" },
  { id: "tokyo", title: "Tokyo trip", sub: "Artifact · Nov 12–19", icon: "globe" },
  { id: "deck", title: "Series A deck", sub: "Artifact · 12 slides", icon: "monitor" },
];

const CHANNELS = [
  { id: "null-district", name: "Null District", sub: "Game · build & art", icon: "layers", tint: "#F7E5DA", color: "#B76647" },
  { id: "tokyo-trip", name: "Tokyo trip", sub: "Dates set · hotel to pick", icon: "globe", tint: "#E9F0F8", color: "#4E7FAE" },
  { id: "q3-planning", name: "Q3 planning", sub: "Reading 2 of 4 · pricing", icon: "bar-chart-2", tint: "#F7EDDD", color: "#A87A39" },
  { id: "contracts", name: "Contracts", sub: "Waiting on Tomas to sign", icon: "file-text", tint: "#EEAAF9", color: "#6C5AA8" },
  { id: "home-admin", name: "Home admin", sub: "Passport and expenses", icon: "home", tint: "#EAF1E7", color: "#4D7F45" },
];

/* -------------------------------------------------------------- primitives */

function Mark({ size = 56, color = "#121210" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Ellipse cx="50" cy="50" rx="20" ry="21.4" fill="#D97757" />
      <Path
        d="M11 56.5C20 56.5 24.5 48.5 33.5 48.5C42.5 48.5 44.5 59.5 54 59.5C63.5 59.5 66 49 74.5 49C82 49 85.5 53 89 55"
        fill="none"
        stroke={color}
        strokeWidth={5.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MenuIcon({ color = C.ink }) {
  return (
    <View style={{ width: 18, height: 16, justifyContent: "space-between" }}>
      <View style={{ width: 16, height: 1.6, borderRadius: 1, backgroundColor: color }} />
      <View style={{ width: 10, height: 1.6, borderRadius: 1, backgroundColor: color }} />
      <View style={{ width: 13, height: 1.6, borderRadius: 1, backgroundColor: color }} />
    </View>
  );
}

function RoundBtn({ icon, onPress, size = 40, iconSize = 17, style, color = "#2D2D28", label }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#FDFDFB",
          borderWidth: 1,
          borderColor: C.line,
          alignItems: "center",
          justifyContent: "center",
        },
        shadowSoft,
        pressed && { opacity: 0.65, transform: [{ scale: 0.96 }] },
        style,
      ]}
    >
      <Feather name={icon} size={iconSize} color={color} />
    </Pressable>
  );
}

function TopBar({ onMenu, onVoice }) {
  return (
    <View style={styles.topbarOuter} pointerEvents="box-none">
      <View style={styles.topbarInner}>
        <Pressable
          onPress={onMenu}
          accessibilityLabel="Open menu"
          style={({ pressed }) => [styles.orb, pressed && { opacity: 0.65 }]}
        >
          <MenuIcon />
        </Pressable>
        <Pressable
          onPress={onVoice}
          accessibilityLabel="Talk to Open Duet"
          style={({ pressed }) => [styles.brandOrb, pressed && { opacity: 0.8 }]}
        >
          <Mark size={56} />
        </Pressable>
        <Pressable
          onPress={onMenu}
          accessibilityLabel="Open profile"
          style={({ pressed }) => [styles.orb, pressed && { opacity: 0.65 }]}
        >
          <Text style={styles.avatarText}>AF</Text>
        </Pressable>
      </View>
    </View>
  );
}

const TABS = [
  { id: "chat", label: "Chat", icon: "message-circle" },
  { id: "tasks", label: "Tasks", icon: "check-square" },
  { id: "make", label: "Make", icon: "edit-3" },
];

function TabBar({ active, onChange }) {
  return (
    <View style={styles.tabbarOuter}>
      <View style={styles.tabbar}>
        {TABS.map((tab) => {
          const on = active === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              style={[styles.tab, on && styles.tabActive]}
            >
              <Feather name={tab.icon} size={16} color={on ? "#161613" : "#66665F"} />
              <Text style={[styles.tabLabel, on && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function WaveIcon({ size = 15, color = "#fff" }) {
  const bars = [0.45, 0.8, 1, 0.7, 0.5];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2, height: size }}>
      {bars.map((b, i) => (
        <View
          key={i}
          style={{ width: 1.7, height: size * b, borderRadius: 1, backgroundColor: color }}
        />
      ))}
    </View>
  );
}

function Composer({ value, onChange, onSubmit, onVoice, onAttach, placeholder }) {
  const hasText = value.trim().length > 0;
  return (
    <View style={styles.composerWrap}>
      <View style={styles.composer}>
        <Pressable onPress={onAttach} hitSlop={8} style={styles.composerIcon}>
          <Feather name="plus" size={18} color="#2C2C27" />
        </Pressable>
        <TextInput
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor="#9B9B93"
          style={styles.composerInput}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        {!hasText ? (
          <Pressable onPress={onVoice} hitSlop={8} style={styles.composerIcon}>
            <Feather name="mic" size={16} color="#3D3D37" />
          </Pressable>
        ) : null}
        <Pressable onPress={onSubmit} style={({ pressed }) => [styles.send, pressed && { opacity: 0.8 }]}>
          {hasText ? (
            <Feather name="arrow-up" size={17} color="#fff" />
          ) : (
            <WaveIcon size={15} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Toast({ message }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const shift = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (!message) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(shift, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
    return () => {
      opacity.setValue(1);
      shift.setValue(0);
    };
  }, [message, opacity, shift]);

  if (!message) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { opacity, transform: [{ translateY: shift }] }]}
    >
      <View style={styles.toastCheck}>
        <Feather name="check" size={12} color="#B8DFAE" />
      </View>
      <Text style={styles.toastText} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

function Cta({ label, onPress, variant = "dark", icon, style, small }) {
  const dark = variant === "dark";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cta,
        small && styles.ctaSmall,
        dark ? styles.ctaDark : styles.ctaGhost,
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {icon ? <Feather name={icon} size={15} color={dark ? "#fff" : C.ink} /> : null}
      <Text style={[styles.ctaText, !dark && { color: C.ink }]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ chat */

function ApprovalCard({ initialApproved, onApproved, compact }) {
  const [mode, setMode] = useState(initialApproved ? "approved" : "pending");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMode(initialApproved ? "approved" : "pending");
  }, [initialApproved]);

  const approve = () => {
    if (busy || mode !== "pending") return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setMode("approved");
      onApproved && onApproved();
    }, 700);
  };

  return (
    <View style={[styles.approval, mode === "approved" && styles.approvalApproved]}>
      {mode === "pending" ? (
        <>
          <View style={styles.approvalHead}>
            <Text style={styles.approvalAmount}>$640.00</Text>
            <Text style={styles.approvalExpiry}>Expires in 8 min</Text>
          </View>
          <Text style={styles.approvalMerchant}>County health permit</Text>
          <View style={styles.approvalRow}>
            <Text style={styles.approvalRowText}>Health permit fee</Text>
            <Feather name="chevron-right" size={16} color="#A0A098" />
          </View>
          <Cta
            label={busy ? "Approving…" : "Approve"}
            onPress={approve}
            style={busy && { opacity: 0.65 }}
          />
          <Cta label="Not now" variant="ghost" onPress={() => setMode("deferred")} style={{ marginTop: 8 }} />
        </>
      ) : null}

      {mode === "approved" ? (
        <View style={styles.approvalState}>
          <View style={styles.doneBadge}>
            <Feather name="check" size={17} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.doneTitle}>Health permit approved</Text>
            <Text style={styles.doneSub}>$640.00 · Receipt filed in Chicago</Text>
          </View>
          <Text style={styles.textLink}>View</Text>
        </View>
      ) : null}

      {mode === "deferred" ? (
        <View style={styles.approvalState}>
          <View style={[styles.doneBadge, { backgroundColor: "#F5EEE1" }]}>
            <Feather name="clock" size={17} color="#9E7A3B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.doneTitle}>We’ll ask again at 5:00 PM</Text>
            <Text style={styles.doneSub}>The county form is saved and ready.</Text>
          </View>
          <Pressable onPress={() => setMode("pending")} hitSlop={8}>
            <Text style={styles.textLink}>Undo</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function BriefBubble() {
  const bullets = [
    {
      label: "Hiring",
      color: "#24579A",
      bg: "#E7F0FA",
      text: " : Jenn’s other offer expires at 6 p.m. All 3 finalists are booked for today. Invites are ready.",
    },
    {
      label: "Northfield",
      color: "#24579A",
      bg: "#E7F0FA",
      text: " : They redlined the $410K renewal and want Net 60. The changes are summarized.",
    },
    {
      label: "Chicago location",
      color: "#8A5A2C",
      bg: "#F8E8C7",
      text: " : Opens Nov 14. The health permit needs your OK and $640.",
    },
    {
      label: "Series A",
      color: "#8A5A2C",
      bg: "#F8E8C7",
      text: " : Harbor meets Thursday at 10. The deck is rebuilt with Q3. 2 slides need your eye.",
    },
    {
      label: "Customers",
      color: "#24579A",
      bg: "#E7F0FA",
      text: " : 27 wrong delivery orders this weekend. 19 from Valencia. Refunds are drafted.",
    },
  ];

  return (
    <View style={styles.brief}>
      {bullets.map((b, i) => (
        <View key={b.label} style={[styles.bulletRow, i > 0 && { marginTop: 7 }]}>
          <View style={styles.bulletDot} />
          <Text style={styles.briefText}>
            <Text style={[styles.briefPill, { color: b.color, backgroundColor: b.bg }]}>
              {` ${b.label} `}
            </Text>
            {b.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

const REPLIES = {
  deck: "I’ve got the deck and the data room link together. You can review the email draft in Tasks.",
  maya: "The draft to Maya is ready in Tasks — deck and data room, one review before it sends.",
  permit: "The $640 health permit is the only thing blocking the Chicago opening. It expires in 8 minutes.",
  morning: "Your morning brief is ready: Hiring, Northfield, Chicago, Series A, Customers.",
  github: "Connect GitHub and I’ll pick up your repos from there. I can read, review, and open pull requests with you.",
  default: "Got it. I’ll take a look and come back with the next step.",
};

function replyFor(text) {
  const v = text.toLowerCase();
  if (v.includes("deck") || v.includes("slide")) return REPLIES.deck;
  if (v.includes("maya") || v.includes("email")) return REPLIES.maya;
  if (v.includes("permit") || v.includes("approve") || v.includes("chicago")) return REPLIES.permit;
  if (v.includes("morning") || v.includes("brief")) return REPLIES.morning;
  if (v.includes("github") || v.includes("repo")) return REPLIES.github;
  return REPLIES.default;
}

function TopBlur() {
  return (
    <View pointerEvents="none" style={styles.topBlur}>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={["rgba(0,0,0,1)", "rgba(0,0,0,0.01)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <BlurView tint="light" intensity={100} style={StyleSheet.absoluteFill} />
      </MaskedView>
      <LinearGradient
        colors={[
          "#FFFFFF",
          "#FFFFFF",
          "rgba(255,255,255,0.92)",
          "rgba(255,255,255,0.35)",
          "rgba(255,255,255,0)",
        ]}
        locations={[0, 0.62, 0.72, 0.88, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const HERMES_SYSTEM = {
  chicago:
    "You are Open Duet, a concise personal operations assistant. The current thread is the Chicago location opening: it opens in 26 days, 33 of 41 checklist items are done or on track, and the $640 county health permit is the one item that needs the user today. Keep replies to 1-3 sentences.",
  brief:
    "You are Open Duet, a concise personal operations assistant. The current thread is the morning brief: Hiring (Jenn's finalist offer), Northfield renewal, Chicago location permit, Series A with Harbor on Thursday, and Customers delivery issues. Keep replies to 1-3 sentences.",
  github:
    "You are Open Duet, a concise personal operations assistant. The current thread is GitHub setup. The user has connected GitHub and the null-district repository has open pull requests. Keep replies to 1-3 sentences.",
};

function ChatScreen({ conv, onMenu, onVoice, toast, visible }) {
  const [input, setInput] = useState("");
  const [extras, setExtras] = useState({ chicago: [], brief: [], github: [] });
  const [typing, setTyping] = useState(null);
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 40);
  }, [conv]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [extras, typing]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 60);
    }
  }, [visible]);

  const add = (who, text) => {
    setExtras((prev) => ({
      ...prev,
      [conv]: [...prev[conv], { id: `${Date.now()}-${Math.random()}`, me: who === "me", text }],
    }));
  };

  const appendAgentReply = (targetConv, text) => {
    setExtras((prev) => ({
      ...prev,
      [targetConv]: [
        ...prev[targetConv],
        { id: `${Date.now()}-a`, me: false, text },
      ],
    }));
  };

  const send = () => {
    const text = input.trim();
    if (!text) {
      onVoice();
      return;
    }

    const targetConv = conv;
    const history = (extras[targetConv] || []).map((message) => ({
      role: message.me ? "user" : "assistant",
      content: message.text,
    }));

    setInput("");
    add("me", text);
    setTyping(targetConv);

    if (HERMES_ENABLED) {
      askHermes([
        { role: "system", content: HERMES_SYSTEM[targetConv] || HERMES_SYSTEM.chicago },
        ...history,
        { role: "user", content: text },
      ])
        .then((reply) => {
          setTyping((current) => (current === targetConv ? null : current));
          appendAgentReply(targetConv, reply);
        })
        .catch(() => {
          setTyping((current) => (current === targetConv ? null : current));
          appendAgentReply(targetConv, replyFor(text));
          toast("Hermes Agent unreachable · simulated reply");
        });
      return;
    }

    setTimeout(() => {
      setTyping((current) => (current === targetConv ? null : current));
      appendAgentReply(targetConv, replyFor(text));
    }, 1500);
  };

  const connectGithub = () => {
    if (connected) return;
    toast("Running a command…");
    setTimeout(() => {
      setConnected(true);
      toast("GitHub connected");
    }, 1800);
  };

  const messages = extras[conv] || [];

  return (
    <KeyboardAvoidingView
      style={[styles.screen, styles.screenUnderHeader, !visible && styles.hidden]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={8}
    >
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={onMenu} style={styles.ctx}>
          <View
            style={[
              styles.ctxIcon,
              conv === "brief"
                ? { backgroundColor: "#F1F1EE", borderWidth: 1, borderColor: "#E5E3DE" }
                : conv === "github"
                  ? { backgroundColor: "#F0EDF8" }
                  : { backgroundColor: "#F9E9C8" },
            ]}
          >
            {conv === "brief" ? (
              <Feather name="check" size={12} color="#77776F" />
            ) : conv === "github" ? (
              <Feather name="code" size={12} color="#6F5CA8" />
            ) : (
              <Text style={{ fontSize: 11 }}>✋</Text>
            )}
          </View>
          <Text style={styles.ctxLabel}>
            {conv === "chicago"
              ? "Chicago location opening"
              : conv === "brief"
                ? "Morning brief"
                : "GitHub setup"}
          </Text>
        </Pressable>

        {conv === "chicago" ? (
          <View style={styles.messages}>
            <Bubble text="The Chicago location opens in 26 days. I built the opening checklist from your last two openings: 41 items." />
            <Bubble text="33 are done or on track. 7 I’m watching. 1 needs you today." narrow width={253} />
            <Bubble text="Health permit: the county form is filled. The fee is $640." width={273} />
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {typing === "chicago" ? <Typing /> : null}
          </View>
        ) : null}

        {conv === "brief" ? (
          <View style={styles.messages}>
            <BriefBubble />
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {typing === "brief" ? <Typing /> : null}
          </View>
        ) : null}

        {conv === "github" ? (
          <View style={styles.messages}>
            <View style={{ alignSelf: "flex-end", alignItems: "flex-end", maxWidth: "82%" }}>
              <Bubble me text="Can you connect to my GitHub?" />
              <Text style={styles.seen}>Seen</Text>
            </View>
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>
                Yes, though you need to do the connecting yourself. Use{" "}
                <Text style={styles.inlineLink} onPress={connectGithub}>
                  Connect GitHub
                </Text>
                , and once that’s done I can read your repos and work on them with you.
              </Text>
            </View>
            {connected || messages.length ? (
              <>
                <View style={{ alignSelf: "flex-end", maxWidth: "82%" }}>
                  <Bubble me text="It’s connected" />
                </View>
                <Bubble text="I can see 12 repos. null-district has 3 open pull requests — want me to review the cover art one?" />
              </>
            ) : null}
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {typing === "github" ? <Typing /> : null}
          </View>
        ) : null}
      </ScrollView>

      <TopBlur />

      <Composer
        value={input}
        onChange={setInput}
        onSubmit={send}
        onVoice={onVoice}
        onAttach={() => toast("Attachments simulated")}
        placeholder="Message Open Duet"
      />
    </KeyboardAvoidingView>
  );
}

function Bubble({ text, me, width = 305, narrow }) {
  return (
    <View
      style={[
        styles.bubble,
        { maxWidth: width },
        narrow && { maxWidth: 260 },
        me && styles.bubbleMe,
        me && { alignSelf: "flex-end" },
      ]}
    >
      <Text style={[styles.bubbleText, me && { color: "#2C211A" }]}>{text}</Text>
    </View>
  );
}

function MessageBubble({ message }) {
  return (
    <View style={[{ maxWidth: "84%" }, message.me ? { alignSelf: "flex-end" } : null]}>
      <View style={[styles.bubble, message.me && styles.bubbleMe]}>
        <Text style={[styles.bubbleText, message.me && { color: "#2C211A" }]}>{message.text}</Text>
      </View>
    </View>
  );
}

function Typing() {
  return (
    <View style={styles.typing}>
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
    </View>
  );
}

/* ------------------------------------------------------------------ tasks */

function TasksScreen({ tasks, onToggle, onOpen, onNewTask, visible, toast }) {
  const [tab, setTab] = useState("active");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState("recent");

  const visibleTasks = tasks.filter((t) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const status = STATUS[t.status]?.label || "";
    return `${t.title} ${t.meta} ${status} ${t.when || ""}`.toLowerCase().includes(q);
  });

  const active = visibleTasks.filter((t) => t.group === "active");
  let inputGroup = active.filter((t) => t.status === "input");
  let reviewGroup = active.filter((t) => t.status !== "input");
  if (sort === "az") {
    inputGroup = [...inputGroup].sort((a, b) => a.title.localeCompare(b.title));
    reviewGroup = [...reviewGroup].sort((a, b) => a.title.localeCompare(b.title));
  }
  const upnext = visibleTasks.filter((t) => t.group === "upnext");
  const tomorrow = upnext.filter((t) => t.when === "Tomorrow");
  const later = upnext.filter((t) => t.when !== "Tomorrow");
  const openCount = tasks.filter((t) => t.group === "active" && !t.done).length;

  const groupHead = (label, dotColor, count, side) => (
    <View style={styles.groupHead}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: dotColor }} />
        <Text style={styles.groupHeadLabel}>{label}</Text>
        <Text style={styles.groupHeadCount}>{count}</Text>
      </View>
      <Text style={styles.groupHeadSide}>{side}</Text>
    </View>
  );

  const renderTask = (task) => {
    if (task.group === "upnext") {
      return (
        <Pressable
          key={task.id}
          onPress={() => onOpen(task)}
          style={({ pressed }) => [styles.taskRow, pressed && { backgroundColor: "rgba(20,20,12,0.03)" }]}
        >
          <Text style={styles.taskWhen}>{task.when}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={[styles.taskSub, { color: C.muted }]} numberOfLines={1}>
              {task.meta}
            </Text>
          </View>
        </Pressable>
      );
    }

    const status = STATUS[task.status] || STATUS.review;
    return (
      <View key={task.id} style={styles.taskRow}>
        <Pressable
          onPress={() => onToggle(task.id)}
          hitSlop={8}
          style={[
            styles.checkbox,
            task.done && { backgroundColor: C.greenSoft, borderColor: "#C8DCC2" },
          ]}
        >
          {task.done ? <Feather name="check" size={12} color={C.green} /> : null}
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => onOpen(task)}>
          <Text
            style={[
              styles.taskTitle,
              task.done && { color: "#8A8A82", textDecorationLine: "line-through" },
            ]}
          >
            {task.title}
          </Text>
          <Text
            style={[styles.taskSub, task.done && { opacity: 0.55 }]}
            numberOfLines={1}
          >
            <Text style={{ color: status.color, fontWeight: "500" }}>{status.label}</Text>
            <Text> · {task.meta}</Text>
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.screen, styles.screenUnderHeader, !visible && styles.hidden]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.taskScroll}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.tasksTop}>
        <View style={styles.tasksHead}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 16 }}>
            <Pressable onPress={() => setTab("active")}>
              <View style={{ position: "relative" }}>
                <Text style={[styles.tabTitle, tab === "active" && styles.tabTitleActive]}>Active</Text>
                {tab === "active" ? <View style={styles.tabUnderline} /> : null}
              </View>
            </Pressable>
            <Pressable onPress={() => setTab("upnext")}>
              <Text style={[styles.tabTitle, tab === "upnext" && styles.tabTitleActive]}>Up next</Text>
              {tab === "upnext" ? <View style={styles.tabUnderline} /> : null}
            </Pressable>
          </View>
          <View style={styles.tools}>
            <Pressable
              hitSlop={8}
              onPress={() => {
                setSort(sort === "az" ? "recent" : "az");
                toast(sort === "az" ? "Sorted by recent" : "Sorted A–Z");
              }}
            >
              <Feather name="sliders" size={17} color="#3D3D37" />
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setQuery("");
              }}
            >
              <Feather name="search" size={17} color="#3D3D37" />
            </Pressable>
          </View>
        </View>

        {searchOpen ? (
          <View style={styles.taskSearch}>
            <Feather name="search" size={15} color={C.muted} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search tasks"
              placeholderTextColor={C.faint}
              style={styles.taskSearchInput}
            />
            <Pressable
              hitSlop={8}
              onPress={() => {
                setQuery("");
                setSearchOpen(false);
              }}
            >
              <Feather name="x" size={15} color={C.muted} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.listMeta}>
          <Text style={styles.listMetaText}>
            {query.trim()
              ? `${visibleTasks.length} result${visibleTasks.length === 1 ? "" : "s"}`
              : tab === "active"
                ? `${openCount} open`
                : `${upnext.length} scheduled`}
          </Text>
          <Text style={[styles.listMetaText, { color: "#A7A79F" }]}>
            {tab === "active" ? "Updated just now" : "Next · Tomorrow"}
          </Text>
        </View>
      </View>

        {tab === "active" ? (
          <>
            {inputGroup.length ? (
              <>
                {groupHead("Needs input", C.accentDeep, inputGroup.filter((t) => !t.done).length, "Today")}
                {inputGroup.map(renderTask)}
              </>
            ) : null}
            {reviewGroup.length ? (
              <>
                {groupHead("Ready for review", C.green, reviewGroup.filter((t) => !t.done).length, "Earlier")}
                {reviewGroup.map(renderTask)}
              </>
            ) : null}
            {!inputGroup.length && !reviewGroup.length ? (
              <Text style={styles.emptyText}>Nothing matches that search.</Text>
            ) : null}
          </>
        ) : (
          <>
            {tomorrow.length ? (
              <>
                {groupHead("Tomorrow", "#B5A06C", tomorrow.length, "Wed 22 Oct")}
                {tomorrow.map(renderTask)}
              </>
            ) : null}
            {later.length ? (
              <>
                {groupHead("This week", "#B5A06C", later.length, "Thu–Fri")}
                {later.map(renderTask)}
              </>
            ) : null}
            {!tomorrow.length && !later.length ? (
              <Text style={styles.emptyText}>Nothing scheduled.</Text>
            ) : null}
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <TopBlur />

      <Pressable
        onPress={onNewTask}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
      >
        <Feather name="plus" size={24} color="#FDFAF7" />
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------- make */

const CREATE_TYPES = [
  { label: "Design System", icon: "grid", tint: "#EEEAFB", color: "#6F5BB0", overlayTint: "rgba(139,108,255,0.20)", overlayColor: "#B8A5FF" },
  { label: "Design", icon: "pen-tool", tint: "#EEEAFB", color: "#6F5BB0", overlayTint: "rgba(139,108,255,0.20)", overlayColor: "#B8A5FF" },
  { label: "Dashboard", icon: "bar-chart-2", tint: "#E9F0F8", color: "#4E7FAE", overlayTint: "rgba(90,150,255,0.16)", overlayColor: "#8FC0FF" },
  { label: "Slides", icon: "monitor", tint: "#F9E7DC", color: "#BA6A44", overlayTint: "rgba(255,150,90,0.16)", overlayColor: "#FFB186" },
  { label: "Docs", icon: "file-text", tint: "#E5EEF9", color: "#4E7FB5", overlayTint: "rgba(90,150,255,0.15)", overlayColor: "#86B4FF" },
  { label: "Web page", icon: "globe", tint: "#F8E4D9", color: "#B9613F", overlayTint: "rgba(217,119,87,0.20)", overlayColor: "#F0A181" },
];

const RECENT = [
  { id: "q3", time: "2 hr ago", icon: "file-text", tint: "#E5EEF9", color: "#4E7FB5" },
  { id: "email", time: "5 hr ago", icon: "inbox", tint: "#F7EDDD", color: "#A87A39" },
  { id: "tokyo", time: "Yesterday", icon: "globe", tint: "#E9F0F8", color: "#4E7FAE" },
];

const DESIGNS = [
  { id: "daily", time: "3 days ago", icon: "pen-tool", tint: "#EEEAFB", color: "#7B63B8" },
  { id: "brief", time: "3 days ago", icon: "layout", tint: "#F9E7DC", color: "#BA6A44" },
  { id: "deck", time: "4 days ago", icon: "monitor", tint: "#F3E9DC", color: "#A87A39" },
];

function MakeScreen({ visible, onOpenArtifact, artifacts, railOrder, onCreateDraft, railTouchRef }) {
  const [hero, setHero] = useState(true);
  const [menu, setMenu] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);

  useEffect(() => {
    if (!visible && railTouchRef) railTouchRef.current = 0;
  }, [visible, railTouchRef]);

  const markRailTouch = () => {
    if (railTouchRef) railTouchRef.current = Date.now();
    return false;
  };
  const menuAnim = useRef(new Animated.Value(0)).current;
  const fabSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (menu) {
      setMenuMounted(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(menuAnim, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(fabSpin, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(menuAnim, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fabSpin, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMenuMounted(false);
      });
    }
  }, [menu, menuAnim, fabSpin]);

  const generated = railOrder.filter((id) => id.startsWith("gen-") && artifacts[id]);
  const designIds = [...DESIGNS, ...generated.map((id) => ({ id, time: "Just now", icon: "pen-tool", tint: "#EEEAFB", color: "#7B63B8" }))];

  return (
    <View style={[styles.screen, styles.screenUnderHeader, !visible && styles.hidden]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.makeContent}
        showsVerticalScrollIndicator={false}
      >
        {hero ? (
          <LinearGradient colors={["#F7F1E9", "#EFE6DC"]} style={styles.makeHero}>
            <Pressable style={styles.heroX} onPress={() => setHero(false)} hitSlop={10}>
              <Feather name="x" size={20} color="#8A7F73" />
            </Pressable>

            <View style={styles.heroPreview}>
              <View style={styles.heroPreviewTitle} />
              <View style={[styles.heroPreviewLine, { width: "46%" }]} />
              <View style={[styles.heroPreviewLine, { width: "86%", marginTop: 9 }]} />
              <View style={[styles.heroPreviewLine, { width: "74%" }]} />
              <View style={styles.heroPill} />
              <View style={styles.heroBlock} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.heroBar, pressed && { opacity: 0.9 }]}
              onPress={() =>
                onCreateDraft({ label: "Web page", sample: "Bike shop booking page" })
              }
            >
              <View style={styles.heroKind}>
                <View style={styles.heroKindIcon}>
                  <Feather name="globe" size={13} color={C.accentDeep} />
                </View>
                <Text style={styles.heroKindText}>Web page</Text>
              </View>
              <Text style={styles.heroPrompt} numberOfLines={1}>
                A booking page for my bike shop
              </Text>
              <View style={styles.heroArrow}>
                <Feather name="arrow-up" size={15} color={C.accentDeep} />
              </View>
            </Pressable>
          </LinearGradient>
        ) : null}

        <View onStartShouldSetResponderCapture={markRailTouch}>
          <Text style={styles.makeSectionTitle}>Changed today</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.makeRail}
          onStartShouldSetResponderCapture={markRailTouch}
        >
          {RECENT.map(({ id, ...meta }) => {
            const artifact = artifacts[id] || ARTIFACTS[id];
            if (!artifact) return null;
            return (
              <MakeCard
                key={id}
                artifact={artifact}
                meta={meta}
                onPress={() => onOpenArtifact(id)}
                onTouchStart={markRailTouch}
              />
            );
          })}
        </ScrollView>
        </View>

        <View onStartShouldSetResponderCapture={markRailTouch}>
          <Text style={styles.makeSectionTitle}>Designs</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.makeRail}
          onStartShouldSetResponderCapture={markRailTouch}
        >
          {designIds.map(({ id, ...meta }) => {
            const artifact = artifacts[id] || ARTIFACTS[id];
            if (!artifact) return null;
            return (
              <MakeCard
                key={id}
                artifact={artifact}
                meta={meta}
                design
                onPress={() => onOpenArtifact(id)}
                onTouchStart={markRailTouch}
              />
            );
          })}
        </ScrollView>
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>

      <TopBlur />

      {menuMounted ? (
        <Animated.View
          pointerEvents={menu ? "auto" : "none"}
          style={[styles.makeScrim, { opacity: menuAnim }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenu(false)} />
        </Animated.View>
      ) : null}

      {menuMounted ? (
        <Animated.View
          pointerEvents={menu ? "auto" : "none"}
          style={[
            styles.plusMenu,
            {
              opacity: menuAnim,
              transform: [
                {
                  translateY: menuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
                {
                  scale: menuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {CREATE_TYPES.map((option, index) => (
            <Pressable
              key={option.label}
              onPress={() => {
                setMenu(false);
                onCreateDraft(option);
              }}
              style={({ pressed }) => [
                styles.plusMenuItem,
                { marginTop: index === 0 ? 0 : 8 },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={[styles.plusMenuIcon, { backgroundColor: option.tint }]}>
                <Feather name={option.icon} size={16} color={option.color} />
              </View>
              <Text style={styles.plusMenuLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      <Pressable
        onPress={() => setMenu((v) => !v)}
        style={({ pressed }) => [
          styles.makeFab,
          menu && styles.makeFabOpen,
          pressed && { transform: [{ scale: 0.94 }] },
        ]}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotate: fabSpin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "45deg"],
                }),
              },
            ],
          }}
        >
          <Feather name="plus" size={24} color="#FDFAF7" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

function MakeCard({ artifact, meta, design, onPress, onTouchStart }) {
  return (
    <Pressable
      onPress={onPress}
      onTouchStart={onTouchStart}
      style={({ pressed }) => [styles.makeCard, pressed && { opacity: 0.88 }]}
    >
      <Text style={styles.makeCardTitle} numberOfLines={2}>
        {artifact.cardTitle}
      </Text>
      <View style={styles.makeCardMeta}>
        <View style={[styles.makeCardIcon, { backgroundColor: meta.tint }]}>
          <Feather name={meta.icon} size={12} color={meta.color} />
        </View>
        <Text style={styles.makeCardTime}>{meta.time}</Text>
      </View>

      <View style={styles.makeCardPreview}>
        {design ? (
          <View style={styles.designMini}>
            <View style={styles.designMiniHead}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#C6C2B9" }} />
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#C6C2B9" }} />
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#C6C2B9" }} />
            </View>
            <View style={styles.designMiniBody}>
              <View style={styles.designMiniBlock} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={[styles.designMiniLine, { width: "88%" }]} />
                <View style={[styles.designMiniLine, { width: "64%" }]} />
                <View style={[styles.designMiniLine, { width: "76%" }]} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.paperMini}>
            <Text style={styles.paperMiniEyebrow} numberOfLines={1}>
              {artifact.cardEyebrow}
            </Text>
            <Text style={styles.paperMiniTitle} numberOfLines={1}>
              {artifact.cardTitle}
            </Text>
            <View style={[styles.paperMiniLine, { width: "86%" }]} />
            <View style={[styles.paperMiniLine, { width: "70%" }]} />
          </View>
        )}
      </View>
    </Pressable>
  );
}


/* ----------------------------------------------------------------- drawer */

function Drawer({ visible, onClose, onChat, onToast, currentConv }) {
  const insets = useSafeAreaInsets();
  const panelWidth = Math.min(372, SCREEN_W * 0.9);
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const closingByGesture = useRef(false);

  const closePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) =>
        g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.15,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        progress.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          progress.setValue(Math.max(0, Math.min(1, 1 + g.dx / panelWidth)));
        }
      },
      onPanResponderRelease: (_, g) => {
        closingByGesture.current = true;
        onClose();
        const velocity = Math.min(-0.5, (g.vx * 1000) / panelWidth);
        Animated.spring(progress, {
          toValue: 0,
          velocity,
          tension: 80,
          friction: 15,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setMounted(false);
        });
      },
      onPanResponderTerminate: () => {
        onClose();
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      if (closingByGesture.current) {
        closingByGesture.current = false;
        const hideTimer = setTimeout(() => setMounted(false), 500);
        return () => clearTimeout(hideTimer);
      }
      Animated.timing(progress, {
        toValue: 0,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
      const hideTimer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(hideTimer);
    }
  }, [visible, progress]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }} {...closePan.panHandlers}>
        <Animated.View
          pointerEvents="none"
          style={[styles.scrim, { opacity: progress }]}
        />

        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          pointerEvents={visible ? "auto" : "none"}
          style={[
            styles.drawerPanel,
            {
              width: panelWidth,
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 6,
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-panelWidth - 24, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.drawerHead}>
            <View style={styles.brandMini}>
              <Mark size={32} />
            </View>
            <Text style={styles.drawerBrand}>Open Duet</Text>
          </View>

          <ScrollView
            style={styles.drawerBody}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            bounces
          >
            <Text style={styles.drawerTitle}>Chats</Text>

            <DrawerRow
              icon="check"
              tint="#EAF1E7"
              color={C.green}
              title="Morning brief"
              sub="Today · 5 things"
              onPress={() => onChat("brief")}
              active={currentConv === "brief"}
            />
            <DrawerRow
              emoji="✋"
              tint="#F8E9C9"
              title="Chicago location opening"
              sub="1 needs you today"
              onPress={() => onChat("chicago")}
              active={currentConv === "chicago"}
            />
            <DrawerRow
              icon="code"
              tint="#EEAAF9"
              color="#6C5AA8"
              title="GitHub setup"
              sub="Connected · 12 repos"
              onPress={() => onChat("github")}
              active={currentConv === "github"}
            />
          </ScrollView>

          <View style={styles.drawerFoot}>
            <View style={styles.drawerAvatar}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: C.ink }}>AF</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.drawerName}>Alex Fournier</Text>
              <Text style={styles.drawerPlan}>Personal · Duet Pro</Text>
            </View>
            <Pressable onPress={() => { onClose(); onToast("Settings simulated"); }} hitSlop={8}>
              <Feather name="settings" size={20} color="#4E4E48" />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DrawerRow({ icon, emoji, tint, color, title, sub, onPress, active }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.drawerRow, (pressed || active) && { backgroundColor: "#F3F2EE" }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: tint }]}>
        {emoji ? <Text style={{ fontSize: 13 }}>{emoji}</Text> : <Feather name={icon} size={15} color={color} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>
      </View>
    </Pressable>
  );
}

/* ---------------------------------------------------------------- detail */

function TaskDetailModal({ task, onClose, onUpdate, onToggleDone, onOpenArtifact, toast }) {
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSending(false);
  }, [task?.id]);

  if (!task) return null;
  const status = STATUS[task.status] || STATUS.review;
  const notes = NOTES[task.id] || {
    summary: "This is ready for you. I kept the context from the channel in one place.",
    items: ["Read the short version.", "Approve the next step.", "I’ll handle the follow-up."],
  };
  const sent = task.status === "sent";

  const sendEmail = () => {
    if (sending || sent) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onUpdate(task.id, { status: "sent", meta: "Maya, Harbor · just now" });
    }, 850);
  };

  return (
    <Modal visible={!!task} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalPage} edges={["top", "bottom"]}>
        <View style={styles.detailHead}>
          <RoundBtn icon="chevron-left" onPress={onClose} label="Back" />
          <View style={styles.detailPill}>
            <Text style={styles.detailPillTitle} numberOfLines={1}>{task.title}</Text>
            <Text style={[styles.detailPillStatus, { color: status.color }]}>
              {task.status === "upcoming" ? "Scheduled" : status.label}
            </Text>
          </View>
          <RoundBtn
            icon="more-horizontal"
            onPress={() => Alert.alert("Task options", "More actions are simulated in this prototype.")}
            label="More"
          />
        </View>

        <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          {task.detail === "email" ? (
            <>
              <View style={styles.detailThread}>
                <View style={{ alignSelf: "flex-end", maxWidth: "84%" }}>
                  <Bubble me text="Send the deck to Maya at Harbor." />
                </View>
                <Bubble text="Drafted with the data room link. Send from you?" />
              </View>

              <View style={styles.mailCard}>
                <View style={styles.mailHead}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={styles.mailIcon}>
                      <Feather name="mail" size={14} color="#595952" />
                    </View>
                    <Text style={styles.mailKind}>Email</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    <Pressable
                      hitSlop={8}
                      onPress={() => Alert.alert("Email copied", "The draft is on your clipboard (simulated).")}
                    >
                      <Feather name="copy" size={15} color="#73736B" />
                    </Pressable>
                    <Pressable
                      hitSlop={8}
                      onPress={() => Alert.alert("Edit draft", "Editing is simulated in this prototype.")}
                    >
                      <Feather name="edit-2" size={15} color="#73736B" />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.mailFields}>
                  <View style={styles.mailField}>
                    <Text style={styles.mailFieldLabel}>To</Text>
                    <Text style={styles.mailFieldValue}>Maya, Harbor Ventures</Text>
                  </View>
                  <View style={[styles.mailField, { borderBottomWidth: 0 }]}>
                    <Text style={styles.mailFieldLabel}>Subject</Text>
                    <Text style={styles.mailFieldValue}>Deck and data room</Text>
                  </View>
                </View>
                <View style={styles.mailBody}>
                  <Text style={styles.mailBodyText}>
                    Hi Maya,{"\n\n"}Here is our deck for Thursday, with the link to the data room.
                    {"\n\n"}Let me know if anything needs a tweak before then.{"\n\n"}Best,{"\n"}Alex
                  </Text>
                </View>
                {!sent ? (
                  <View style={styles.mailActions}>
                    <Cta label={sending ? "Sending…" : "Send email"} onPress={sendEmail} />
                    <Cta
                      label="Edit draft"
                      variant="ghost"
                      style={{ marginTop: 7 }}
                      onPress={() => Alert.alert("Edit draft", "Editing is simulated in this prototype.")}
                    />
                  </View>
                ) : (
                  <View style={styles.mailSuccess}>
                    <Feather name="check" size={15} color="#35662F" />
                    <Text style={styles.mailSuccessText}>Sent to Maya · just now</Text>
                  </View>
                )}
              </View>
              <Text style={styles.mailHint}>Drafted by Open Duet · review before sending</Text>
            </>
          ) : null}

          {task.detail === "permit" ? (
            <>
              <View style={styles.detailThread}>
                <Bubble text="The county form is filled. Only the $640 fee needs your OK — after that the permit is on its way." />
              </View>
              <ApprovalCard
                initialApproved={task.done}
                onApproved={() => {
                  onToggleDone(task.id);
                }}
              />
              <Text style={styles.mailHint}>Approving releases the fee today · Chicago opens Nov 14</Text>
            </>
          ) : null}

          {task.detail === "deck" ? (
            <>
              <View style={styles.detailThread}>
                <Bubble text="The deck is rebuilt with Q3. Two slides need your eye — the pricing slide and the appendix." />
              </View>
              <View style={styles.deckCard}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={[styles.miniSlide, i === 0 && styles.miniSlideAccent]}>
                      <View style={[styles.slideLine, { width: "64%", height: 5 }]} />
                      <View style={styles.slideLine} />
                      <View style={[styles.slideLine, { width: "72%" }]} />
                    </View>
                  ))}
                </View>
                <View style={styles.deckMeta}>
                  <View>
                    <Text style={styles.deckTitle}>Series A deck</Text>
                    <Text style={styles.deckSub}>12 slides · rebuilt today</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: C.green, fontWeight: "500" }}>$3.1M</Text>
                </View>
                <Cta
                  label="Open deck"
                  style={{ marginTop: 10, height: 40 }}
                  onPress={() => {
                    onClose();
                    setTimeout(() => onOpenArtifact("deck"), 300);
                  }}
                />
              </View>
            </>
          ) : null}

          {task.detail !== "email" && task.detail !== "permit" && task.detail !== "deck" ? (
            <>
              <View style={styles.detailThread}>
                <Bubble text={notes.summary} />
              </View>
              <View style={styles.noteCard}>
                <View style={styles.noteHead}>
                  <Feather name="check-circle" size={15} color={C.accentDeep} />
                  <Text style={styles.noteHeadText}>What Open Duet found</Text>
                </View>
                {notes.items.map((item) => (
                  <View key={item} style={styles.noteItem}>
                    <View style={styles.tick}>
                      <Feather name="check" size={9} color={C.green} />
                    </View>
                    <Text style={styles.noteItemText}>{item}</Text>
                  </View>
                ))}
              </View>
              <Cta
                label="Mark complete"
                style={{ marginTop: 14, height: 42 }}
                onPress={() => {
                  onToggleDone(task.id);
                  onClose();
                  toast("Task completed");
                }}
              />
            </>
          ) : null}

          <Pressable
            onPress={() => {
              onClose();
              setTimeout(() => toast("Ask Open Duet anything about this task"), 300);
            }}
            style={styles.askClaude}
          >
            <Text style={styles.askClaudeText}>Ask Open Duet about this</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* -------------------------------------------------------------- artifact */

function ArtifactModal({ artifact, onClose, onSendToChat }) {
  if (!artifact) return null;
  const share = () => {
    Share.share({ message: `${artifact.title} — prepared with Open Duet` }).catch(() => {});
  };

  return (
    <Modal visible={!!artifact} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalPage} edges={["top", "bottom"]}>
        <View style={styles.artifactHead}>
          <RoundBtn icon="x" onPress={onClose} label="Close" />
          <Text style={styles.artifactHeadLabel}>Artifact</Text>
          <RoundBtn icon="share" onPress={share} label="Share" />
        </View>
        <ScrollView contentContainerStyle={styles.artifactContent} showsVerticalScrollIndicator={false}>
          <View style={styles.paper}>
            <Text style={styles.paperEyebrow}>{artifact.eyebrow}</Text>
            <Text style={styles.paperTitle}>{artifact.title}</Text>
            <Text style={styles.paperMeta}>
              {artifact.date} {artifact.read ? `·  ${artifact.read}` : ""}
            </Text>
            <View style={styles.paperRule} />
            <ArtifactBody artifact={artifact} />
            <View style={styles.paperFoot}>
              <Text style={styles.paperFootText}>Prepared by Open Duet</Text>
              <Text style={styles.paperFootText}>{artifact.read || "Draft"}</Text>
            </View>
          </View>
          <Cta
            label="Send to chat"
            onPress={() => {
              onSendToChat(artifact);
              onClose();
            }}
            style={{ marginTop: 14, height: 44 }}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ArtifactBody({ artifact: a }) {

  if (a.view === "q3") {
    return (
      <>
        <Text style={styles.paperLead}>
          Net revenue landed 8.4% above plan, carried by Enterprise renewals. Gross margin held at 81% for a third consecutive quarter.
        </Text>
        <View style={styles.chart}>
          {[
            { label: "Q1", value: "$2.1M", h: 48 },
            { label: "Q2", value: "$2.6M", h: 68 },
            { label: "Q3", value: "$3.1M", h: 88, now: true },
          ].map((bar) => (
            <View key={bar.label} style={styles.chartCol}>
              <Text style={styles.chartValue}>{bar.value}</Text>
              <View style={[styles.chartBar, { height: bar.h, backgroundColor: bar.now ? C.accent : "#E7E1DA" }]} />
              <Text style={styles.chartLabel}>{bar.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.paperSubRow}>
          <Text style={styles.paperSubLabel}>Booked revenue</Text>
          <Text style={styles.paperSubLabel}>Source · Q3 close</Text>
        </View>
        <Text style={styles.paperSubhead}>What moved</Text>
        <Text style={styles.paperBody}>
          Enterprise renewals added $410K against plan. The mid-market held flat, and self-serve grew 6% on the new pricing page.
          {"\n\n"}Two invoices slipped into Q4, which flatters the headline by roughly 3 points. Excluding them, growth is 5.4%.
        </Text>
        <Callout>
          <Text style={{ fontWeight: "600", color: "#4D382C" }}>Watch: </Text>
          Northfield’s Net 60 ask would push Q4 collections by 11 days. Worth a conversation before Thursday.
        </Callout>
      </>
    );
  }

  if (a.view === "daily") {
    return (
      <>
        <Text style={styles.paperLead}>Wednesday, 21 October. Two meetings, one decision, and a quiet afternoon.</Text>
        <Text style={styles.paperSubhead}>Today</Text>
        <PaperRow title="Partner sync" sub="9:00 · Bring the Q3 slide and the pricing question" done />
        <PaperRow title="Chicago permit" sub="11:30 · One tap. $640." />
        <PaperRow title="Deep work" sub="14:00 · No meetings. Deck edits." />
        <PaperRow title="Review" sub="17:30 · Q3 variance and tomorrow’s brief" />
        <Callout>
          <Text style={{ fontWeight: "600", color: "#4D382C" }}>One clear first move: </Text>
          approve the $640 health permit. Everything else can wait until the partner sync.
        </Callout>
      </>
    );
  }

  if (a.view === "brief") {
    return (
      <>
        <Text style={styles.paperLead}>Five things that need you before Thursday. The rest can wait.</Text>
        <PaperRow title="Hiring" sub="Jenn’s other offer expires at 6 p.m. All 3 finalists are booked today." done />
        <PaperRow title="Northfield" sub="They redlined the $410K renewal and want Net 60." />
        <PaperRow title="Chicago location" sub="Opens Nov 14. The health permit needs your OK and $640." />
        <PaperRow title="Series A" sub="Harbor meets Thursday at 10. 2 slides need your eye." />
        <PaperRow title="Customers" sub="27 wrong delivery orders this weekend. Refunds are drafted." />
        <Callout>
          <Text style={{ fontWeight: "600", color: "#4D382C" }}>Your first move: </Text>
          the permit. It’s the only item with a clock on it.
        </Callout>
      </>
    );
  }

  if (a.view === "email") {
    return (
      <>
        <Text style={styles.paperLead}>27 new since yesterday. Three need you, four are FYI, the rest are already filed.</Text>
        <Text style={styles.paperSubhead}>Needs a reply</Text>
        <MailRow title="Tomas — Harbor contract redline" sub="Net 60 is the only change. Two clauses flagged." time="8:12" />
        <MailRow title="Jenn — finalist offer" sub="Her other offer expires at 6 p.m. today." time="7:48" />
        <MailRow title="Maya — deck feedback" sub="Two notes. Both are already in the deck." time="7:20" />
        <Text style={styles.paperSubhead}>FYI</Text>
        <MailRow title="Northfield — renewal summary" sub="No action. I filed it with Contracts." time="Yest." muted />
        <MailRow title="Harbor — Thursday logistics" sub="10 a.m., their office. Calendar updated." time="Yest." muted />
        <Callout>
          <Text style={{ fontWeight: "600", color: "#4D382C" }}>Open Duet drafted: </Text>
          a reply to Tomas and a nudge for Jenn. Both are in Tasks, waiting for you.
        </Callout>
      </>
    );
  }

  if (a.view === "tokyo") {
    return (
      <>
        <Text style={styles.paperLead}>Nov 12–19. Flights held, three hotels shortlisted, office visit confirmed for Friday.</Text>
        <Text style={styles.paperSubhead}>Itinerary</Text>
        <MailRow title="Flight · AF 276" sub="Wed 12 Nov · CDG → HND · 11:20" time="Held" />
        <MailRow title="Hotel · The Trunk" sub="4 min walk to the office · 6 nights" time="Option" />
        <MailRow title="Office visit" sub="Fri 14 Nov · 10:00 · Harbor Tokyo" time="Set" muted />
        <MailRow title="Dinner" sub="Sat 15 Nov · 19:30 · 4 people" time="Draft" muted />
        <Callout>
          <Text style={{ fontWeight: "600", color: "#4D382C" }}>One decision: </Text>
          confirm The Trunk by Friday and the whole trip is locked.
        </Callout>
      </>
    );
  }

  if (a.view === "deck") {
    return (
      <>
        <Text style={styles.paperLead}>Twelve slides, rebuilt around Q3. The story is tighter: traction, margin, then the raise.</Text>
        <View style={styles.bigSlide}>
          <View style={styles.bigSlideDot} />
          <Text style={styles.bigSlideTitle}>Series A{"\n"}Q3 2026</Text>
          <Text style={styles.bigSlideFoot}>HARBOR VENTURES · THURSDAY 10:00</Text>
        </View>
        <Text style={styles.paperSubhead}>What changed</Text>
        <Text style={styles.paperBody}>
          Slide 4 now opens with the 8.4% variance. The pricing slide moved after the renewal story. The appendix is three slides shorter.
          {"\n\n"}Two slides still need your eye: pricing and Net 60. Everything else is ready to present.
        </Text>
        <Callout>
          <Text style={{ fontWeight: "600", color: "#4D382C" }}>Before Thursday: </Text>
          the Net 60 question. If Harbor asks, the answer is already drafted in Tasks.
        </Callout>
      </>
    );
  }

  return (
    <>
      <Text style={styles.paperLead}>A first draft, built from your prompt.</Text>
      <Text style={styles.paperBody}>
        This draft keeps the shape of your prompt and fills in the context from your workspace: the Q3 numbers, the Chicago timeline, and the Harbor meeting on Thursday.
        {"\n\n"}The next pass can add sources, a one-page summary, or a version tailored for the board. Open it in chat to keep going.
      </Text>
      <Callout>
        <Text style={{ fontWeight: "600", color: "#4D382C" }}>Prompt: </Text>
        {a.prompt || "Untitled draft"}
      </Callout>
    </>
  );
}

function PaperRow({ title, sub, done }) {
  return (
    <View style={styles.paperRow}>
      <View style={[styles.paperTick, done && { backgroundColor: C.greenSoft, borderColor: "#CFE0CA" }]}>
        <Feather name="check" size={9} color={C.green} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.paperRowTitle}>{title}</Text>
        <Text style={styles.paperRowSub}>{sub}</Text>
      </View>
    </View>
  );
}

function MailRow({ title, sub, time, muted }) {
  return (
    <View style={styles.paperRow}>
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: muted ? "#B9B9B1" : C.accent,
          marginTop: 4,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.paperRowTitle}>{title}</Text>
        <Text style={styles.paperRowSub}>{sub}</Text>
      </View>
      <Text style={styles.paperRowTime}>{time}</Text>
    </View>
  );
}

function Callout({ children }) {
  return (
    <View style={styles.callout}>
      <Text style={styles.calloutText}>{children}</Text>
    </View>
  );
}

/* --------------------------------------------------------------- voice */

function VoiceModal({ visible, onClose, onFinish }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] });

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <LinearGradient
        colors={["#FBF5EF", "#F4F2ED", "#FBF9F6"]}
        locations={[0, 0.55, 1]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <RoundBtn
              icon="x"
              onPress={onClose}
              style={{ position: "absolute", top: 10, right: 20, backgroundColor: "rgba(253,252,250,0.72)" }}
              label="Close"
            />
            <Animated.View
              style={{
                position: "absolute",
                width: 270,
                height: 270,
                borderRadius: 135,
                borderWidth: 1,
                borderColor: "rgba(217,119,87,0.2)",
                transform: [{ scale: haloScale }],
                opacity: haloOpacity,
              }}
            />
            <Animated.View style={{ transform: [{ scale }] }}>
              <Mark size={240} />
            </Animated.View>
            <Text style={styles.voiceLabel}>Listening…</Text>
            <Text style={styles.voiceHint}>Speak naturally. I’ll take it from here.</Text>
          </View>

          <View style={{ alignItems: "center", paddingBottom: 22 }}>
            <Pressable
              onPress={onFinish}
              style={({ pressed }) => [styles.voiceFinish, pressed && { opacity: 0.8 }]}
            >
              <WaveIcon size={15} color={C.accentDeep} />
              <Text style={styles.voiceFinishText}>Finish</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

/* ------------------------------------------------------------- new task */

function NewTaskModal({ visible, onClose, onCreate }) {
  const [value, setValue] = useState("");
  const suggestions = ["Book the Tokyo hotel", "Send the deck to Maya"];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "flex-end" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={styles.sheetPanel}>
          <View style={styles.sheetGrab} />
          <Text style={styles.sheetTitle}>New task</Text>
          <Text style={styles.sheetSub}>Tell Open Duet what needs to happen. It lands in Tasks.</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="What needs doing?"
            placeholderTextColor={C.faint}
            style={styles.sheetInput}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (value.trim()) {
                onCreate(value.trim());
                setValue("");
              }
            }}
          />
          <View style={{ flexDirection: "row", gap: 6, marginTop: 9, marginBottom: 15 }}>
            {suggestions.map((s) => (
              <Pressable key={s} onPress={() => setValue(s)} style={styles.suggest}>
                <Text style={styles.suggestText}>{s}</Text>
              </Pressable>
            ))}
          </View>
          <Cta
            label="Create task"
            onPress={() => {
              if (!value.trim()) return;
              onCreate(value.trim());
              setValue("");
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ------------------------------------------------------------------- app */

export default function App() {
  const [tab, setTab] = useState("chat");
  const railTouchRef = useRef(0);
  const [conv, setConv] = useState("chicago");
  const [drawer, setDrawer] = useState(false);
  const [voice, setVoice] = useState(false);
  const [newTask, setNewTask] = useState(false);
  const [tasks, setTasks] = useState(TASKS);
  const [channel, setChannel] = useState("null-district");
  const [detailTask, setDetailTask] = useState(null);
  const [artifact, setArtifact] = useState(null);
  const [artifacts, setArtifacts] = useState(ARTIFACTS);
  const [railOrder, setRailOrder] = useState(["daily", "brief", "tokyo"]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (message) => {
    if (!message) return;
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const updateTask = (id, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const toggleTask = (id) => {
    let done = false;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        done = !t.done;
        return { ...t, done: !t.done };
      })
    );
    setTimeout(() => showToast(done ? "Task completed" : "Task reopened"), 60);
  };

  const addTask = (title) => {
    const id = `custom-${Date.now()}`;
    setTasks((prev) => [
      {
        id,
        title,
        status: "review",
        group: "active",
        meta: "Added just now",
        detail: "note",
        done: false,
      },
      ...prev,
    ]);
    setNewTask(false);
    setTab("tasks");
    showToast("Task created");
  };

  const selectChat = (next) => {
    setDrawer(false);
    setConv(next);
    setTab("chat");
  };

  const selectChannel = (id) => {
    setChannel(id);
    setDrawer(false);
    setTab("tasks");
    showToast(`#${id}`);
  };

  const addArtifact = (id, item) => {
    setArtifacts((prev) => ({ ...prev, [id]: item }));
    setRailOrder((prev) => [...prev, id]);
  };

  const addToRail = (id) => {
    setRailOrder((prev) => (prev.includes(id) ? prev : [id, ...prev]));
  };

  const createMakeDraft = (option) => {
    const id = `gen-${Date.now()}`;
    const title = option.sample || `Untitled ${option.label}`;
    const item = {
      id,
      eyebrow: `${option.label} · Draft`,
      title,
      date: "Just now",
      read: "Draft",
      cardEyebrow: `${option.label} · Draft`,
      cardTitle: title,
      cardBody: option.sample
        ? `A new ${option.label.toLowerCase()}, started from the Make menu.`
        : `A new ${option.label.toLowerCase()}, just started.`,
      cardDate: "Just now",
      view: "generated",
      prompt: option.sample || `A new ${option.label.toLowerCase()}.`,
    };
    addArtifact(id, item);
    showToast(`${option.label} started`);
    setTimeout(() => setArtifact(item), 220);
  };

  const openTask = (task) => setDetailTask(task);

  const edgePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Date.now() - railTouchRef.current > 500 &&
        g.x0 < 16 &&
        g.dx > 10 &&
        Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderGrant: () => setDrawer(true),
    })
  ).current;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={C.app} />
      <View style={styles.appShell} {...edgePan.panHandlers}>
        <View style={styles.appContent}>
          <SafeAreaView style={styles.root} edges={["top", "left", "right", "bottom"]}>
          <View style={{ flex: 1 }}>
            <TopBar onMenu={() => setDrawer(true)} onVoice={() => setVoice(true)} />

            <View style={{ flex: 1, zIndex: 0 }}>
              <ChatScreen
                visible={tab === "chat"}
                conv={conv}
                onMenu={() => setDrawer(true)}
                onVoice={() => setVoice(true)}
                toast={showToast}
              />
              <TasksScreen
                visible={tab === "tasks"}
                tasks={tasks}
                onToggle={toggleTask}
                onOpen={openTask}
                onNewTask={() => setNewTask(true)}
                toast={showToast}
              />
              <MakeScreen
                visible={tab === "make"}
                artifacts={artifacts}
                railOrder={railOrder}
                onOpenArtifact={(payload) => {
                  if (!payload) return;
                  if (typeof payload === "string") {
                    setArtifact(artifacts[payload] || ARTIFACTS[payload]);
                  } else {
                    setArtifact(payload);
                  }
                }}
                onCreateDraft={createMakeDraft}
                railTouchRef={railTouchRef}
              />
            </View>

            <TabBar active={tab} onChange={setTab} />
          </View>

          <Toast message={toast} />
          </SafeAreaView>
        </View>

      </View>

      <Drawer
        visible={drawer}
        onClose={() => setDrawer(false)}
        onChat={selectChat}
        onToast={showToast}
        currentConv={conv}
      />

      <TaskDetailModal
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onUpdate={updateTask}
        onToggleDone={(id) => updateTask(id, { done: true })}
        onOpenArtifact={(id) => setArtifact(artifacts[id] || ARTIFACTS[id])}
        toast={showToast}
      />

      <ArtifactModal
        artifact={artifact}
        onClose={() => setArtifact(null)}
        onSendToChat={(a) => showToast(`Added “${a.title}” to this chat`)}
      />

      <VoiceModal
        visible={voice}
        onClose={() => setVoice(false)}
        onFinish={() => {
          setVoice(false);
          setTab("chat");
          setConv("brief");
          showToast("Voice note transcribed");
        }}
      />

      <NewTaskModal visible={newTask} onClose={() => setNewTask(false)} onCreate={addTask} />
    </SafeAreaProvider>
  );
}

/* ----------------------------------------------------------------- styles */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.app },
  appShell: { flex: 1, backgroundColor: C.app },
  appContent: { flex: 1 },
  screen: { flex: 1 },
  hidden: { display: "none" },

  topbarOuter: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6, position: "relative", zIndex: 20 },
  topbarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  orb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FCFCFA",
    borderWidth: 1,
    borderColor: "#EAE8E3",
    alignItems: "center",
    justifyContent: "center",
    ...shadowSoft,
  },
  brandOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FDFDFC",
    borderWidth: 1,
    borderColor: "#EBE9E4",
    alignItems: "center",
    justifyContent: "center",
    ...shadowSoft,
  },
  avatarText: { fontSize: 11.5, fontWeight: "600", color: "#161613" },

  chatContent: { paddingHorizontal: 20, paddingTop: 112, paddingBottom: 18 },
  screenUnderHeader: { marginTop: -78 },
  topBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 112,
    zIndex: 15,
  },
  ctx: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" },
  ctxIcon: {
    width: 21,
    height: 21,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  ctxLabel: { fontSize: 13.5, color: "#7C7C74", letterSpacing: -0.1 },
  messages: { marginTop: 18, gap: 9 },
  bubble: {
    backgroundColor: C.bubble,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 13,
    maxWidth: 305,
  },
  bubbleMe: {
    backgroundColor: C.peach,
    borderBottomRightRadius: 8,
  },
  bubbleText: { fontSize: 15, lineHeight: 21, color: "#171714", letterSpacing: -0.2 },
  seen: { fontSize: 9, color: C.faint, marginTop: 4, marginRight: 5 },
  inlineLink: { color: C.accentDeep, textDecorationLine: "underline" },
  typing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.bubble,
    borderRadius: 999,
    height: 34,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  typingDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#8B8B83", opacity: 0.5 },

  brief: { backgroundColor: C.bubble, borderRadius: 22, padding: 15, width: "100%", maxWidth: 322 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bulletDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#1A1A16", marginTop: 8 },
  briefText: { flex: 1, fontSize: 14.8, lineHeight: 21.5, color: "#191916", letterSpacing: -0.2 },
  briefPill: { fontSize: 13.3, fontWeight: "500", borderRadius: 5, overflow: "hidden" },

  approval: {
    marginTop: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 17,
    padding: 16,
    ...shadowSoft,
  },
  approvalApproved: { backgroundColor: "#FBFDF9", borderColor: "#DFE9DA" },
  approvalHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  approvalAmount: { fontSize: 22, fontWeight: "700", letterSpacing: -0.7, color: "#151512" },
  approvalExpiry: { fontSize: 11.5, color: "#8A8A82" },
  approvalMerchant: {
    fontSize: 13,
    color: "#6F6F67",
    marginTop: 3,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#DBDAD5",
  },
  approvalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  approvalRowText: { fontSize: 13.5, color: "#191916" },
  approvalState: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 66 },
  doneBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  doneTitle: { fontSize: 12.5, fontWeight: "600", color: "#1C1C18" },
  doneSub: { fontSize: 10.5, color: "#7A7A72", marginTop: 2 },
  textLink: { fontSize: 11, color: C.accentDeep, textDecorationLine: "underline" },

  cta: {
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  ctaSmall: { height: 34, paddingHorizontal: 14, alignSelf: "flex-start" },
  ctaDark: { backgroundColor: "#0D0D0C" },
  ctaGhost: { borderWidth: 1.1, borderColor: "#3B3B36", backgroundColor: "transparent" },
  ctaText: { fontSize: 14, fontWeight: "600", color: "#FBFBF7", letterSpacing: -0.2 },

  composerWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  composer: {
    height: 48,
    borderRadius: 999,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: "#E8E6E1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 7,
    ...shadowSoft,
  },
  composerIcon: { width: 26, alignItems: "center", justifyContent: "center" },
  composerInput: { flex: 1, fontSize: 14, color: C.ink, paddingVertical: 0 },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0D0D0C",
    alignItems: "center",
    justifyContent: "center",
  },

  tabbarOuter: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 6, backgroundColor: C.app },
  tabbar: {
    height: 56,
    borderRadius: 999,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: "#E7E5E0",
    flexDirection: "row",
    padding: 4,
    gap: 2,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
    ...shadowSoft,
  },
  tab: {
    flex: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabActive: { backgroundColor: "#EFEFEC" },
  tabLabel: { fontSize: 10.5, fontWeight: "500", color: "#66665F" },
  tabLabelActive: { color: "#161613", fontWeight: "600" },

  tasksTop: { paddingTop: 0 },
  groupPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: "#E8E6E1",
  },
  groupPillText: { fontSize: 11, fontWeight: "500", color: "#3E3E37" },
  tasksHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    marginTop: 0,
  },
  tabTitle: { fontSize: 21, fontWeight: "500", letterSpacing: -0.7, color: "#8B8B83" },
  tabTitleActive: { color: "#141411", fontWeight: "700" },
  tabUnderline: {
    position: "absolute",
    left: -2,
    right: -2,
    bottom: -2,
    height: 9,
    borderRadius: 2,
    backgroundColor: "#EBEBE8",
    zIndex: -1,
  },
  tools: { flexDirection: "row", alignItems: "center", gap: 18 },
  taskSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 38,
    marginHorizontal: 0,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: "#E6E4DF",
  },
  taskSearchInput: { flex: 1, fontSize: 12, color: C.ink },
  listMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    marginTop: 17,
  },
  listMetaText: { fontSize: 11, color: "#8A8A82" },
  taskScroll: { paddingHorizontal: 20, paddingTop: 112 },
  groupHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingTop: 15,
    paddingBottom: 3,
  },
  groupHeadLabel: { fontSize: 11.5, fontWeight: "500", color: "#86867E" },
  groupHeadCount: { fontSize: 10, color: "#A7A79F" },
  groupHeadSide: { fontSize: 10, color: "#A7A79F" },
  taskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 4,
    marginHorizontal: -4,
    borderRadius: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: "#DCDBD6",
    backgroundColor: "#FCFCFA",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  taskTitle: { fontSize: 15.2, fontWeight: "600", color: "#181816", letterSpacing: -0.35, lineHeight: 20 },
  taskSub: { fontSize: 11.3, color: "#6E6E66", marginTop: 4, lineHeight: 15 },
  taskWhen: { width: 58, fontSize: 10.5, color: "#8C8C84", paddingTop: 3 },
  emptyText: { fontSize: 11.5, color: C.muted, textAlign: "center", paddingVertical: 34 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 16,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#BB6749",
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },

  makeContent: { paddingHorizontal: 18, paddingTop: 112, paddingBottom: 8 },
  makeHero: {
    height: 244,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#EAE2D7",
    padding: 12,
    overflow: "hidden",
    ...shadowSoft,
  },
  heroX: { position: "absolute", top: 12, right: 14, zIndex: 3, padding: 4 },
  heroPreview: {
    position: "absolute",
    top: 16,
    left: "50%",
    marginLeft: -98,
    width: 196,
    height: 148,
    borderRadius: 13,
    backgroundColor: "#FDFCFA",
    borderWidth: 1,
    borderColor: "#EAE7E1",
    padding: 14,
    ...shadowSoft,
  },
  heroPreviewTitle: { width: "60%", height: 7, borderRadius: 4, backgroundColor: "#26241F" },
  heroPreviewLine: { height: 3, borderRadius: 2, backgroundColor: "#E4DFD7", marginTop: 5 },
  heroPill: { width: 62, height: 17, borderRadius: 9, backgroundColor: C.accent, marginTop: 13 },
  heroBlock: { height: 39, borderRadius: 7, backgroundColor: "#D97757", marginTop: 10, opacity: 0.92 },
  heroBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAE6DF",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 4,
  },
  heroKind: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 32,
    borderRadius: 16,
    paddingLeft: 4,
    paddingRight: 9,
    backgroundColor: "#F9E9DF",
  },
  heroKindIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F2D7C7",
    alignItems: "center",
    justifyContent: "center",
  },
  heroKindText: { fontSize: 11.5, fontWeight: "600", color: C.accentDeep },
  heroPrompt: { flex: 1, fontSize: 11, color: "#38352F", letterSpacing: -0.1 },
  heroArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F9E9DF",
    alignItems: "center",
    justifyContent: "center",
  },
  makeSectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: C.ink,
    letterSpacing: -0.6,
    marginTop: 26,
    marginBottom: 11,
  },
  makeRail: { gap: 10, paddingRight: 18 },
  makeCard: {
    width: 202,
    height: 186,
    borderRadius: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    padding: 13,
    ...shadowSoft,
  },
  makeCardTitle: { fontSize: 15.5, fontWeight: "600", color: C.ink, lineHeight: 19, letterSpacing: -0.3 },
  makeCardMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 7 },
  makeCardIcon: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  makeCardTime: { fontSize: 9.5, color: C.muted },
  makeCardPreview: {
    height: 68,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ECE8E1",
    backgroundColor: "#F7F4EE",
    overflow: "hidden",
  },
  paperMini: { flex: 1, padding: 8 },
  paperMiniEyebrow: { fontSize: 3.5, letterSpacing: 0.5, textTransform: "uppercase", color: "#9A9A92" },
  paperMiniTitle: { fontFamily: SERIF, fontSize: 10.5, color: "#1A1A17", marginTop: 2, marginBottom: 3 },
  paperMiniLine: { height: 2, borderRadius: 1, backgroundColor: "#DEDAD2", marginTop: 2 },
  designMini: { flex: 1, padding: 7 },
  designMiniHead: { flexDirection: "row", gap: 3 },
  designMiniBody: { flexDirection: "row", gap: 7, marginTop: 8, alignItems: "flex-start" },
  designMiniBlock: { width: 48, height: 34, borderRadius: 6, backgroundColor: C.accent, opacity: 0.85 },
  designMiniLine: { height: 3, borderRadius: 2, backgroundColor: "#DEDAD2" },
  makeScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24,22,17,0.34)",
    zIndex: 30,
  },
  plusMenu: {
    position: "absolute",
    right: 20,
    bottom: 86,
    alignItems: "flex-end",
    zIndex: 32,
  },
  plusMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    height: 42,
    paddingLeft: 5,
    paddingRight: 15,
    borderRadius: 999,
    backgroundColor: "#FCFCFA",
    borderWidth: 1,
    borderColor: "#EAE7E1",
    ...shadowSoft,
  },
  plusMenuIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  plusMenuLabel: { fontSize: 12.5, fontWeight: "600", color: C.ink, letterSpacing: -0.2 },
  makeFab: {
    position: "absolute",
    right: 20,
    bottom: 16,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#BB6749",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 33,
    ...shadow,
  },
  makeFabOpen: { backgroundColor: "#BB6749" },
  makeMenuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  makeMenuVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12,11,9,0.44)",
  },
  makeMenuList: {
    position: "absolute",
    right: 22,
    alignItems: "flex-end",
    gap: 6,
  },
  makeMenuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 42,
    paddingHorizontal: 4,
    borderRadius: 21,
  },
  makeMenuIconRound: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  makeMenuLabel: {
    fontSize: 15.5,
    fontWeight: "600",
    color: "#F8F6F1",
    letterSpacing: -0.3,
  },
  makeMenuCloseWrap: {
    position: "absolute",
    right: 20,
  },
  makeMenuX: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#1C1B18",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: { zIndex: 20 },
  searchBar: {
    height: 46,
    borderRadius: 999,
    backgroundColor: "#F1F0EC",
    borderWidth: 1,
    borderColor: "#E9E7E2",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontSize: 14.5, color: C.ink },
  searchPop: {
    marginTop: 6,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 5,
    ...shadowSoft,
  },
  searchResult: { flexDirection: "row", alignItems: "center", gap: 9, padding: 8, borderRadius: 11 },
  searchResultIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: C.raise,
    alignItems: "center",
    justifyContent: "center",
  },
  searchResultTitle: { fontSize: 12, fontWeight: "500", color: C.ink },
  searchResultSub: { fontSize: 9.5, color: C.muted, marginTop: 1 },
  searchEmpty: { fontSize: 11, color: C.muted, padding: 14, textAlign: "center" },

  feature: {
    marginTop: 16,
    height: 196,
    borderRadius: 19,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    padding: 10,
    ...shadowSoft,
  },
  featureX: { position: "absolute", top: 12, right: 14, zIndex: 3, padding: 4 },
  preview: {
    position: "absolute",
    top: 16,
    left: "50%",
    marginLeft: -105,
    width: 210,
    height: 124,
    borderRadius: 13,
    backgroundColor: "#FDFDFC",
    borderWidth: 1,
    borderColor: "#EAE9E5",
    padding: 10,
    ...shadowSoft,
  },
  previewTitle: { fontSize: 10, fontWeight: "600", color: "#232320" },
  skelBar: { height: 3, borderRadius: 2, backgroundColor: "#E7E6E1" },
  readTime: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    height: 21,
    borderRadius: 11,
    backgroundColor: "#C96A47",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  readTimeText: { fontSize: 7.5, fontWeight: "600", color: "#fff" },
  askBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    height: 29,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E9E8E4",
    backgroundColor: C.card,
    justifyContent: "center",
    paddingLeft: 12,
  },
  askBarText: { fontSize: 9.5, color: "#787870" },
  sectionHead: { fontSize: 17, fontWeight: "600", color: C.ink, letterSpacing: -0.5, marginTop: 22, marginBottom: 10 },
  startCard: {
    width: 202,
    height: 74,
    borderRadius: 15,
    backgroundColor: C.raise,
    borderWidth: 1,
    borderColor: "#E9E7E2",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
  },
  startIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(217,119,87,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  startTitle: { fontSize: 12.5, fontWeight: "600", color: C.ink, letterSpacing: -0.2 },
  startSub: { fontSize: 10.3, color: "#83837B", marginTop: 3, lineHeight: 13.5 },
  artifactCard: {
    width: 178,
    height: 108,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "#FBFAF6",
    borderWidth: 1,
    borderColor: "#EBE9E3",
    borderBottomWidth: 0,
    padding: 9,
    overflow: "hidden",
    ...shadowSoft,
  },
  artifactEyebrow: {
    fontSize: 4,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#8C8C84",
    fontWeight: "500",
  },
  artifactTitle: { fontFamily: SERIF, fontSize: 15, color: "#1A1A17", marginTop: 2 },
  artifactDate: { fontSize: 6, color: "#2F5F9D", marginTop: 3, fontWeight: "600" },
  artifactBody: { fontSize: 5, lineHeight: 8, color: "#76766E", marginTop: 3 },
  skelLine: { height: 5, borderRadius: 3, backgroundColor: "#EDECE7", marginBottom: 6 },
  chip: {
    height: 33,
    borderRadius: 999,
    backgroundColor: C.raise,
    borderWidth: 1,
    borderColor: "#E7E5E0",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingLeft: 4,
    paddingRight: 12,
  },
  chipSelected: { backgroundColor: "#F8EAE3", borderColor: "#E9CABB" },
  chipIcon: { width: 25, height: 25, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  chipLabel: { fontSize: 11.5, fontWeight: "500", color: "#2E2E29" },

  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(24,22,17,0.3)" },
  drawerPanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: C.card,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: "#E7E5E0",
    overflow: "hidden",
  },
  drawerBody: { flex: 1, minHeight: 0 },
  drawerHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 8, paddingTop: 10, paddingBottom: 14 },
  brandMini: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FDFCF9",
    borderWidth: 1,
    borderColor: "#EBE9E4",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerBrand: { flex: 1, fontSize: 16, fontWeight: "600", letterSpacing: -0.3, color: C.ink },
  drawerTitle: { fontSize: 22, fontWeight: "600", letterSpacing: -0.5, color: C.ink, marginTop: 14, marginBottom: 8, marginLeft: 10 },
  everything: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: C.raise,
    borderWidth: 1,
    borderColor: "#E9E7E2",
  },
  everythingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F8E8DF",
    alignItems: "center",
    justifyContent: "center",
  },
  everythingTitle: { fontSize: 13, fontWeight: "600", color: C.ink },
  everythingSub: { fontSize: 9.8, color: "#7D7D75", marginTop: 2 },
  drawerLabel: { marginTop: 18, marginBottom: 5, paddingHorizontal: 6 },
  drawerLabelText: { fontSize: 9.5, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: "#A0A098" },
  newChannelLink: { fontSize: 9.5, color: C.accentDeep, fontWeight: "500" },
  drawerRow: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 16, marginBottom: 2 },
  rowIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 15.5, fontWeight: "600", letterSpacing: -0.2, color: "#242420" },
  rowSub: { fontSize: 11.5, color: "#85857D", marginTop: 2 },
  drawerFoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#ECEAE5",
  },
  drawerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FCFCFA",
    borderWidth: 1,
    borderColor: "#EAE8E3",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerName: { fontSize: 13, fontWeight: "600", color: C.ink },
  drawerPlan: { fontSize: 10.5, color: "#8E8E86", marginTop: 1 },

  modalPage: { flex: 1, backgroundColor: C.app },
  detailHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
  },
  detailPill: {
    flex: 1,
    minHeight: 42,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  detailPillTitle: { fontSize: 10.5, fontWeight: "600", color: C.ink },
  detailPillStatus: { fontSize: 8.5, fontWeight: "500", marginTop: 1 },
  detailContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 28 },
  detailThread: { gap: 8, marginTop: 6 },
  mailCard: {
    marginTop: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 19,
    overflow: "hidden",
    ...shadowSoft,
  },
  mailHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEDE9",
  },
  mailIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: C.raise,
    borderWidth: 1,
    borderColor: "#E7E5E0",
    alignItems: "center",
    justifyContent: "center",
  },
  mailKind: { fontSize: 12, fontWeight: "600", color: "#232320" },
  mailFields: { paddingHorizontal: 14 },
  mailField: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEDE9",
  },
  mailFieldLabel: { width: 44, fontSize: 10.5, color: "#96968E" },
  mailFieldValue: { fontSize: 11, fontWeight: "500", color: "#33332E", flex: 1 },
  mailBody: { padding: 14 },
  mailBodyText: { fontSize: 12.5, lineHeight: 20, color: "#3F3F39", letterSpacing: -0.1 },
  mailActions: { paddingHorizontal: 14, paddingBottom: 14 },
  mailSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 14,
    marginTop: 0,
    padding: 10,
    borderRadius: 11,
    backgroundColor: C.greenSoft,
  },
  mailSuccessText: { fontSize: 10.5, fontWeight: "500", color: "#35662F" },
  mailHint: { fontSize: 9.5, color: "#999991", textAlign: "center", marginTop: 10 },
  deckCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
  },
  miniSlide: {
    flex: 1,
    aspectRatio: 4 / 3,
    borderRadius: 7,
    backgroundColor: "#F4F2ED",
    borderWidth: 1,
    borderColor: "#E9E6E0",
    padding: 7,
    gap: 3,
  },
  miniSlideAccent: { backgroundColor: "#F8E9E1", borderColor: "#EFD6C8" },
  slideLine: { height: 3, borderRadius: 2, backgroundColor: "#DAD7D0", width: "100%" },
  deckMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  deckTitle: { fontSize: 11, fontWeight: "600", color: C.ink },
  deckSub: { fontSize: 9.5, color: C.muted, marginTop: 1 },
  noteCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
  },
  noteHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 9 },
  noteHeadText: { fontSize: 11, fontWeight: "600", color: "#2C2C27" },
  noteItem: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  tick: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  noteItemText: { flex: 1, fontSize: 10.8, lineHeight: 15.5, color: "#55554E" },
  askClaude: {
    marginTop: 14,
    height: 42,
    borderRadius: 999,
    borderWidth: 1.1,
    borderColor: "#3B3B36",
    alignItems: "center",
    justifyContent: "center",
  },
  askClaudeText: { fontSize: 13, fontWeight: "600", color: C.ink },

  artifactHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
  },
  artifactHeadLabel: { fontSize: 10.5, fontWeight: "500", letterSpacing: 0.2, color: "#8F8F87" },
  artifactContent: { paddingHorizontal: 16, paddingBottom: 20 },
  paper: {
    backgroundColor: "#FDFDFB",
    borderWidth: 1,
    borderColor: "#E9E6E0",
    borderRadius: 22,
    padding: 24,
    ...shadowSoft,
  },
  paperEyebrow: { fontSize: 8.5, fontWeight: "500", letterSpacing: 0.8, textTransform: "uppercase", color: "#9B9B93" },
  paperTitle: { fontFamily: SERIF, fontSize: 33, color: "#1A1A16", marginTop: 5, letterSpacing: -0.7 },
  paperMeta: { fontSize: 9.5, color: "#96968E", marginTop: 7 },
  paperRule: { height: 1, backgroundColor: "#ECE9E3", marginVertical: 16 },
  paperLead: { fontSize: 12.5, lineHeight: 20, color: "#3F3F39" },
  paperBody: { fontSize: 10.5, lineHeight: 18, color: "#6A6A62", marginTop: 10 },
  paperSubhead: { fontSize: 10, fontWeight: "600", color: "#2C2C27", marginTop: 18, marginBottom: 4 },
  paperSubRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  paperSubLabel: { fontSize: 8, color: "#9C9C94" },
  paperFoot: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0EDE8",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paperFootText: { fontSize: 8, color: "#A5A59D" },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    height: 130,
    marginTop: 18,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EBE8E2",
  },
  chartCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 5 },
  chartValue: { fontSize: 8, color: "#76766E" },
  chartBar: { width: "100%", borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  chartLabel: { fontSize: 8, color: "#9C9C94" },
  paperRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EDE8",
  },
  paperTick: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#DEDBD4",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  paperRowTitle: { fontSize: 10.5, fontWeight: "500", color: "#43433D" },
  paperRowSub: { fontSize: 8.5, color: "#9A9A92", marginTop: 2, lineHeight: 12 },
  paperRowTime: { fontSize: 8, color: "#A5A59D", marginTop: 2 },
  callout: {
    marginTop: 16,
    padding: 12,
    borderRadius: 11,
    backgroundColor: "#F7F1EB",
    borderWidth: 1,
    borderColor: "#EEE2D8",
  },
  calloutText: { fontSize: 10, lineHeight: 15.5, color: "#6E5445" },
  bigSlide: {
    marginTop: 16,
    aspectRatio: 16 / 10,
    borderRadius: 12,
    backgroundColor: "#F4F2ED",
    borderWidth: 1,
    borderColor: "#E9E6E0",
    padding: 20,
    justifyContent: "space-between",
  },
  bigSlideDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent },
  bigSlideTitle: { fontFamily: SERIF, fontSize: 26, lineHeight: 28, color: "#23231E" },
  bigSlideFoot: { fontSize: 7, letterSpacing: 1.2, color: "#8F8F86" },

  voiceLabel: { fontSize: 14, fontWeight: "500", color: "#675F58", marginTop: 36 },
  voiceHint: { fontSize: 10.5, color: "#9A928A", marginTop: 7, textAlign: "center", maxWidth: 240 },
  voiceFinish: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: "rgba(253,252,250,0.85)",
    borderWidth: 1,
    borderColor: "#E7E2DB",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    ...shadowSoft,
  },
  voiceFinishText: { fontSize: 12.5, fontWeight: "500", color: "#3A352F" },

  sheetPanel: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 32 : 22,
    ...shadow,
  },
  sheetGrab: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DCDAD4",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 21, fontWeight: "600", color: C.ink, letterSpacing: -0.5 },
  sheetSub: { fontSize: 10.5, color: C.muted, marginTop: 4, marginBottom: 14 },
  sheetInput: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F4F3EF",
    borderWidth: 1,
    borderColor: "#E8E6E1",
    paddingHorizontal: 14,
    fontSize: 13,
    color: C.ink,
  },
  suggest: {
    height: 27,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7E5E0",
    backgroundColor: "#FCFCFA",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  suggestText: { fontSize: 9.5, color: "#6B6B64" },

  toast: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 36,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 18,
    backgroundColor: "#151512",
    zIndex: 999,
    ...shadow,
  },
  toastCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  toastText: { fontSize: 10.5, fontWeight: "500", color: "#FBFBF7", maxWidth: 250 },
});
