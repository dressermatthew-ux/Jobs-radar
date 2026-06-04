export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { company, jobTypes, levels, location } = req.body;

  const locationText = location === "Both" ? "Boston MA or Remote" : location === "Boston" ? "Boston MA" : "Remote";
  const levelText = (levels || []).join(", ");
  const jobText = (jobTypes || []).join(", ");

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
              text: `Search Google for current job openings at ${company} right now in ${locationText} for these roles: ${jobText}. Experience level: ${levelText}.

Find real job postings and return them as a JSON array. Use this exact format with no markdown, no code blocks, just raw JSON:
[{"title":"Job Title Here","company":"${company}","location":"City or Remote","url":"https://actual-job-url.com","snippet":"Brief job description","posted":"Date or time ago"}]

Search for "${company} jobs ${locationText} ${new Date().getFullYear()}" to find current openings. Return at least 1-3 jobs if any exist. If truly none exist return []`
            }]
          }]
        })
      }
    );

    const data = await response.json();
    
    // Log for debugging
    console.log("Gemini response for", company, JSON.stringify(data).slice(0, 500));

    if (!data.candidates || !data.candidates[0]) {
      console.log("No candidates in response:", JSON.stringify(data));
      return res.status(200).json({ jobs: [], debug: "no candidates" });
    }

    const parts = data.candidates[0]?.content?.parts || [];
    const textPart = parts.find(p => p.text);
    
    if (!textPart) {
      return res.status(200).json({ jobs: [], debug: "no text part" });
    }

    const text = textPart.text;
    console.log("Text from Gemini for", company, ":", text.slice(0, 300));

    // Try to extract JSON array
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    
    if (start === -1 || end === -1) {
      return res.status(200).json({ jobs: [], debug: "no json array found", raw: text.slice(0, 200) });
    }

    const jsonStr = text.slice(start, end + 1);
    const jobs = JSON.parse(jsonStr);
    
    return res.status(200).json({ jobs });

  } catch (err) {
    console.error("Error for", company, err);
    return res.status(200).json({ jobs: [], error: err.message });
  }
}
