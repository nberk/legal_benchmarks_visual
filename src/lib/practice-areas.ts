export const PRACTICE_AREA_NAMES: Record<string, string> = {
  "antitrust-competition": "Antitrust & Competition",
  "arbitration-international-dispute-resolution": "Arbitration & International Disputes",
  "banking-finance": "Banking & Finance",
  "bankruptcy-restructuring": "Bankruptcy & Restructuring",
  "capital-markets": "Capital Markets",
  "corporate-governance": "Corporate Governance",
  "corporate-ma": "Corporate / M&A",
  "data-privacy-cybersecurity": "Data Privacy & Cybersecurity",
  "emerging-companies-venture-capital": "Emerging Companies & Venture Capital",
  "employment-labor": "Employment & Labor",
  "energy-natural-resources": "Energy & Natural Resources",
  "environmental-esg": "Environmental & ESG",
  "funds-asset-management": "Funds & Asset Management",
  "healthcare-life-sciences": "Healthcare & Life Sciences",
  "immigration": "Immigration",
  "insurance": "Insurance",
  "intellectual-property": "Intellectual Property",
  "international-trade-sanctions": "International Trade & Sanctions",
  "litigation-dispute-resolution": "Litigation & Dispute Resolution",
  "real-estate": "Real Estate",
  "structured-finance-securitization": "Structured Finance & Securitization",
  "tax": "Tax",
  "trusts-estates-private-client": "Trusts, Estates & Private Client",
  "white-collar-defense-investigations": "White Collar Defense & Investigations",
};

export function practiceAreaName(slug: string): string {
  if (PRACTICE_AREA_NAMES[slug]) return PRACTICE_AREA_NAMES[slug];
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const WORK_TYPE_LABEL: Record<string, string> = {
  analyze: "Analyze",
  draft: "Draft",
  review: "Review",
  research: "Research",
};

export const WORK_TYPE_BLURB: Record<string, string> = {
  analyze: "Read materials, reach a reasoned conclusion, produce a memo or analysis.",
  draft: "Produce a legal document such as a contract, motion, or client letter.",
  review: "Mark up, redline, or critique an existing document.",
  research: "Investigate a question across sources and report findings.",
};
