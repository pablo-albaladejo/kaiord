# AI referrers in Umami

How to see visits that arrive from AI assistants, without a new tracking event.
Umami already records the referrer domain and the UTM parameters of every page
view, so this is a saved view over data it collects today. Nothing new is sent,
and the privacy policy ("anonymous page views and product events") already
covers it.

## Which sites

The landing (`/`, `/es/`), the docs (`/docs/`) and the editor (`/app/`) all
report to **one** Umami website: the id in the `UMAMI_WEBSITE_ID` repo secret,
injected by `.github/workflows/deploy-site.yml`. One report covers all three;
filter by URL path when you need one surface.

## The filter

"AI referrers" is any page view where either of these holds:

| Field                     | Operator | Values                                                                                    |
| ------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| Referrer (domain)         | is       | `chatgpt.com`, `perplexity.ai`, `gemini.google.com`, `copilot.microsoft.com`, `claude.ai` |
| UTM source (`utm_source`) | is       | `chatgpt.com`                                                                             |

ChatGPT adds `?utm_source=chatgpt.com` to the links it cites, and some browsers
strip the referrer, so the UTM filter catches visits the referrer filter
misses. Both conditions can match the same visit, so the two reports overlap
(see the weekly read below).

## Create it once (owner)

1. Umami → the kaiord.com website → **Reports** → **Create report** →
   **Insights**.
2. Date range: last 30 days. Fields: _Referrer_ and _URL_.
3. Filters: _Referrer_ is each domain in the table above. Umami combines
   filters on the same field with OR; if your version does not, create one
   report per domain.
4. **Save** it as `AI referrers`.
5. For the UTM side: **Reports** → **UTM**, same range, and read the
   `utm_source = chatgpt.com` row. Save it as `AI referrers (UTM)`.

If the menu names differ in your Umami version, the same result comes from the
website dashboard: **Filter** → _Referrer_ → each domain above, then save the
filter as a segment.

## Weekly read

With the weekly observatory PR (`reports/seo/DASHBOARD.md`):

- AI referrer visits, this week vs last, as **two separate counts**: the
  `AI referrers` total and the `AI referrers (UTM)` total. Do not add them up.
  A ChatGPT visit that keeps its referrer also carries `utm_source=chatgpt.com`,
  so it is in both, and neither report can say which visits overlap. For a
  single ChatGPT figure, take the larger of its two counts: that is a floor,
  not a total;
- the landing pages they reached (`/`, `/docs/convert/*`, `/app/`);
- whether they led to a product event (`editor-opened`,
  `extension-install-clicked`, `workout-exported`) in the same session.

Read it next to the dashboard's "AI answer-engine visibility" and "Monthly AI
visibility" sections: the probe says whether assistants mention kaiord; this
report says whether those mentions send people.
