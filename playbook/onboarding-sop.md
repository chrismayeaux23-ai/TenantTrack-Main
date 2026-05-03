# White-Glove Onboarding SOP

The single highest-leverage thing a solo founder can do in the first 100 customers is hand-hold every onboarding. It does three things:

1. Trial → paid conversion goes from ~10% (self-serve) to 40–60% (hand-held)
2. You learn what's confusing, what's missing, and what they actually use — gold for the roadmap
3. Every onboarding is a relationship that produces testimonials and referrals

Time cost: ~60 minutes per trial signup spread across 14 days. At 3–5 signups/week this is 3–5 hours/week. Worth every minute until ~50 paying customers.

---

## Trigger: a new trial signup hits the database

Your trigger is the new-signup notification (email, Slack, whatever you have). The clock starts the moment the signup arrives.

---

## Hour 1 — Personal welcome email (manually, not automated)

Send this from your real email address, NOT a noreply, within 60 minutes of signup. If signup happens after 9pm local for them, send first thing next morning instead.

**Subject:** Welcome to TenantTrack — quick offer

**Body:**

> Hi [First name],
>
> [Your name] here, founder of TenantTrack. Saw you signed up — thank you.
>
> Quick offer that I'm only making to early users like you: I'll personally jump on a 30-minute Zoom this week and set up your first property + 3 vendors with you, screen-shared, so the whole system is live before we hang up. No upsell, no pitch — just the fastest path to having TenantTrack actually working for you.
>
> Pick a slot here: [CALENDLY_LINK]
>
> If you'd rather poke around solo first, totally fine — the 5-minute setup video is here: [LOOM_LINK]. Either way, reply to this email if you hit anything weird. I read every reply personally.
>
> — [Your name]

Log: Update the spreadsheet — set "trial_started_date" and add a note "welcome email sent [date]".

---

## Day 1 — If no calendar booking yet, soft nudge

If they haven't booked a call within 24 hours of the welcome email, send one short nudge:

> Hey [First name] — circling back on the offer to set up your first property together. Even if you've already started, I can spot the things that take 30 minutes to figure out alone but 30 seconds to fix on a call. Here's the calendar: [CALENDLY_LINK]

That's it. ONE nudge, never two. If they ignore both, let it be — they'll come back when they have a problem.

---

## Day 2–4 — The 30-minute onboarding call

**Pre-call (5 min before):**
- Pull up their account in your admin view (you should have an admin impersonate or "view as user" route — if not, build it)
- Check: how many properties have they added? Any vendors? Any test requests?
- Have the screen-share ready

**Call agenda (30 min, do not exceed):**

1. **0–3 min — Their context.** "Tell me about your portfolio — how many units, where, biggest maintenance headache last year." LISTEN. Take notes. This is your customer development gold.
2. **3–8 min — Add their first real property** with them. They share screen OR you share and walk them through it. Real address, real unit count.
3. **8–15 min — Add 3 of their existing vendors.** Plumber, HVAC, handyman. Phone numbers, trades, mark preferred. This is the moment the system becomes real to them.
4. **15–22 min — Generate the QR code, show the print flyer, send themselves a test request as a tenant.** Watch their face light up when the request hits the dashboard.
5. **22–27 min — Show auto-dispatch.** Run it on the test request. Show the magic link in the vendor's email. Optionally have them tap accept on their phone.
6. **27–30 min — Two questions, then close.**
   - "What's the one thing that would make this a no-brainer to keep using?" (write it down — verbatim)
   - "If we deliver on that, would you stay past the trial?" (this is the soft commitment — gets honest answers)
   - "I'll check in on Day 7 to make sure things are running smooth. Sound good? [Yes.] Great — go put the QR code on a fridge and we'll talk Friday."

**Post-call (10 min):**
- Send a 4-line follow-up email recapping the 1–2 things you committed to + the Calendly link for any follow-up
- Update the spreadsheet: "call_booked_date" and "call_held_date"
- Log every quote, every feature ask, every objection in a single Notion doc called "Customer Voice" — search this monthly to find product priorities

---

## Day 3 check-in (text or email — short)

> Hey [First name] — just made sure your account is healthy on my end. Did the QR code make it onto a fridge yet? Any hiccups?

---

## Day 7 check-in (the most important one)

This is where trial → paid conversion is decided.

> Hi [First name] — halfway through the trial. Quick check: have any actual tenant requests come through yet? If yes, how did it go. If no, want to do a 15-min nudge call to get the first real one through? Sometimes I'll send a "test request" to your unit personally so you see the full loop with a real one. Reply with what's helpful.

If they say "no requests yet, slow week" — schedule the 15-min call. The product doesn't sell until a real request flows through it.

---

## Day 12 — The conversion ask

Two days before trial ends.

> Hey [First name] — your trial wraps Friday. Two paths from here:
>
> 1. Drop your card and you keep going on the [Starter / Growth / Pro] plan — no price change, no surprises.
> 2. We hop on a 15-minute call so I can answer any "should I keep this" questions before you decide.
>
> Either is fine — just don't want you to lose your data on Friday by accident. Card link: [BILLING_LINK]. Calendar: [CALENDLY_LINK].

---

## Day 14 — If they didn't convert

Don't ghost them. Send the honest exit interview:

> Hey [First name] — looks like you didn't keep the subscription, no worries. One favor: would you tell me the real reason? "Wrong fit", "too expensive", "missing X feature", "just got busy" — all honest answers help me build the right thing. I'll read every word.

40% of these people reply. 10% of those convert later when you've fixed the thing. All of them give you product insight you literally cannot buy.

---

## After the first paid charge

Send within 5 minutes of the Stripe webhook:

> Welcome aboard for real, [First name]. Two asks if you're game:
>
> 1. **Testimonial** — one or two sentences I can put on the site, with your first name + city + unit count. Even "still figuring it out but the QR thing alone is worth it" works.
> 2. **One referral** — name a friend who self-manages and would benefit. I'll send them the same white-glove setup. As a thank-you you both get a $50 credit.
>
> No pressure. And thank you for trusting a solo founder with your maintenance — I take it personally.

Log the testimonial in a "Testimonials" Notion doc. Log the referral as a new lead in the spreadsheet (channel = "referral", which becomes your highest-converting channel within 60 days).

---

## What NEVER to do during onboarding

- ❌ Demo features they didn't ask about (cost-tracking, recurring maintenance, etc.). Save for Day 30.
- ❌ Talk price more than once unless they ask. They already saw it on signup.
- ❌ Skip the "their context" step to save time. The customer-dev value is bigger than the call itself.
- ❌ Promise a feature you don't have. Say "not yet — would that be a deal-breaker?" If yes, log it. If no, move on.
- ❌ Run over 30 minutes. Respect for time IS the brand.
