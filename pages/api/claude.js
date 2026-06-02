export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { company, query } = req.body;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tools: [{ google_search: {} }],
        contents: [{
          parts: [{
            text: `Search for current open job postings at ${company} that match these criteria:
- Job types: Operations Analyst, Business Analyst, Program Manager, Project Manager, Supply Chain Analyst, Strategy & Operations, BizOps
- Location: Boston MA or Remote
- Level: Entry-level, Associate, or Mid-level (2-5 years)
Today is ${new Date().toLocaleDateString()}.
Return ONLY a JSON array, no markdown, no explanation:
[{"title":"...","company":"${company}","location":"...","url":"...","snippet":"...","posted":"..."}]
If no matching jobs found, return []`
          }]
        }]
      })
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || "[]";
  const start = text.indexOf("["), end = text.lastIndexOf("]");
  const jobs = start !== -1 ? JSON.parse(text.slice(start, end + 1)) : [];
  res.status(200).json({ jobs });
}
