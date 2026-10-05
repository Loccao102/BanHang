import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SummaryRow = {
  total: bigint | number;
  hard_pass: bigint | number;
  structure_pass: bigint | number;
  avg_constraint_coverage: number | string | null;
  avg_occasion_match: number | string | null;
  avg_intent_confidence: number | string | null;
};

type ViolationRow = {
  violation: string;
  count: bigint | number;
};

function pct(value: number, total: number) {
  return total > 0 ? ((value / total) * 100).toFixed(1) + "%" : "n/a";
}

async function main() {
  const days = Math.max(1, Math.min(90, Number(process.argv[2]) || 7));

  const summary = await prisma.$queryRawUnsafe<SummaryRow[]>(
    `select
       count(*) as total,
       count(*) filter (where coalesce((scores->>'hardConstraintPass')::boolean, false)) as hard_pass,
       count(*) filter (where coalesce((scores->>'outfitStructurePass')::boolean, false)) as structure_pass,
       avg(nullif(scores->>'hardConstraintCoverage','')::double precision) as avg_constraint_coverage,
       avg(nullif(scores->>'occasionMatchRate','')::double precision) as avg_occasion_match,
       avg(nullif(scores->>'intentConfidence','')::double precision) as avg_intent_confidence
     from "AIRecommendation"
     where "createdAt" >= now() - ($1::text || ' days')::interval
       and scores is not null
       and scores <> '{}'::jsonb`,
    String(days)
  );

  const violations = await prisma.$queryRawUnsafe<ViolationRow[]>(
    `select violation, count(*) as count
     from "AIRecommendation" r
     cross join lateral jsonb_array_elements_text(
       case
         when jsonb_typeof(r.scores->'violations') = 'array' then r.scores->'violations'
         else '[]'::jsonb
       end
     ) as v(violation)
     where r."createdAt" >= now() - ($1::text || ' days')::interval
     group by violation
     order by count(*) desc
     limit 15`,
    String(days)
  );

  const row = summary[0];
  const total = Number(row?.total ?? 0);
  const hardPass = Number(row?.hard_pass ?? 0);
  const structurePass = Number(row?.structure_pass ?? 0);

  console.log(`LSOUL Chat Evaluation — last ${days} day(s)`);
  console.log("=".repeat(48));
  console.log(`Recommendations evaluated : ${total}`);
  console.log(`Hard constraint pass      : ${hardPass} (${pct(hardPass, total)})`);
  console.log(`Outfit structure pass     : ${structurePass} (${pct(structurePass, total)})`);
  console.log(`Avg constraint coverage   : ${Number(row?.avg_constraint_coverage ?? 0).toFixed(3)}`);
  console.log(`Avg occasion match        : ${Number(row?.avg_occasion_match ?? 0).toFixed(3)}`);
  console.log(`Avg intent confidence     : ${Number(row?.avg_intent_confidence ?? 0).toFixed(3)}`);

  console.log("\nTop violations");
  console.log("-".repeat(48));
  if (!violations.length) {
    console.log("No violations logged in this window.");
  } else {
    for (const item of violations) {
      console.log(`${String(Number(item.count)).padStart(4)}  ${item.violation}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
