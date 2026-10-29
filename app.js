// SponsorLens v1 — all logic runs locally in the browser.
const RED_FLAGS = [
  { re: /no (visa )?sponsorship/gi, label: "States no sponsorship", weight: -45 },
  { re: /will not (provide )?sponsor/gi, label: "Will not sponsor", weight: -45 },
  { re: /(unable|not able) to sponsor/gi, label: "Unable to sponsor", weight: -45 },
  { re: /without (employer )?sponsorship/gi, label: "Must work without sponsorship", weight: -40 },
  { re: /u\.?s\.? citizens? (and|or|&)? (permanent residents?|green card)? ?only/gi, label: "Citizens/residents only", weight: -45 },
  { re: /must be a u\.?s\.? citizen/gi, label: "Citizenship required", weight: -45 },
  { re: /security clearance (is )?required/gi, label: "Security clearance required (usually citizens only)", weight: -35 },
  { re: /no (opt|cpt|visa candidates)/gi, label: "Excludes OPT/CPT/visa candidates", weight: -40 },
  { re: /permanently authorized to work/gi, label: "Requires permanent work authorization", weight: -30 },
];
const GREEN_FLAGS = [
  { re: /visa sponsorship (is )?available/gi, label: "Sponsorship explicitly available", weight: 25 },
  { re: /will sponsor/gi, label: "Will sponsor", weight: 25 },
  { re: /h-?1b/gi, label: "Mentions H-1B", weight: 15 },
  { re: /sponsorship (for|to) (qualified|eligible)/gi, label: "Sponsors qualified candidates", weight: 20 },
  { re: /(stem )?opt (candidates )?(welcome|accepted|eligible)/gi, label: "OPT welcome", weight: 15 },
  { re: /cpt (welcome|accepted|eligible)/gi, label: "CPT welcome", weight: 15 },
];
const AMBIGUOUS = [
  { re: /must be authorized to work in the (u\.?s\.?|united states)/gi, label: " 'Authorized to work in the US' — ambiguous: could mean any EAD, or could hide a no-sponsorship rule. Ask." },
  { re: /e-verify/gi, label: "Mentions E-Verify — neutral by itself; STEM OPT employers must be E-Verify enrolled, so this can be a mild positive." },
];

function findCompany(name) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  return COMPANIES.find(c => c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase())) || null;
}
function scanPosting(text) {
  const hits = [];
  let score = 50;
  for (const f of RED_FLAGS) { const m = text.match(f.re); if (m) { score += f.weight; hits.push({ kind: "red", label: f.label, sample: m[0] }); } }
  for (const f of GREEN_FLAGS) { const m = text.match(f.re); if (m) { score += f.weight; hits.push({ kind: "green", label: f.label, sample: m[0] }); } }
  for (const f of AMBIGUOUS) { const m = text.match(f.re); if (m) hits.push({ kind: "amber", label: f.label, sample: m[0] }); }
  return { score: Math.max(0, Math.min(100, score)), hits };
}
function verdict(score, company) {
  let adj = score;
  if (company) { if (company.tier === "high" || company.tier === "capexempt") adj += 10; if (company.tier === "nosponsor") adj -= 30; }
  adj = Math.max(0, Math.min(100, adj));
  if (adj >= 70) return { adj, text: "🟢 Promising — sponsorship looks plausible. Apply, and still confirm sponsorship in the first recruiter call." };
  if (adj >= 40) return { adj, text: "🟡 Unclear — no hard answer in the posting. Ask the sponsorship question upfront before investing in a long application." };
  return { adj, text: "🔴 Likely a dead end for sponsored candidates — a hard exclusion appears present. Skip unless the employer confirms otherwise in writing." };
}

const $ = id => document.getElementById(id);
function saveCheck(entry) {
  const all = JSON.parse(localStorage.getItem("sponsorlens_checks") || "[]");
  all.unshift({ ...entry, when: new Date().toLocaleString() });
  localStorage.setItem("sponsorlens_checks", JSON.stringify(all.slice(0, 20)));
  renderSaved();
}
function renderSaved() {
  const all = JSON.parse(localStorage.getItem("sponsorlens_checks") || "[]");
  $("savedList").innerHTML = all.length ? all.map(c => `<div class="saved"><strong>${c.company || "Unknown company"}</strong> — score ${c.score}/100 <span>${c.when}</span></div>`).join("") : "<p class='hint'>No checks saved yet.</p>";
}

