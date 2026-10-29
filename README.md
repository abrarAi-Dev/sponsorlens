# 🔍 SponsorLens

**Know before you apply.** International candidates burn hundreds of applications on roles that were never going to sponsor them. SponsorLens scans a job posting in seconds and tells you if it is worth your time.

**Live demo:** https://abrarAi-Dev.github.io/sponsorlens/ (GitHub Pages — enable in repo Settings → Pages → main branch if not live yet)

## What it does (v1)
1. **Posting scanner** — paste a job description; SponsorLens detects hard red flags ("will not sponsor", "US citizens only", clearance requirements, OPT/CPT exclusions), green flags ("visa sponsorship available", H-1B mentions, OPT/CPT welcome), and ambiguous phrases worth asking about — then gives a 0-100 score and a plain verdict.
2. **Company tiers** — a starter curated list of employers by sponsorship tier (high-volume / known / cap-exempt possible / generally no sponsorship), with a link to verify any employer in the official USCIS H-1B Employer Data Hub.
3. **Prevailing-wage check** — an H-1B role must pay at least the DOL prevailing wage for the occupation + location. Enter the offer and the Level 1 wage from flag.dol.gov and see instantly whether it clears the floor, and by how much.
4. **Recruiter templates** — generate a polite, upfront sponsorship question for email, a recruiter reply, or LinkedIn — so the question gets asked before anyone wastes time.
5. **Saved checks** — your scan history, stored only in your browser (localStorage). No accounts, no tracking, nothing leaves your device.

## Why this exists
Built by an international graduate who lived this problem: sponsorship is the single binding constraint in a job search on F-1 status, and postings hide it in boilerplate. The information exists — in USCIS data, DOL wage tables, and posting fine print — but nobody assembles it at the moment of decision: *should I apply to this?*

## Run it locally
No build step. Open `index.html` in a browser, or serve the folder:
```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Honest limits
- Company tiers are qualitative and curated, not petition counts. Always verify in the USCIS Data Hub.
- Wage checks use the DOL wage *you* look up for the exact occupation + location — SponsorLens does the math, DOL is the source of truth.
- This is a decision aid, not legal advice.

## Roadmap
- **v2** — live USCIS H-1B Employer Data Hub import (real petition counts per employer per year), DOL wage lookup by occupation + ZIP inside the app, browser extension that scans LinkedIn/Indeed postings in place.
- **v3** — application CRM: track every application, its sponsorship status, recruiter answers, and deadlines in one board.
- **Venture version** — the verified sponsorship data layer for immigrant job search: a sponsor graph candidates trust, and an employer side where companies that genuinely sponsor can prove it and reach verified international talent. Immigrants are a permanent, growing, underserved market — and every job platform treats sponsorship as a footnote. SponsorLens treats it as the product.

## Contributing
Company tier corrections with a USCIS Data Hub source are welcome — open an issue.

## License
MIT
