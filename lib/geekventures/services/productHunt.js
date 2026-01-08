const PH_API = "https://api.producthunt.com/v2/api/graphql";

const mapProductHunt = (post = {}) => ({
  source: "producthunt",
  name: post.name ?? "",
  description: post.tagline ?? "",
  website: post.website ?? post.url ?? "",
  categories: (post.topics ?? []).map((t) => t.name).filter(Boolean),
  yearFounded: post.createdAt ? Number(post.createdAt.slice(0, 4)) : undefined,
  stage: "launch",
  location: "",
  signalScore: post.votesCount ?? undefined,
});

export async function fetchProductHunt({ limit = 30, token = process.env.PRODUCT_HUNT_TOKEN } = {}) {
  if (!token) return { success: false, items: [], error: "Missing PRODUCT_HUNT_TOKEN" };
  const query = `
    query Latest($limit: Int!) {
      posts(order: NEWEST, first: $limit) {
        edges {
          node {
            name
            tagline
            url
            website
            votesCount
            createdAt
            topics(first: 5) { edges { node { name } } }
          }
        }
      }
    }
  `;
  const variables = { limit };
  try {
    const res = await fetch(PH_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`Product Hunt fetch failed (${res.status})`);
    const json = await res.json();
    const edges = json?.data?.posts?.edges ?? [];
    const items = edges
      .map((edge) => edge?.node)
      .filter(Boolean)
      .map((node) => {
        const topics = node.topics?.edges?.map((e) => e?.node?.name).filter(Boolean) ?? [];
        return mapProductHunt({ ...node, topics });
      });
    return { success: true, items };
  } catch (error) {
    return { success: false, items: [], error: error.message };
  }
}
