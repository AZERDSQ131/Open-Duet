(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const phone = $("#phone");
  const chatScroll = $("#chatScroll");
  const drawer = $("#drawer");
  const detail = $("#detail");
  const artifactEl = $("#artifact");
  const voiceEl = $("#voice");
  const newTaskSheet = $("#newTaskSheet");
  const attachMenu = $("#attachMenu");
  const toastEl = $("#toast");
  const toastText = $("#toastText");

  const CHECK_SVG = '<svg class="icon"><use href="#i-check"/></svg>';
  const DOT_SVG = '<svg class="icon"><use href="#i-dots"/></svg>';

  const state = {
    view: "chat",
    conv: "chicago",
    tasksTab: "active",
    done: new Set(),
    sort: "recent",
    taskQuery: "",
    channel: "null-district",
    makeType: null,
    makeCount: 0,
    detailTask: null,
    currentArtifact: null,
  };

  /* ------------------------------------------------------------------ data */

  const tasks = [
    {
      id: "series-a-meeting",
      title: "Series A meeting",
      status: "input",
      group: "active",
      meta: "Slides for Thursday · 2 need your eye",
      detail: "email",
    },
    {
      id: "chicago-cafe",
      title: "Chicago cafe opening",
      status: "input",
      group: "active",
      meta: "Approve the health permit · $640",
      detail: "permit",
    },
    {
      id: "series-a-deck",
      title: "Series A deck",
      status: "review",
      group: "active",
      meta: "12 slides rebuilt with Q3",
      detail: "deck",
    },
    {
      id: "partner-prep",
      title: "Partner meeting prep",
      status: "review",
      group: "active",
      meta: "A 2-minute read before Thursday",
      detail: "note",
    },
    {
      id: "cover-art",
      title: "Make cover art for the game",
      status: "review",
      group: "active",
      meta: "Which cover should I take forward?",
      detail: "note",
    },
    {
      id: "sum-up",
      title: "Sum up where Null District stands",
      status: "review",
      group: "active",
      meta: "Ready to mark this done?",
      detail: "note",
    },
    {
      id: "tokyo-hotel",
      title: "Pick the Tokyo hotel",
      status: "upcoming",
      group: "upnext",
      when: "Tomorrow",
      meta: "Three options within budget",
      detail: "note",
    },
    {
      id: "q3-pricing",
      title: "Review the Q3 pricing memo",
      status: "upcoming",
      group: "upnext",
      when: "Thu 10:00",
      meta: "Harbor meeting follows at 10",
      detail: "note",
    },
    {
      id: "harbor-contract",
      title: "Sign the Harbor contract",
      status: "upcoming",
      group: "upnext",
      when: "Fri",
      meta: "Waiting on Tomas",
      detail: "note",
    },
  ];

  const taskNotes = {
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
    input: { label: "Needs input", cls: "status--input", dot: "dot--input" },
    review: { label: "Ready for review", cls: "status--review", dot: "dot--review" },
    sent: { label: "Sent", cls: "status--sent", dot: "dot--review" },
    upcoming: { label: "Scheduled", cls: "status--review", dot: "dot--upcoming" },
  };

  const artifacts = {
    q3: {
      cardEyebrow: "Finance · Board prep",
      cardTitle: "Q3 variance",
      cardDate: "Wednesday, 21 Oct 2026",
      cardBody: "Net revenue 8.4% above plan. One collection risk to watch.",
      eyebrow: "Finance · Board prep",
      title: "Q3 variance",
      date: "Wednesday, 21 Oct 2026",
      read: "2 min read",
      view: "q3",
    },
    daily: {
      cardEyebrow: "Day sheet · Pacific time",
      cardTitle: "Daily todo",
      cardDate: "Wednesday, 21 Oct 2026",
      cardBody: "Two meetings, one decision, and a quiet afternoon.",
      eyebrow: "Day sheet · Pacific time",
      title: "Daily todo",
      date: "Wednesday, 21 Oct 2026",
      read: "1 min read",
      view: "daily",
    },
    brief: {
      cardEyebrow: "Morning note",
      cardTitle: "Morning brief",
      cardDate: "Wednesday, 21 Oct 2026",
      cardBody: "Hiring, Northfield, Chicago, Series A, Customers.",
      eyebrow: "Morning note · 7:00 AM",
      title: "Morning brief",
      date: "Wednesday, 21 Oct 2026",
      read: "2 min read",
      view: "brief",
    },
    email: {
      cardEyebrow: "Inbox · Triage",
      cardTitle: "Email triage",
      cardDate: "Wednesday, 21 Oct 2026",
      cardBody: "27 new since yesterday. 3 need you, 4 are FYI.",
      eyebrow: "Inbox · Triage",
      title: "Email triage",
      date: "Wednesday, 21 Oct 2026",
      read: "1 min read",
      view: "email",
    },
    tokyo: {
      cardEyebrow: "Travel · Tokyo",
      cardTitle: "Tokyo trip",
      cardDate: "Nov 12–19, 2026",
      cardBody: "Flights held. Three hotels shortlisted near the office.",
      eyebrow: "Travel · Tokyo",
      title: "Tokyo trip",
      date: "Nov 12–19, 2026",
      read: "2 min read",
      view: "tokyo",
    },
    deck: {
      cardEyebrow: "Series A · Deck",
      cardTitle: "Series A deck",
      cardDate: "Thursday, 22 Oct 2026",
      cardBody: "12 slides rebuilt with Q3. Two slides need your eye.",
      eyebrow: "Series A · Deck",
      title: "Series A deck",
      date: "Thursday, 22 Oct 2026",
      read: "12 slides",
      view: "deck",
    },
  };

  const railOrder = ["daily", "brief", "tokyo"];

  const searchItems = [
    { artifact: "q3", title: "Q3 variance", sub: "Artifact · 2 min read", icon: "chart" },
    { artifact: "brief", title: "Morning brief", sub: "Chat · 5 things today", icon: "clock" },
    { artifact: "daily", title: "Daily todo", sub: "Artifact · Day sheet", icon: "tasks" },
    { artifact: "tokyo", title: "Tokyo trip", sub: "Artifact · Nov 12–19", icon: "globe" },
    { artifact: "deck", title: "Series A deck", sub: "Artifact · 12 slides", icon: "slides" },
  ];

  /* ---------------------------------------------------------------- helpers */

  let toastTimer = null;

  function toast(message, options = {}) {
    const running = Boolean(options.running);
    toastText.textContent = message;
    toastEl.classList.toggle("is-running", running);
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    if (!running) {
      toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2500);
    }
  }

  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  function scrollChat() {
    requestAnimationFrame(() => {
      chatScroll.scrollTo({ top: chatScroll.scrollHeight, behavior: "smooth" });
    });
  }

  function closeAttach() {
    attachMenu.classList.remove("is-open");
    setTimeout(() => {
      if (!attachMenu.classList.contains("is-open")) attachMenu.hidden = true;
    }, 220);
  }

  function openAttach() {
    attachMenu.hidden = false;
    requestAnimationFrame(() => attachMenu.classList.add("is-open"));
  }

  /* ------------------------------------------------------------------ views */

  function setView(view) {
    state.view = view;
    $$(".view").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.view === view);
    });
    $$(".tab").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.tab === view);
    });
    if (view === "tasks") renderTasks();
    closeAttach();
  }

  function setConversation(conv) {
    state.conv = conv;
    $$(".conversation").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.conv === conv);
    });
    setView("chat");
    chatScroll.scrollTop = 0;
  }

  /* ------------------------------------------------------------------ tasks */

  function visibleTasks() {
    const query = state.taskQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      if (!query) return true;
      const status = STATUS[task.status] ? STATUS[task.status].label : "";
      return `${task.title} ${task.meta} ${status} ${task.when || ""}`
        .toLowerCase()
        .includes(query);
    });
  }

  function sortGroup(items) {
    if (state.sort !== "az") return items;
    return [...items].sort((a, b) => a.title.localeCompare(b.title));
  }

  function taskMarkup(task) {
    const isDone = state.done.has(task.id);

    if (task.group === "upnext") {
      return `
        <article class="task task--upnext ${isDone ? "is-done" : ""}" data-task="${task.id}" role="button" tabindex="0">
          <span class="task__when">${escapeText(task.when || "")}</span>
          <div class="task__text">
            <div class="task__title">${escapeText(task.title)}</div>
            <div class="task__sub">${escapeText(task.meta)}</div>
          </div>
        </article>`;
    }

    const status = STATUS[task.status] || STATUS.review;
    return `
      <article class="task ${isDone ? "is-done" : ""}" data-task="${task.id}" role="button" tabindex="0">
        <button class="checkbox" type="button" data-check="${task.id}" aria-label="${isDone ? "Reopen" : "Complete"} ${escapeText(task.title)}">${CHECK_SVG}</button>
        <div class="task__text">
          <div class="task__title">${escapeText(task.title)}</div>
          <div class="task__sub"><span class="status ${status.cls}">${status.label}</span><span class="sep"> · </span>${escapeText(task.meta)}</div>
        </div>
      </article>`;
  }

  function groupMarkup(title, dot, items, side) {
    const open = items.filter((task) => !state.done.has(task.id)).length;
    return `
      <div class="group-head">
        <span class="group-head__left"><span class="dot ${dot}"></span>${title} <span class="count">${open}</span></span>
        <span class="group-head__right">${side}</span>
      </div>
      ${items.map(taskMarkup).join("")}`;
  }

  function renderTasks() {
    const all = visibleTasks();
    const active = all.filter((task) => task.group === "active");
    const input = sortGroup(active.filter((task) => task.status === "input"));
    const review = sortGroup(active.filter((task) => task.status !== "input"));
    const upnext = all.filter((task) => task.group === "upnext");

    const tomorrow = upnext.filter((task) => task.when === "Tomorrow");
    const later = upnext.filter((task) => task.when !== "Tomorrow");

    const emptyMarkup =
      '<div class="empty">Nothing matches that search.<br>Try a project, a status, or a person.</div>';

    const activeHTML = [];
    if (input.length) activeHTML.push(groupMarkup("Needs input", "dot--input", input, "Today"));
    if (review.length) activeHTML.push(groupMarkup("Ready for review", "dot--review", review, "Earlier"));
    if (!activeHTML.length) activeHTML.push(emptyMarkup);

    const upnextHTML = [];
    if (tomorrow.length) upnextHTML.push(groupMarkup("Tomorrow", "dot--upcoming", tomorrow, "Wed 22 Oct"));
    if (later.length) upnextHTML.push(groupMarkup("This week", "dot--upcoming", later, "Thu–Fri"));
    if (!upnextHTML.length) upnextHTML.push(emptyMarkup);

    $("#activeTasks").innerHTML = activeHTML.join("");
    $("#upNextTasks").innerHTML = upnextHTML.join("");

    const isActive = state.tasksTab === "active";
    $("#activeTasks").hidden = !isActive;
    $("#upNextTasks").hidden = isActive;

    $$("[data-tasks-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tasksTab === state.tasksTab);
    });

    const openCount = tasks.filter((task) => task.group === "active" && !state.done.has(task.id)).length;
    const left = state.taskQuery.trim()
      ? `${all.length} result${all.length === 1 ? "" : "s"}`
      : isActive
        ? `${openCount} open`
        : `${upnext.length} scheduled`;

    $("#taskMetaLeft").textContent = left;
    $(".list-meta__right").textContent = isActive ? "Updated just now" : "Next · Tomorrow";
  }

  function toggleTask(id) {
    const wasDone = state.done.has(id);
    if (wasDone) state.done.delete(id);
    else state.done.add(id);

    const row = document.querySelector(`.task[data-task="${id}"]`);
    if (row) row.classList.toggle("is-done", !wasDone);

    window.setTimeout(renderTasks, 380);
    toast(wasDone ? "Task reopened" : "Task completed");
  }

  function openTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    state.detailTask = id;
    const status = STATUS[task.status] || STATUS.review;
    const statusLabel = task.status === "upcoming" ? "Scheduled" : status.label;

    $("#detailPill").innerHTML = `
      <strong>${escapeText(task.title)}</strong>
      <span class="detail__status detail__status--${task.status === "input" ? "input" : "review"}">${statusLabel}</span>`;

    $("#detailBody").innerHTML = detailMarkup(task);
    detail.classList.add("is-open");
    detail.setAttribute("aria-hidden", "false");
    $("#detailBody").scrollTop = 0;
    closeAttach();
  }

  function closeDetail() {
    detail.classList.remove("is-open");
    detail.setAttribute("aria-hidden", "true");
    state.detailTask = null;
  }

  function approvalMarkup(approved) {
    return `
      <div class="approval ${approved ? "is-approved" : ""}" data-approval="detail">
        <div class="approval__pending">
          <div class="approval__head">
            <span class="approval__amount">$640.00</span>
            <span class="approval__expiry">Expires in 8 min</span>
          </div>
          <div class="approval__merchant">County health permit</div>
          <div class="approval__row">
            <span>Health permit fee</span>
            <svg class="icon icon--chef"><use href="#i-chevron"/></svg>
          </div>
          <button class="btn btn--dark" type="button" data-action="approve">Approve</button>
          <button class="btn btn--ghost" type="button" data-action="defer">Not now</button>
        </div>
        <div class="approval__done">
          <span class="done-badge">${CHECK_SVG}</span>
          <div>
            <div class="done-title">Health permit approved</div>
            <div class="done-sub">$640.00 · Receipt filed in Chicago</div>
          </div>
          <button class="text-link" type="button" data-action="toast-receipt">View</button>
        </div>
        <div class="approval__later">
          <span class="later-badge"><svg class="icon"><use href="#i-clock"/></svg></span>
          <div>
            <div class="done-title">We’ll ask again at 5:00 PM</div>
            <div class="done-sub">The county form is saved and ready.</div>
          </div>
          <button class="text-link" type="button" data-action="undo-defer">Undo</button>
        </div>
      </div>`;
  }

  function detailMarkup(task) {
    if (task.detail === "email") {
      const sent = task.status === "sent";
      return `
        <div class="detail__thread">
          <div class="msg msg--me"><p class="bubble bubble--me">Send the deck to Maya at Harbor.</p></div>
          <p class="bubble">Drafted with the data room link. Send from you?</p>
        </div>
        <article class="mail-card">
          <header class="mail-card__head">
            <div class="mail-card__kind"><span class="mail-ico"><svg class="icon"><use href="#i-mail"/></svg></span>Email</div>
            <div class="mail-card__tools">
              <button class="icon-btn" type="button" data-action="copy-email" aria-label="Copy email"><svg class="icon"><use href="#i-copy"/></svg></button>
              <button class="icon-btn" type="button" data-action="edit-email" aria-label="Edit draft"><svg class="icon"><use href="#i-edit"/></svg></button>
            </div>
          </header>
          <div class="mail-fields">
            <div class="mail-field"><span>To</span><p>Maya, Harbor Ventures</p></div>
            <div class="mail-field"><span>Subject</span><p>Deck and data room</p></div>
          </div>
          <div class="mail-body">Hi Maya,

Here is our deck for Thursday, with the link to the data room.

Let me know if anything needs a tweak before then.

Best,
Alex</div>
          <div class="mail-actions" ${sent ? "hidden" : ""}>
            <button class="btn btn--dark" type="button" data-action="send-email">Send email</button>
            <button class="btn btn--ghost" type="button" data-action="edit-email">Edit draft</button>
          </div>
          <div class="mail-success" ${sent ? "" : "hidden"}>${CHECK_SVG} Sent to Maya · just now</div>
        </article>
        <p class="mail-hint">Drafted by Open Duet · review before sending</p>
        <div class="detail__actions">
          <button class="btn btn--ghost" type="button" data-action="ask-claude" data-task="${task.id}">Ask Open Duet about this</button>
        </div>`;
    }

    if (task.detail === "permit") {
      const approved = state.done.has(task.id);
      return `
        <div class="detail__thread">
          <p class="bubble">The county form is filled. Only the $640 fee needs your OK — after that the permit is on its way.</p>
        </div>
        ${approvalMarkup(approved)}
        <p class="mail-hint">Approving releases the fee today · Chicago opens Nov 14</p>
        <div class="detail__actions">
          <button class="btn btn--ghost" type="button" data-action="ask-claude" data-task="${task.id}">Ask Open Duet about this</button>
        </div>`;
    }

    if (task.detail === "deck") {
      return `
        <div class="detail__thread">
          <p class="bubble">The deck is rebuilt with Q3. Two slides need your eye — the pricing slide and the appendix.</p>
        </div>
        <article class="deck-card">
          <div class="deck-visual">
            <div class="deck-slide deck-slide--accent"><span></span><span></span><span></span><span style="width:52%"></span></div>
            <div class="deck-slide"><span></span><span></span><span></span><span style="width:64%"></span></div>
            <div class="deck-slide"><span></span><span></span><span style="width:70%"></span></div>
          </div>
          <div class="deck-meta">
            <div><strong>Series A deck</strong><small>12 slides · rebuilt today</small></div>
            <span class="status status--review">$3.1M</span>
          </div>
          <button class="btn btn--dark" type="button" data-action="open-artifact" data-artifact="deck">Open deck</button>
        </article>
        <div class="detail__actions">
          <button class="btn btn--ghost" type="button" data-action="ask-claude" data-task="${task.id}">Ask Open Duet about this</button>
        </div>`;
    }

    const note = taskNotes[task.id] || {
      summary: "This is ready for you. I kept the context from the channel in one place.",
      items: ["Read the short version.", "Approve the next step.", "I’ll handle the follow-up."],
    };

    return `
      <div class="detail__thread">
        <p class="bubble">${note.summary}</p>
      </div>
      <article class="note-card">
        <div class="note-card__head"><svg class="icon"><use href="#i-check-circle"/></svg> What Open Duet found</div>
        <div class="note-list">
          ${note.items
            .map(
              (item) =>
                `<div class="note-item"><span class="tick">${CHECK_SVG}</span><span>${item}</span></div>`
            )
            .join("")}
        </div>
      </article>
      <div class="detail__actions">
        <button class="btn btn--dark" type="button" data-action="mark-complete" data-task="${task.id}">Mark complete</button>
        <button class="btn btn--ghost" type="button" data-action="ask-claude" data-task="${task.id}">Ask Open Duet about this</button>
      </div>`;
  }

  /* --------------------------------------------------------------- artifacts */

  function renderArtifactRail() {
    const rail = $("#artifactRail");
    rail.innerHTML = railOrder
      .filter((id) => artifacts[id])
      .map((id) => {
        const item = artifacts[id];
        return `
          <button class="artifact-card" type="button" data-artifact="${id}">
            <span class="artifact-card__eyebrow">${item.cardEyebrow}</span>
            <span class="artifact-card__title">${item.cardTitle}</span>
            ${item.cardDate ? `<span class="artifact-card__date">${item.cardDate}</span>` : ""}
            <span class="artifact-card__body">${item.cardBody}</span>
          </button>`;
      })
      .join("");
  }

  function artifactPaper(item) {
    let content = "";

    if (item.view === "q3") {
      content = `
        <p class="paper__lead">Net revenue landed 8.4% above plan, carried by Enterprise renewals. Gross margin held at 81% for a third consecutive quarter.</p>
        <div class="chart">
          <div class="chart__col"><span class="chart__val">$2.1M</span><span class="chart__bar" style="height:44%"></span><span style="font-size:8px;color:#9c9c94">Q1</span></div>
          <div class="chart__col"><span class="chart__val">$2.6M</span><span class="chart__bar" style="height:63%"></span><span style="font-size:8px;color:#9c9c94">Q2</span></div>
          <div class="chart__col"><span class="chart__val">$3.1M</span><span class="chart__bar chart__bar--now" style="height:82%"></span><span style="font-size:8px;color:#9c9c94">Q3</span></div>
        </div>
        <div class="chart__legend"><span>Booked revenue</span><span>Source · Q3 close</span></div>
        <h3 class="paper__subhead">What moved</h3>
        <div class="paper__body">
          <p>Enterprise renewals added $410K against plan. The mid-market held flat, and self-serve grew 6% on the new pricing page.</p>
          <p>Two invoices slipped into Q4, which flatters the headline by roughly 3 points. Excluding them, growth is 5.4%.</p>
        </div>
        <div class="paper__callout"><strong>Watch:</strong> Northfield’s Net 60 ask would push Q4 collections by 11 days. Worth a conversation before Thursday.</div>`;
    } else if (item.view === "daily") {
      content = `
        <p class="paper__lead">Wednesday, 21 October. Two meetings, one decision, and a quiet afternoon.</p>
        <h3 class="paper__subhead">Today</h3>
        <div class="paper-list">
          <div class="paper-list__row"><span class="paper-list__tick is-done">${CHECK_SVG}</span><div class="paper-list__text">Partner sync<small>9:00 · Bring the Q3 slide and the pricing question</small></div></div>
          <div class="paper-list__row"><span class="paper-list__tick">${CHECK_SVG}</span><div class="paper-list__text">Chicago permit<small>11:30 · One tap. $640.</small></div></div>
          <div class="paper-list__row"><span class="paper-list__tick">${CHECK_SVG}</span><div class="paper-list__text">Deep work<small>14:00 · No meetings. Deck edits.</small></div></div>
          <div class="paper-list__row"><span class="paper-list__tick">${CHECK_SVG}</span><div class="paper-list__text">Review<small>17:30 · Q3 variance and tomorrow’s brief</small></div></div>
        </div>
        <div class="paper__callout"><strong>One clear first move:</strong> approve the $640 health permit. Everything else can wait until the partner sync.</div>`;
    } else if (item.view === "brief") {
      content = `
        <p class="paper__lead">Five things that need you before Thursday. The rest can wait.</p>
        <div class="paper-list">
          <div class="paper-list__row"><span class="paper-list__tick is-done">${CHECK_SVG}</span><div class="paper-list__text"><strong>Hiring</strong><small>Jenn’s other offer expires at 6 p.m. All 3 finalists are booked today.</small></div></div>
          <div class="paper-list__row"><span class="paper-list__tick">${CHECK_SVG}</span><div class="paper-list__text"><strong>Northfield</strong><small>They redlined the $410K renewal and want Net 60.</small></div></div>
          <div class="paper-list__row"><span class="paper-list__tick">${CHECK_SVG}</span><div class="paper-list__text"><strong>Chicago location</strong><small>Opens Nov 14. The health permit needs your OK and $640.</small></div></div>
          <div class="paper-list__row"><span class="paper-list__tick">${CHECK_SVG}</span><div class="paper-list__text"><strong>Series A</strong><small>Harbor meets Thursday at 10. 2 slides need your eye.</small></div></div>
          <div class="paper-list__row"><span class="paper-list__tick">${CHECK_SVG}</span><div class="paper-list__text"><strong>Customers</strong><small>27 wrong delivery orders this weekend. Refunds are drafted.</small></div></div>
        </div>
        <div class="paper__callout"><strong>Your first move:</strong> the permit. It’s the only item with a clock on it.</div>`;
    } else if (item.view === "email") {
      content = `
        <p class="paper__lead">27 new since yesterday. Three need you, four are FYI, the rest are already filed.</p>
        <h3 class="paper__subhead">Needs a reply</h3>
        <div class="paper-list">
          <div class="paper__mail-row"><span class="paper__mail-dot"></span><div class="paper__mail-text">Tomas — Harbor contract redline<small>Net 60 is the only change. Two clauses flagged.</small></div><span class="paper__mail-time">8:12</span></div>
          <div class="paper__mail-row"><span class="paper__mail-dot"></span><div class="paper__mail-text">Jenn — finalist offer<small>Her other offer expires at 6 p.m. today.</small></div><span class="paper__mail-time">7:48</span></div>
          <div class="paper__mail-row"><span class="paper__mail-dot"></span><div class="paper__mail-text">Maya — deck feedback<small>Two notes. Both are already in the deck.</small></div><span class="paper__mail-time">7:20</span></div>
        </div>
        <h3 class="paper__subhead">FYI</h3>
        <div class="paper-list">
          <div class="paper__mail-row"><span class="paper__mail-dot" style="background:#b9b9b1"></span><div class="paper__mail-text">Northfield — renewal summary<small>No action. I filed it with Contracts.</small></div><span class="paper__mail-time">Yesterday</span></div>
          <div class="paper__mail-row"><span class="paper__mail-dot" style="background:#b9b9b1"></span><div class="paper__mail-text">Harbor — Thursday logistics<small>10 a.m., their office. Calendar updated.</small></div><span class="paper__mail-time">Yesterday</span></div>
        </div>
        <div class="paper__callout"><strong>Open Duet drafted:</strong> a reply to Tomas and a nudge for Jenn. Both are in Tasks, waiting for you.</div>`;
    } else if (item.view === "tokyo") {
      content = `
        <p class="paper__lead">Nov 12–19. Flights held, three hotels shortlisted, office visit confirmed for Friday.</p>
        <h3 class="paper__subhead">Itinerary</h3>
        <div class="paper-list">
          <div class="paper__mail-row"><span class="paper__mail-dot"></span><div class="paper__mail-text">Flight · AF 276<small>Wed 12 Nov · CDG → HND · 11:20</small></div><span class="paper__mail-time">Held</span></div>
          <div class="paper__mail-row"><span class="paper__mail-dot"></span><div class="paper__mail-text">Hotel · The Trunk<small>4 min walk to the office · 6 nights</small></div><span class="paper__mail-time">Option</span></div>
          <div class="paper__mail-row"><span class="paper__mail-dot" style="background:#b9b9b1"></span><div class="paper__mail-text">Office visit<small>Fri 14 Nov · 10:00 · Harbor Tokyo</small></div><span class="paper__mail-time">Set</span></div>
          <div class="paper__mail-row"><span class="paper__mail-dot" style="background:#b9b9b1"></span><div class="paper__mail-text">Dinner<small>Sat 15 Nov · 19:30 · 4 people</small></div><span class="paper__mail-time">Draft</span></div>
        </div>
        <div class="paper__callout"><strong>One decision:</strong> confirm The Trunk by Friday and the whole trip is locked.</div>`;
    } else if (item.view === "deck") {
      content = `
        <p class="paper__lead">Twelve slides, rebuilt around Q3. The story is tighter: traction, margin, then the raise.</p>
        <div class="deck-preview-big">
          <span class="spark"></span>
          <h3>Series A<br>Q3 2026</h3>
          <small>Harbor Ventures · Thursday 10:00</small>
        </div>
        <h3 class="paper__subhead">What changed</h3>
        <div class="paper__body">
          <p>Slide 4 now opens with the 8.4% variance. The pricing slide moved after the renewal story. The appendix is three slides shorter.</p>
          <p>Two slides still need your eye: <strong>pricing</strong> and <strong>Net 60</strong>. Everything else is ready to present.</p>
        </div>
        <div class="paper__callout"><strong>Before Thursday:</strong> the Net 60 question. If Harbor asks, the answer is already drafted in Tasks.</div>`;
    } else {
      content = `
        <p class="paper__lead">${escapeText(item.lead || "A first draft, built from your prompt.")}</p>
        <div class="paper__body">
          <p>This draft keeps the shape of your prompt and fills in the context from your workspace: the Q3 numbers, the Chicago timeline, and the Harbor meeting on Thursday.</p>
          <p>The next pass can add sources, a one-page summary, or a version tailored for the board. Open it in chat to keep going.</p>
        </div>
        <div class="paper__callout"><strong>Prompt:</strong> ${escapeText(item.prompt || "Untitled draft")}</div>`;
    }

    return `
      <article class="paper">
        <div class="paper__eyebrow">${escapeText(item.eyebrow)}</div>
        <h2 class="paper__title">${escapeText(item.title)}</h2>
        <div class="paper__meta">${escapeText(item.date)}${item.read ? `<span>·</span>${escapeText(item.read)}` : ""}</div>
        <div class="paper__rule"></div>
        ${content}
        <div class="paper__foot"><span>Prepared by Open Duet</span><span>${escapeText(item.read || "Draft")}</span></div>
      </article>`;
  }

  function openArtifact(id) {
    const item = artifacts[id];
    if (!item) return;
    state.currentArtifact = id;
    $("#artifactBody").innerHTML = artifactPaper(item);
    artifactEl.classList.add("is-open");
    artifactEl.setAttribute("aria-hidden", "false");
    $("#artifactBody").scrollTop = 0;
    closeAttach();
  }

  function closeArtifact() {
    artifactEl.classList.remove("is-open");
    artifactEl.setAttribute("aria-hidden", "true");
  }

  function makeTitle(prompt) {
    let title = prompt
      .replace(/^(please\s+)?(make|create|write|build|design|draft)\s+(me\s+)?(a|an|the)?\s*/i, "")
      .replace(/[.!?]+$/g, "")
      .trim();
    if (!title) title = "Untitled draft";
    title = title.charAt(0).toUpperCase() + title.slice(1);
    if (title.length > 42) title = `${title.slice(0, 39).trimEnd()}…`;
    return title;
  }

  function createArtifactFromPrompt(prompt) {
    const clean = prompt.trim();
    if (!clean) return;

    const type = state.makeType || "document";
    const typeLabel =
      type === "presentation" ? "Presentation" : type === "design" ? "Design" : "Document";
    const id = `gen-${Date.now()}`;
    const title = makeTitle(clean);
    const rail = $("#artifactRail");

    const skeleton = document.createElement("div");
    skeleton.className = "artifact-card artifact-card--skeleton";
    skeleton.innerHTML =
      '<span class="skel-line" style="width:54%;height:8px"></span><span class="skel-line" style="width:82%"></span><span class="skel-line" style="width:68%"></span><span class="skel-line" style="width:90%"></span><span class="skel-line" style="width:48%"></span>';
    rail.appendChild(skeleton);
    rail.scrollTo({ left: rail.scrollWidth, behavior: "smooth" });

    state.makeCount += 1;

    window.setTimeout(() => {
      artifacts[id] = {
        cardEyebrow: `${typeLabel} · Draft`,
        cardTitle: title,
        cardDate: "Just now",
        cardBody: `Built from your prompt: “${clean.length > 64 ? `${clean.slice(0, 61)}…` : clean}”`,
        eyebrow: `${typeLabel} · Draft`,
        title,
        date: "Just now",
        read: "1 min read",
        view: "generated",
        prompt: clean,
        lead: `Draft created from your prompt: “${clean}”.`,
      };
      railOrder.push(id);
      renderArtifactRail();
      toast("Draft ready in Artifacts");
      requestAnimationFrame(() => {
        rail.scrollTo({ left: rail.scrollWidth, behavior: "smooth" });
      });
    }, 1500);
  }

  /* ----------------------------------------------------------------- search */

  function renderSearchResults(query) {
    const q = query.trim().toLowerCase();
    const results = searchItems.filter(
      (item) => !q || item.title.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)
    );
    const box = $("#makeResults");
    box.innerHTML = results.length
      ? results
          .map(
            (item) => `
            <button class="search-result" type="button" data-artifact="${item.artifact}">
              <span class="search-result__ico"><svg class="icon"><use href="#i-${item.icon}"/></svg></span>
              <span class="search-result__text"><strong>${item.title}</strong><small>${item.sub}</small></span>
              <svg class="icon"><use href="#i-chevron"/></svg>
            </button>`
          )
          .join("")
      : '<div class="empty">No results yet.<br>Try “Q3”, “brief”, or “Tokyo”.</div>';
    box.hidden = false;
  }

  /* ------------------------------------------------------------------- voice */

  function openVoice() {
    voiceEl.classList.add("is-open");
    voiceEl.setAttribute("aria-hidden", "false");
    closeAttach();
    $("#voiceLabel").textContent = "Listening…";
  }

  function closeVoice() {
    voiceEl.classList.remove("is-open");
    voiceEl.setAttribute("aria-hidden", "true");
  }

  function finishVoice() {
    closeVoice();
    setConversation("brief");
    toast("Voice note transcribed");
  }

  /* ------------------------------------------------------------------ drawer */

  function openDrawer() {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    closeAttach();
    $$(".drawer-row[data-channel]").forEach((row) => {
      row.classList.toggle("is-current", row.dataset.channel === state.channel);
    });
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    $("#newChannel").hidden = true;
    $("#newChannelInput").value = "";
  }

  function selectChannel(id) {
    state.channel = id;
    $("#channelLabel").textContent = `#${id}`;
    setView("tasks");
    closeDrawer();
    toast(`#${id}`);
  }

  /* ------------------------------------------------------------------ sheets */

  function openNewTask() {
    newTaskSheet.classList.add("is-open");
    newTaskSheet.setAttribute("aria-hidden", "false");
    closeAttach();
    window.setTimeout(() => $("#newTaskInput").focus(), 380);
  }

  function closeNewTask() {
    newTaskSheet.classList.remove("is-open");
    newTaskSheet.setAttribute("aria-hidden", "true");
  }

  function createTask() {
    const input = $("#newTaskInput");
    const title = input.value.trim();
    if (!title) {
      input.focus();
      return;
    }

    tasks.unshift({
      id: `custom-${Date.now()}`,
      title,
      status: "review",
      group: "active",
      meta: "Added just now",
      detail: "note",
    });

    if (state.tasksTab !== "active") state.tasksTab = "active";
    state.taskQuery = "";
    $("#taskSearch").value = "";
    $("#tasksSearchWrap").hidden = true;
    input.value = "";
    closeNewTask();
    setView("tasks");
    renderTasks();
    toast("Task created");
  }

  /* ------------------------------------------------------------------ chat UI */

  const replies = {
    default: "Got it. I’ll take a look and come back with the next step.",
    deck: "I’ve got the deck and the data room link together. You can review the email draft in Tasks.",
    maya: "The draft to Maya is ready in Tasks — deck and data room, one review before it sends.",
    permit: "The $640 health permit is the only thing blocking the Chicago opening. It expires in 8 minutes.",
    morning: "Your morning brief is ready: Hiring, Northfield, Chicago, Series A, Customers.",
    github: "Connect GitHub and I’ll pick up your repos from there. I can read, review, and open pull requests with you.",
  };

  function replyTo(text) {
    const value = text.toLowerCase();
    if (value.includes("deck") || value.includes("slide")) return replies.deck;
    if (value.includes("maya") || value.includes("email")) return replies.maya;
    if (value.includes("permit") || value.includes("approve") || value.includes("chicago")) return replies.permit;
    if (value.includes("morning") || value.includes("brief")) return replies.morning;
    if (value.includes("github") || value.includes("repo")) return replies.github;
    return replies.default;
  }

  function sendMessage(text) {
    const conv = document.querySelector(`.conversation[data-conv="${state.conv}"]`);
    if (!conv) return;
    const messages = $(".messages", conv);

    messages.insertAdjacentHTML(
      "beforeend",
      `<div class="msg msg--me"><p class="bubble bubble--me">${escapeText(text)}</p></div>`
    );
    scrollChat();

    const typing = document.createElement("div");
    typing.className = "typing";
    typing.innerHTML = "<span></span><span></span><span></span>";

    window.setTimeout(() => {
      messages.appendChild(typing);
      scrollChat();
    }, 280);

    window.setTimeout(() => {
      typing.remove();
      messages.insertAdjacentHTML("beforeend", `<p class="bubble">${replyTo(text)}</p>`);
      scrollChat();
    }, 1500);
  }

  /* ----------------------------------------------------------------- actions */

  function approve(button) {
    const card = button.closest(".approval");
    if (!card || card.classList.contains("is-approved")) return;

    card.classList.add("is-busy");
    button.textContent = "Approving…";

    window.setTimeout(() => {
      card.classList.remove("is-busy");
      card.classList.add("is-approved");
      state.done.add("chicago-cafe");
      renderTasks();

      if (card.closest("#detail")) {
        const status = $("#detailPill .detail__status");
        if (status) {
          status.textContent = "Approved";
          status.className = "detail__status detail__status--review";
        }
      }
      toast("Health permit approved");
    }, 720);
  }

  function defer(button) {
    const card = button.closest(".approval");
    if (!card) return;
    card.classList.add("is-deferred");
    toast("Reminder set for 5:00 PM");
  }

  function undoDefer(button) {
    const card = button.closest(".approval");
    if (!card) return;
    card.classList.remove("is-deferred");
    toast("Reminder cleared");
  }

  function sendEmail(button) {
    const card = button.closest(".mail-card");
    if (!card) return;
    button.disabled = true;
    button.textContent = "Sending…";

    window.setTimeout(() => {
      const task = tasks.find((item) => item.id === "series-a-meeting");
      if (task) {
        task.status = "sent";
        task.meta = "Maya, Harbor · just now";
      }
      renderTasks();
      const actions = $(".mail-actions", card);
      const success = $(".mail-success", card);
      if (actions) actions.hidden = true;
      if (success) success.hidden = false;
      const pillStatus = $("#detailPill .detail__status");
      if (pillStatus) {
        pillStatus.textContent = "Sent";
        pillStatus.className = "detail__status detail__status--sent";
      }
      toast("Email sent to Maya");
    }, 850);
  }

  function markComplete(id) {
    state.done.add(id);
    closeDetail();
    renderTasks();
    toast("Task completed");
  }

  function handleAction(action, el) {
    switch (action) {
      case "open-drawer":
        openDrawer();
        break;
      case "close-drawer":
        closeDrawer();
        break;
      case "open-voice":
        openVoice();
        break;
      case "close-voice":
        closeVoice();
        break;
      case "finish-voice":
        finishVoice();
        break;
      case "approve":
        approve(el);
        break;
      case "defer":
        defer(el);
        break;
      case "undo-defer":
        undoDefer(el);
        break;
      case "toast-receipt":
        toast("Receipt opened (simulated)");
        break;
      case "attach":
        if (attachMenu.classList.contains("is-open")) closeAttach();
        else openAttach();
        break;
      case "attach-pick":
        closeAttach();
        toast(`${el.dataset.pick} picker simulated`);
        break;
      case "connect-github":
        el.disabled = true;
        el.textContent = "Connecting…";
        toast("Running a command…", { running: true });
        window.setTimeout(() => {
          const reveal = document.querySelector("[data-github-reveal]");
          if (reveal) reveal.hidden = false;
          el.textContent = "Connected";
          scrollChat();
          toast("GitHub connected");
        }, 1900);
        break;
      case "new-task":
        openNewTask();
        break;
      case "close-new-task":
        closeNewTask();
        break;
      case "create-task":
        createTask();
        break;
      case "sort-tasks":
        state.sort = state.sort === "az" ? "recent" : "az";
        renderTasks();
        toast(state.sort === "az" ? "Sorted A–Z" : "Sorted by recent");
        break;
      case "toggle-task-search": {
        const wrap = $("#tasksSearchWrap");
        wrap.hidden = !wrap.hidden;
        if (!wrap.hidden) {
          $("#taskSearch").focus();
        } else {
          $("#taskSearch").value = "";
          state.taskQuery = "";
          renderTasks();
        }
        break;
      }
      case "close-task-search":
        $("#tasksSearchWrap").hidden = true;
        $("#taskSearch").value = "";
        state.taskQuery = "";
        renderTasks();
        break;
      case "dismiss-feature":
        $("#featureCard").classList.add("is-dismissed");
        if (!railOrder.includes("q3")) {
          railOrder.unshift("q3");
          renderArtifactRail();
        }
        toast("Q3 variance saved to Artifacts");
        break;
      case "open-artifact":
        if (el.dataset.artifact) openArtifact(el.dataset.artifact);
        break;
      case "close-artifact":
        closeArtifact();
        break;
      case "share-artifact":
        toast("Share link copied");
        break;
      case "artifact-to-chat": {
        const item = artifacts[state.currentArtifact];
        closeArtifact();
        if (item) {
          setView("chat");
          const conv = document.querySelector(`.conversation[data-conv="${state.conv}"] .messages`);
          if (conv) {
            conv.insertAdjacentHTML(
              "beforeend",
              `<p class="bubble">Added “${escapeText(item.title)}” to this chat. Want me to walk through it?</p>`
            );
            scrollChat();
          }
          toast("Added to chat");
        }
        break;
      }
      case "close-detail":
        closeDetail();
        break;
      case "detail-more":
        toast("More actions (simulated)");
        break;
      case "send-email":
        sendEmail(el);
        break;
      case "copy-email":
        toast("Email copied");
        break;
      case "edit-email":
        toast("Draft unlocked (simulated)");
        break;
      case "mark-complete":
        markComplete(el.dataset.task);
        break;
      case "ask-claude":
        closeDetail();
        setView("chat");
        window.setTimeout(() => {
          const input = $('[data-composer="chat"] .composer__input');
          if (input) input.focus();
        }, 320);
        toast("Ask Open Duet anything about this task");
        break;
      case "settings":
        toast("Settings simulated");
        break;
      case "everything":
        $("#channelLabel").textContent = "Everything";
        setView("tasks");
        closeDrawer();
        toast("Showing everything");
        break;
      case "new-channel": {
        const form = $("#newChannel");
        form.hidden = false;
        $("#newChannelInput").focus();
        break;
      }
      case "create-channel": {
        const input = $("#newChannelInput");
        const name = input.value.trim();
        if (!name) {
          input.focus();
          break;
        }
        const id = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        $("#channelList").insertAdjacentHTML(
          "beforeend",
          `<button class="drawer-row" type="button" data-channel="${id}">
            <span class="row-ico row-ico--peach"><svg class="icon"><use href="#i-layers"/></svg></span>
            <span class="drawer-row__text"><span>${escapeText(name)}</span><small>Just created</small></span>
          </button>`
        );
        input.value = "";
        $("#newChannel").hidden = true;
        toast(`#${id} created`);
        break;
      }
      default:
        break;
    }
  }

  /* ------------------------------------------------------------------ events */

  phone.addEventListener("click", (event) => {
    const check = event.target.closest("[data-check]");
    if (check) {
      event.stopPropagation();
      toggleTask(check.dataset.check);
      return;
    }

    const channel = event.target.closest("[data-channel]");
    if (channel) {
      selectChannel(channel.dataset.channel);
      return;
    }

    const convLink = event.target.closest("[data-conv-link]");
    if (convLink) {
      closeDrawer();
      setConversation(convLink.dataset.convLink);
      return;
    }

    const tab = event.target.closest("[data-tab]");
    if (tab) {
      setView(tab.dataset.tab);
      return;
    }

    const tasksTab = event.target.closest("[data-tasks-tab]");
    if (tasksTab) {
      state.tasksTab = tasksTab.dataset.tasksTab;
      renderTasks();
      $("#taskScroll").scrollTop = 0;
      return;
    }

    const makeType = event.target.closest("[data-make-type]");
    if (makeType) {
      const selected = state.makeType === makeType.dataset.makeType;
      state.makeType = selected ? null : makeType.dataset.makeType;
      $$("[data-make-type]").forEach((chip) => {
        chip.classList.toggle("is-selected", chip.dataset.makeType === state.makeType);
      });
      const input = $("#makeInput");
      input.placeholder = state.makeType
        ? makeType.dataset.label
        : "Describe what to build";
      input.focus();
      return;
    }

    const actionEl = event.target.closest("[data-action]");
    if (actionEl) {
      handleAction(actionEl.dataset.action, actionEl);
      return;
    }

    const artifactBtn = event.target.closest("[data-artifact]");
    if (artifactBtn) {
      openArtifact(artifactBtn.dataset.artifact);
      $("#makeResults").hidden = true;
      $("#makeSearch").value = "";
      $("#makeSearch").blur();
      return;
    }

    const task = event.target.closest(".task");
    if (task && task.dataset.task) {
      openTask(task.dataset.task);
    }
  });

  phone.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target;
    if (target.classList && target.classList.contains("task")) {
      event.preventDefault();
      openTask(target.dataset.task);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (attachMenu.classList.contains("is-open")) {
      closeAttach();
    } else if (newTaskSheet.classList.contains("is-open")) {
      closeNewTask();
    } else if (drawer.classList.contains("is-open")) {
      closeDrawer();
    } else if (artifactEl.classList.contains("is-open")) {
      closeArtifact();
    } else if (detail.classList.contains("is-open")) {
      closeDetail();
    } else if (voiceEl.classList.contains("is-open")) {
      closeVoice();
    } else if (!$("#tasksSearchWrap").hidden) {
      $("#tasksSearchWrap").hidden = true;
      $("#taskSearch").value = "";
      state.taskQuery = "";
      renderTasks();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".search-wrap")) {
      $("#makeResults").hidden = true;
    }
    if (!event.target.closest("#attachMenu") && !event.target.closest('[data-action="attach"]')) {
      if (attachMenu.classList.contains("is-open")) closeAttach();
    }
  });

  $$(".composer").forEach((form) => {
    const input = $("input", form);
    input.addEventListener("input", () => {
      form.classList.toggle("has-text", input.value.trim().length > 0);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = input.value.trim();

      if (form.dataset.composer === "chat") {
        if (!value) {
          openVoice();
          return;
        }
        sendMessage(value);
        input.value = "";
        form.classList.remove("has-text");
        return;
      }

      if (!value) {
        input.focus();
        return;
      }

      createArtifactFromPrompt(value);
      input.value = "";
      form.classList.remove("has-text");
    });
  });

  $("#taskSearch").addEventListener("input", (event) => {
    state.taskQuery = event.target.value;
    renderTasks();
  });

  $("#newTaskInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      createTask();
    }
  });

  $$("[data-suggest]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = $("#newTaskInput");
      input.value = button.dataset.suggest;
      input.focus();
    });
  });

  $("#newChannelInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAction("create-channel", event.target);
    }
  });

  const makeSearch = $("#makeSearch");
  makeSearch.addEventListener("focus", () => renderSearchResults(makeSearch.value));
  makeSearch.addEventListener("input", () => renderSearchResults(makeSearch.value));

  $("#detail").addEventListener("click", (event) => {
    if (event.target === $("#detail")) closeDetail();
  });

  /* -------------------------------------------------------------------- init */

  renderTasks();
  renderArtifactRail();
  setView("chat");

  const params = new URLSearchParams(window.location.search);
  if (params.get("conv")) setConversation(params.get("conv"));
  if (params.get("view")) setView(params.get("view"));
  if (params.get("donetask")) state.done.add(params.get("donetask"));
  if (params.get("tasksTab")) {
    state.tasksTab = params.get("tasksTab");
    renderTasks();
  }
  if (params.get("task")) openTask(params.get("task"));
  if (params.get("artifact")) openArtifact(params.get("artifact"));
  if (params.get("drawer") === "1") openDrawer();
  if (params.get("voice") === "1") openVoice();

  if (params.get("debug") === "1") {
    const box = document.createElement("div");
    box.style.cssText =
      "position:fixed;left:8px;top:8px;z-index:99999;background:#000;color:#7dff7d;font:12px ui-monospace,monospace;padding:6px 8px;border-radius:6px";
    box.textContent = `s=${getComputedStyle(document.documentElement).getPropertyValue("--s")} vh=${window.innerHeight} vw=${window.innerWidth} phone=${document.querySelector(".phone").getBoundingClientRect().width}`;
    document.body.appendChild(box);
  }
})();
