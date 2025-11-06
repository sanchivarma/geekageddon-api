import { fetchJson } from "../utils/http.js";
import { normalizeItem } from "../utils/normalize.js";

const SOURCE_ID = "product-hunt";
const SOURCE_NAME = "Product Hunt";
const SOURCE_URL = "https://www.producthunt.com";
const ENDPOINT = "https://api.producthunt.com/v2/api/graphql";

const QUERY = `
  query LatestTechPosts($first: Int!) {
    posts(order: RANKING, first: $first) {
      edges {
        node {
          id
          name
          tagline
          url
          slug
          votesCount
          featuredAt
          createdAt
          thumbnail { url }
          topics(first: 10) { edges { node { name } } }
          makers(first: 5) { edges { node { name } } }
        }
      }
    }
  }
`;

const pickNames = (connection) =>
  Array.isArray(connection?.edges)
    ? connection.edges
        .map((edge) => edge?.node?.name)
        .filter(Boolean)
    : [];

export async function fetchProductHunt(limit = 10) {
  const token =
    process.env.PRODUCT_HUNT_TOKEN ||
    process.env.PRODUCT_HUNT_API_TOKEN ||
    process.env.NEXT_PUBLIC_PRODUCT_HUNT_TOKEN;

  if (!token) {
    const error = new Error("Missing Product Hunt API token. Set PRODUCT_HUNT_TOKEN to enable this feed.");
    error.code = "MISSING_TOKEN";
    throw error;
  }

  const { data } = await fetchJson(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { first: Math.max(limit, 10) },
    }),
  });

  const edges = data?.data?.posts?.edges ?? [];
  return edges
    .map((edge) => edge?.node)
    .filter(Boolean)
    .slice(0, limit)
    .map((node, index) => {
      const topics = pickNames(node.topics);
      const makers = pickNames(node.makers);
      return normalizeItem({
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        sourceType: "graphql",
        id: node.id,
        url: node.url ?? `${SOURCE_URL}/posts/${node.slug}`,
        title: node.name ?? null,
        summary: node.tagline ?? null,
        publishedAt: node.featuredAt ?? node.createdAt ?? null,
        categories: topics,
        tags: topics,
        badges: [node.votesCount != null ? `${node.votesCount} votes` : null].filter(Boolean),
        imageUrl: node.thumbnail?.url ?? null,
        language: "en",
        score: node.votesCount ?? null,
        extras: {
          makers,
          slug: node.slug,
          position: index,
        },
        raw: node,
      });
    });
}