$("scanBtn").addEventListener("click", () => {
  const text = $("postingInput").value.trim();
  const box = $("scanResult");
  if (text.length < 40) { box.classList.remove("hidden"); box.innerHTML = "Paste a fuller posting (at least a paragraph) for a useful scan."; return; }
  const { score, hits } = scanPosting(text);
  const company = findCompany($("companyInput").value);
  const v = verdict(score, company);
  const salary = parseFloat($("salaryInput").value);
  box.classList.remove("hidden");
  box.innerHTML = `
    <div class="score">Score: ${v.adj}/100</div>
    <p>${v.text}</p>
    ${company ? `<p>Company tier: <strong>${TIER_LABELS[company.tier]}</strong> — ${company.note}</p>` : `<p>Company not in starter list: <strong>${TIER_LABELS.unknown}</strong></p>`}
    ${hits.length ? `<ul>${hits.map(h => `<li class="${h.kind}">${h.kind === "red" ? "🔴" : h.kind === "green" ? "🟢" : "🟡"} ${h.label} <em>("${h.sample}")</em></li>`).join("")}</ul>` : "<p>No sponsorship phrases found either way — silence is not a yes. Ask upfront.</p>"}
    ${!isNaN(salary) ? `<p>Salary noted: $${salary.toLocaleString()} — run it through the prevailing-wage check below before applying.</p>` : ""}`;
  saveCheck({ company: $("companyInput").value, score: v.adj });
});
$("sampleBtn").addEventListener("click", () => {
  $("companyInput").value = "Acme Health";
  $("salaryInput").value = "72000";
  $("postingInput").value = "Business Analyst — Acme Health (Springfield). We are a growing health-tech team hiring a Business Analyst to work with clinical and product teams. Requirements: SQL, Tableau, stakeholder interviews, Agile delivery. Applicants must be authorized to work in the United States without employer sponsorship, now or in the future. We will not sponsor work visas for this position. Salary range $68,000-$76,000.";
});

function renderCompanies(filter = "") {
  const f = filter.trim().toLowerCase();
  const list = COMPANIES.filter(c => c.name.toLowerCase().includes(f));
  $("companyGrid").innerHTML = list.map(c => `<div class="company"><strong>${c.name}</strong><div>${TIER_LABELS[c.tier]}</div><p>${c.note}</p></div>`).join("");
  $("companyMiss").classList.toggle("hidden", !(f && list.length === 0));
}
$("companySearch").addEventListener("input", e => renderCompanies(e.target.value));
renderCompanies();

$("wageBtn").addEventListener("click", () => {
  const offer = parseFloat($("wageOffer").value), floor = parseFloat($("wageFloor").value);
  const box = $("wageResult"); box.classList.remove("hidden");
  if (isNaN(offer) || isNaN(floor)) { box.innerHTML = "Enter both the offered salary and the DOL Level 1 wage for the role + location."; return; }
  const diff = offer - floor;
  box.innerHTML = diff >= 0
    ? `<div class="score">✅ Clears the floor by $${diff.toLocaleString()}</div><p>The offer is at or above the Level 1 prevailing wage you entered. Higher levels (2-4) apply with experience — an employer files at the level matching the role's requirements.</p>`
    : `<div class="score">⛔ $${Math.abs(diff).toLocaleString()} below the floor</div><p>As entered, this pay cannot support an H-1B filing for that occupation + location. The employer would need to raise pay to at least $${floor.toLocaleString()}.</p>`;
});

$("tplBtn").addEventListener("click", () => {
  const name = $("tplName").value || "Your Name", role = $("tplRole").value || "the role", company = $("tplCompany").value || "your company";
  const ch = $("tplChannel").value;
  let msg;
  if (ch === "linkedin") msg = `Hi, I'm interested in the ${role} role at ${company}. Quick upfront question: I am on F-1 status and would need H-1B sponsorship in the future — is that something the company supports for this role? Happy to share my resume either way. — ${name}`;
  else if (ch === "reply") msg = `Hi, thanks for reaching out about the ${role} role at ${company} — it sounds like a strong fit for my background. One upfront question so neither of us wastes time: I am currently on F-1 status and will need employer H-1B sponsorship. Does ${company} sponsor for this role? If yes, I would love to talk next steps.\n\nBest,\n${name}`;
  else msg = `Subject: Sponsorship question — ${role} application\n\nHi ${company} team,\n\nI am preparing my application for the ${role} position and want to ask one question upfront: I am on F-1 status and will require H-1B sponsorship in the future. Does the company sponsor candidates for this role?\n\nThank you for your time — I appreciate a direct answer either way.\n\nBest regards,\n${name}`;
  $("tplOut").value = msg;
});
$("copyBtn").addEventListener("click", async () => { if ($("tplOut").value) { await navigator.clipboard.writeText($("tplOut").value); $("copyBtn").textContent = "Copied ✓"; setTimeout(() => $("copyBtn").textContent = "Copy message", 1500); } });
renderSaved();
