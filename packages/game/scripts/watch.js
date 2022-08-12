import { build } from "esbuild";
import { execa } from "execa";

build({
  entryPoints: ["src/index.ts"],
  outfile: "build/index.js",
  bundle: true,
  sourcemap: true,
  watch: {
    async onRebuild(error) {
      if (error) {
        console.error("watch build failed:", error);
      } else {
        console.log("watching...");
        await buildTypes();
      }
    },
  },
})
  .then(async () => {
    console.log("watching...");
    await buildTypes();
  })
  .catch(() => process.exit(1));

async function buildTypes() {
  try {
    await execa("yarn build-types", []);
  } catch (error) {
    console.log(error);
  }
}
