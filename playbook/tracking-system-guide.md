# Tracking System Guide — The Spreadsheet That Runs the Playbook

You don't need a CRM. You need one Google Sheet open in a browser tab from now until $5k MRR. Here's how to set it up.

## Step 1 — Create the sheet

1. Open Google Sheets, create a new spreadsheet, name it `TenantTrack — Customer Acquisition`.
2. Rename `Sheet1` to `Leads`.
3. Open `lead-list-template.csv` from this folder, copy all rows, paste into row 1 of `Leads`.
4. Delete the 5 EXAMPLE rows.
5. Freeze row 1 (View → Freeze → 1 row) so headers stay visible.

## Step 2 — Add the helper tabs

Create three additional tabs (right-click the tab strip → Insert sheet):

- `Weekly Summary` — auto-rolling KPI dashboard
- `Customer Voice` — verbatim quotes, feature asks, objections (one row per quote)
- `Testimonials` — paid customers + their quote + permission status

## Step 3 — Set up the `Weekly Summary` formulas

In the `Weekly Summary` tab, paste this layout into A1:

```
Week starting       | Outreaches | Replies | Reply % | Trials | Trial % | Calls held | Paid | Paid % | New MRR
=TODAY()-WEEKDAY(TODAY(),2)+1 | =COUNTIFS(Leads!I:I,">="&A2,Leads!I:I,"<"&A2+7) | =COUNTIFS(Leads!K:K,"Yes",Leads!I:I,">="&A2,Leads!I:I,"<"&A2+7) | =IFERROR(C2/B2,0) | =COUNTIFS(Leads!L:L,">="&A2,Leads!L:L,"<"&A2+7) | =IFERROR(E2/B2,0) | =COUNTIFS(Leads!M:M,">="&A2,Leads!M:M,"<"&A2+7) | =COUNTIFS(Leads!N:N,">="&A2,Leads!N:N,"<"&A2+7) | =IFERROR(H2/E2,0) | =SUMIFS(Leads!P:P,Leads!N:N,">="&A2,Leads!N:N,"<"&A2+7)
```

Format columns D, F, I as percentages. Format column J as currency.

Add a row for each prior week as you go. After Week 4 you'll have a 4-week trend that immediately tells you which week's message was working.

## Step 4 — Set up channel breakdown (the most important view)

In `Weekly Summary` starting at row 10, paste:

```
Channel       | Total contacted | Replies | Reply % | Trials | Paid | $ MRR
Reddit        | =COUNTIF(Leads!J:J,A11) | =COUNTIFS(Leads!J:J,A11,Leads!K:K,"Yes") | =IFERROR(C11/B11,0) | =COUNTIFS(Leads!J:J,A11,Leads!L:L,"<>") | =COUNTIFS(Leads!J:J,A11,Leads!N:N,"<>") | =SUMIFS(Leads!P:P,Leads!J:J,A11)
BiggerPockets | (same formulas, A12)
LinkedIn      | (same formulas, A13)
Facebook      | (same formulas, A14)
Email         | (same formulas, A15)
YouTube       | (same formulas, A16)
Referral      | (same formulas, A17)
```

Whichever channel has the best `Reply % × Paid %` is where you 2x your effort next week.

## Step 5 — Conditional formatting (visual urgency)

On the `Leads` tab:

- Column Q (Status): set color rules — `Not contacted` = grey, `Contacted` = light blue, `Replied` = yellow, `Trial` = orange, `Paid` = green, `No-thanks` = light red
- Column I (first_contacted_date): if `TODAY() - cell > 4` AND column K (reply) is blank AND status = "Contacted" → highlight the row pale yellow. That's your follow-up queue for the day.
- Column L (trial_started_date): if cell is filled AND today < cell + 14 AND column N (paid) is blank → highlight pale orange. That's your active trial pipeline.

## Step 6 — Daily ritual

Every morning, in this order (8 minutes):

1. Open the sheet
2. Filter `Leads` by status = `Replied` → handle every reply
3. Filter for the pale-yellow rows (4+ day non-replies) → send the ONE follow-up from the template
4. Filter for pale-orange rows (active trials) → check Day 3, Day 7, Day 12 cadence per the SOP
5. Update `Weekly Summary` row for the current week if it's Friday

## Step 7 — Weekly ritual (Friday afternoon, 30 min)

1. Fill in the current week's row in `Weekly Summary`
2. Look at the channel breakdown — which channel won this week?
3. Open `Customer Voice` — what theme came up 3+ times?
4. Decide ONE thing to change next week (different opening line, different channel, different ICP filter)
5. Write the change at the top of `Weekly Summary` as a dated note: `Week of [date]: changing [thing] to [thing] because [reason]`

## What "good" looks like at week 4

- 80–120 outreaches sent
- 12–25 replies (10–20% reply rate is healthy for cold + personalized)
- 4–8 trials started
- 1–3 paid

If your reply rate is below 5%, the message is wrong — fix the message before you send more.
If your trial rate is below 30% of replies, the Loom or the landing page isn't selling — re-record or rewrite.
If your paid rate is below 25% of trials, the onboarding SOP isn't being run tightly — read it again, follow it literally.

## Optional upgrades (only after 50 paying customers)

- Migrate to HubSpot Free CRM or Attio if the sheet is past 1,000 rows
- Add automated reply detection via Zapier (email → spreadsheet update)
- Until then: don't add tools. The sheet is the system. Tools are procrastination.
