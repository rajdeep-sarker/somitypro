export function pageHead(title: string, description = `${title} — সোনালী সমিতির তথ্য ও হিসাব ব্যবস্থাপনা।`) {
  const full = `${title} — সোনালী সমিতি`;
  return { meta: [{ title: full }, { name: "description", content: description }, { property: "og:title", content: full }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
}