import type { PrismaClient } from "@prisma/client";
import type { Product } from "@/lib/products";
import type { ShoppingIntent } from "@/lib/server/chat-intent";
import { retrieveProductsFromIntent } from "@/lib/server/chat-intent";
import { buildProductSemanticText } from "@/lib/server/product-semantic-profile";

const EMBEDDING_DIMENSIONS = 768;
const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-2";

type EmbeddingRow = {
  productId: string;
  model: string;
  semanticText: string;
};

type VectorMatchRow = {
  productId: string;
  similarity: number | string;
};

function apiKey() {
  return (process.env.GEMINI_API_KEY ?? "").replace(/^["']|["']$/g, "").trim();
}

function embeddingModel() {
  return process.env.GEMINI_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
}

function vectorLiteral(values: number[]) {
  if (values.length !== EMBEDDING_DIMENSIONS || values.some((value) => !Number.isFinite(value))) {
    throw new Error("Invalid embedding dimensions");
  }
  return "[" + values.join(",") + "]";
}

function queryText(message: string, intent: ShoppingIntent) {
  const structured = [
    intent.occasion && intent.occasion !== "all" ? intent.occasion : "",
    intent.style || "",
    ...intent.items.flatMap((item) => [
      item.role !== "any" ? item.role : "",
      item.category || "",
      ...(item.types || []),
      item.colorFamily || "",
      item.lengthClass || ""
    ])
  ].filter(Boolean).join(" ");

  return [message, structured].filter(Boolean).join(" | ").slice(0, 3000);
}

function documentText(product: Product) {
  const semantic = buildProductSemanticText(product);
  return `title: ${product.name} | text: ${semantic}`;
}

function prepareQuery(text: string) {
  return `task: search result | query: ${text}`;
}

async function embedBatch(inputs: string[]) {
  const key = apiKey();
  if (!key || !inputs.length) return null;

  const model = embeddingModel();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key
        },
        body: JSON.stringify({
          requests: inputs.map((text) => ({
            model: `models/${model}`,
            content: { parts: [{ text }] },
            output_dimensionality: EMBEDDING_DIMENSIONS
          }))
        }),
        signal: controller.signal
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const vectors = Array.isArray(data?.embeddings)
      ? data.embeddings.map((embedding: { values?: unknown }) =>
          Array.isArray(embedding?.values) ? embedding.values.map(Number) : []
        )
      : [];

    if (
      vectors.length !== inputs.length ||
      vectors.some((vector: number[]) =>
        vector.length !== EMBEDDING_DIMENSIONS || vector.some((value) => !Number.isFinite(value))
      )
    ) {
      return null;
    }

    return vectors as number[][];
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function existingEmbeddingRows(db: PrismaClient) {
  try {
    return await db.$queryRawUnsafe<EmbeddingRow[]>(
      `select "productId", model, "semanticText"
       from "ProductSemanticEmbedding"
       where model = $1`,
      embeddingModel()
    );
  } catch {
    return [];
  }
}

async function upsertEmbedding(
  db: PrismaClient,
  product: Product,
  semanticText: string,
  values: number[]
) {
  await db.$executeRawUnsafe(
    `insert into "ProductSemanticEmbedding"
       ("productId", model, dimensions, "semanticText", embedding, "updatedAt")
     values ($1, $2, $3, $4, $5::extensions.vector, now())
     on conflict ("productId") do update set
       model = excluded.model,
       dimensions = excluded.dimensions,
       "semanticText" = excluded."semanticText",
       embedding = excluded.embedding,
       "updatedAt" = now()`,
    product.id,
    embeddingModel(),
    EMBEDDING_DIMENSIONS,
    semanticText,
    vectorLiteral(values)
  );
}

async function embedQueryAndRefreshCandidates(
  db: PrismaClient,
  message: string,
  intent: ShoppingIntent,
  candidates: Product[]
) {
  const rows = await existingEmbeddingRows(db);
  const byId = new Map(rows.map((row) => [row.productId, row]));

  const stale = candidates.filter((product) => {
    const semanticText = buildProductSemanticText(product);
    const row = byId.get(product.id);
    return !row || row.model !== embeddingModel() || row.semanticText !== semanticText;
  });

  // One batch request handles the query and all missing/stale candidate documents.
  const inputs = [
    prepareQuery(queryText(message, intent)),
    ...stale.map(documentText)
  ];
  const vectors = await embedBatch(inputs);
  if (!vectors?.length) return null;

  const queryVector = vectors[0];
  const updates = stale.map((product, index) => {
    const semanticText = buildProductSemanticText(product);
    return upsertEmbedding(db, product, semanticText, vectors[index + 1]);
  });

  if (updates.length) {
    await Promise.all(updates);
  }

  return queryVector;
}

async function vectorMatches(db: PrismaClient, values: number[]) {
  try {
    return await db.$queryRawUnsafe<VectorMatchRow[]>(
      `select "productId",
              1 - (embedding <=> $1::extensions.vector) as similarity
       from "ProductSemanticEmbedding"
       where model = $2
       order by embedding <=> $1::extensions.vector
       limit 200`,
      vectorLiteral(values),
      embeddingModel()
    );
  } catch {
    return [];
  }
}

function rerankHybrid(candidates: Product[], matches: VectorMatchRow[], limit: number) {
  const vectorScore = new Map(
    matches.map((row) => [
      row.productId,
      Math.max(0, Math.min(1, Number(row.similarity) || 0))
    ])
  );

  return candidates
    .map((product, index) => {
      // Existing structured/lexical ranking remains important and acts as the safety
      // signal. Vector similarity is only a reranker after hard filtering.
      const lexical = candidates.length <= 1
        ? 1
        : 1 - (index / (candidates.length - 1)) * 0.35;
      const semantic = vectorScore.get(product.id);

      // Products missing a vector retain their lexical score instead of being punished.
      const score = semantic === undefined
        ? lexical
        : semantic * 0.65 + lexical * 0.35;

      return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => product);
}

export async function retrieveProductsHybrid(args: {
  db: PrismaClient | null;
  message: string;
  intent: ShoppingIntent;
  catalog: Product[];
  contextProducts?: Product[];
  affinityScores?: Map<string, number>;
  limit?: number;
}) {
  const limit = args.limit ?? 5;
  const candidates = retrieveProductsFromIntent(
    args.intent,
    args.catalog,
    20,
    args.contextProducts ?? [],
    args.affinityScores ?? new Map()
  );

  if (
    candidates.length <= 1 ||
    !args.db ||
    !apiKey() ||
    ["modify_outfit", "add_to_cart", "add_outfit_to_cart", "try_on", "open_product"].includes(args.intent.intent)
  ) {
    return candidates.slice(0, limit);
  }

  try {
    const vector = await embedQueryAndRefreshCandidates(
      args.db,
      args.message,
      args.intent,
      candidates
    );
    if (!vector) return candidates.slice(0, limit);

    const matches = await vectorMatches(args.db, vector);
    if (!matches.length) return candidates.slice(0, limit);

    return rerankHybrid(candidates, matches, limit);
  } catch {
    return candidates.slice(0, limit);
  }
}
