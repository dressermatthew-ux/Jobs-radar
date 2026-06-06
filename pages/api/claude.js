export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { company } = req.body;

  try {
    const query = encodeURIComponent(`${company} jobs`);
    const url = `https://serpapi.com/search.json?engine=google_jobs&q=${query}&location=Boston%2C+Massachusetts%2C+United+States&api_key=${process.env.SERPAPI_KEY}&chips=date_posted%3Amonth`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.jobs_results || data.jobs_results.length === 0) {
      return res.status(200).json({ jobs: [], debug: "no jobs_results", error_message: data.error || "none" });
    }

    const EXCLUDE_TITLES = [
      "engineer", "engineering", "software", "developer", "devops", "sre",
      "infrastructure", "backend", "frontend", "fullstack", "full-stack",
      "machine learning", "ml ", "data scientist", "data science",
      "cybersecurity", "security analyst", "network", "cloud architect",
      "qa ", "quality assurance", "test automation",
      "director", "senior director", "vp ", "vice president", "head of",
      "principal", "staff ", "distinguished", "chief ", "cto", "ceo", "coo",
      "manager", "sr.", "sr ", "senior manager", "lead ", " lead",
      "cashier", "retail", "store associate", "sales associate", "barista",
      "crew member", "team member", "shift supervisor", "shift leader",
      "warehouse associate", "fulfillment associate", "picker", "packer",
      "delivery driver", "driver", "courier", "stocker", "stock associate",
      "package handler", "dock worker", "forklift", "custodian", "janitor",
      "security guard", "security officer", "receptionist", "front desk",
      "food service", "kitchen", "cook", "server", "host ", "hostess",
      "stylist", "salon", "beautician", "technician", "repair tech",
      "field technician", "service technician", "maintenance tech",
      "customer service representative", "call center", "chat support",
      "seasonal", "part-time", "part time", "hourly",
      "intern", "internship", "co-op", "coop", "co op", "apprentice",
      "fellowship", "extern", "graduate program", "rotational program"
    ];

    const filtered = data.jobs_results.filter(job => {
      const title = (job.title || "").toLowerCase();
      return !EXCLUDE_TITLES.some(term => title.includes(term));
    });

    const jobs = filtered.slice(0, 10).map(job => ({
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
