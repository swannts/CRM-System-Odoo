import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

function findSchemas(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return findSchemas(entryPath);
    }
    return entry.name === "schema.prisma" && directory.split(path.sep).includes("prisma")
      ? [entryPath]
      : [];
  });
}

const schemas = findSchemas(path.resolve("services"))
  .filter((schema) => existsSync(schema))
  .sort();
const prismaBinary = path.resolve("node_modules/.bin/prisma");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://schema-check.invalid:5432/schema_check";
}

if (schemas.length === 0) {
  throw new Error("No Prisma schemas found under services/");
}

for (const schema of schemas) {
  const absoluteSchema = path.resolve(schema);
  console.log(`Generating and validating ${schema}`);
  execFileSync(prismaBinary, ["generate", `--schema=${absoluteSchema}`], { stdio: "inherit" });
  execFileSync(prismaBinary, ["validate", `--schema=${absoluteSchema}`], { stdio: "inherit" });
}
