import { prisma } from "./lib/core/db";

async function checkCategories() {
  const categories = await prisma.category.findMany({
    where: { type: "engage" }
  });
  console.log(JSON.stringify(categories, null, 2));
}

checkCategories().catch(console.error);
