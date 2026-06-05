export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { company } = req.body;

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
              text: `Search for ALL current job openings at ${company} that are located in Boston MA, near Boston MA, Massachusetts, or Remote. Include every type of role at any level — do not filter by job type or seniority. Find as many real current postings as possible.

Search now for: "${company} jobs Boston Massachusetts remote 2026"

Return ONLY a raw JSON array, absolutely no markdown, no code fences, no explanation, just the array:
[{"title":"Exact Job Title","company":"${company}","location":"City State or Remote","url":"https://actual-application-url.com","snippet":"What the role involves","posted":"When it was posted"}]

Return up to 10 jobs. If truly none found in Boston or Remote return []`
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
