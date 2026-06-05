export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { company, location } = req.body;
  const locationText = location === "Both" ? "Boston MA or Remote" : location === "Boston" ? "Boston MA" : "Remote";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tools: [{ google_search: {} }],
          contents: [{
            parts: [{
              text: `Search for ALL current entry-level and mid-level job openings at ${company} in ${locationText}. Include every type of role — operations, analyst, coordinator, associate, specialist, manager, supply chain, finance, marketing, data, product, strategy, project manager, program manager, business analyst, or any other entry or mid-level position posted recently.

Search: "${company} entry level mid level jobs ${locationText} ${new Date().getFullYear()} site:${company.toLowerCase().replace(/\s+/g,"")}.com OR site:linkedin.com OR site:indeed.com OR site:greenhouse.io OR site:lever.co"

Return ONLY a raw JSON array with no markdown, no code blocks, no explanation:
[{"title":"Job Title","company":"${company}","location":"City or Remote","url":"https://direct-job-url.com","snippet":"Brief description of the role","posted":"Date posted"}]

Return as many matching jobs as you can find, up to 10. If none found return []`
            }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]) {
      return res.status(200).json({ jobs: [], debug: "no candidates", raw: JSON.stringify(data).slice(0, 300) });
    }

    const parts = data.candidates[0]?.content?.parts || [];
    const textPart = parts.find(p => p.text);
    if (!textPart) return res.status(200).json({ jobs: [], debug: "no text part" });

    const text = textPart.text;
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1) return res.status(200).json({ jobs: [], debug: "no json array", raw: text.slice(0, 300) });

    const jobs = JSON.parse(text.slice(start, end + 1));
    return res.status(200).json({ jobs });

  } catch (err) {
    return res.status(200).json({ jobs: [], error: err.message });
  }
}
