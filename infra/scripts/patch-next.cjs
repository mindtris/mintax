/**
 * Patches a known Next.js bug where `config.generateBuildId` can be `undefined`
 * but `generate-build-id.js` calls it as a function without checking.
 * This affects Next.js 15.x when using .ts config files.
 * See: https://github.com/vercel/next.js/issues
 */
const fs = require("fs")
const path = require("path")

const filePath = path.join(__dirname, "..", "node_modules", "next", "dist", "build", "generate-build-id.js")

if (!fs.existsSync(filePath)) {
  console.log("next/dist/build/generate-build-id.js not found, skipping patch")
  process.exit(0)
}

const content = fs.readFileSync(filePath, "utf-8")
const needle = "let buildId = await generate();"
const patch = 'if (typeof generate !== "function") generate = () => null;\n    let buildId = await generate();'

if (content.includes(patch)) {
  console.log("generate-build-id.js already patched")
  process.exit(0)
}

if (!content.includes(needle)) {
  console.log("generate-build-id.js has unexpected content, skipping patch")
  process.exit(0)
}

const patched = content.replace(needle, patch)
fs.writeFileSync(filePath, patched)
console.log("Patched generate-build-id.js successfully")
