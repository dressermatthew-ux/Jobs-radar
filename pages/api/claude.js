export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { company } = req.body;

  try {
    const query = encodeURIComponent(`${company} jobs Boston Massachusetts remote entry level mid level`);
    const url = `https://serpapi.com/search.json?engine=google_jobs&q=${query}&location=Boston,Massachusetts&api_key=${process.env.SERPAPI_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    const jobs = (data.jobs_results || []).slice(0, 10).map(job => ({
      title: job.title || "",
      company: job.company_name || company,
      location: job.location || "",
      url: job.related_links?.[0]?.link || job.share_link || "",
      snippet: job.description?.slice(0, 300) || "",
      posted: job.detected_extensions?.posted_at || ""
    }));

    return res.status(200).json({ jobs });

  } catch (err) {
    return res.status(200).json({ jobs: [], error: err.message });
  }
}
