#!/usr/bin/env node
import { Command } from "commander";
import path from "path";
import fs from "fs";

import { generateDemoApp } from "./generate-demo-app.mjs";

const program = new Command();

program
  .name("uw-ai")
  .description("Generate a demo-ready underwriting analytics app (always runnable).")
  .version("1.0.0");

program
  .command("generate-demo")
  .description("Generate a runnable demo app (Express + Postgres + seed + Vite UI).")
  .option("--dir <path>", "Output directory", "generated-app")
  .action(async (opts) => {
    const outDir = path.resolve(opts.dir);
    if (fs.existsSync(outDir) && fs.readdirSync(outDir).length > 0) {
      throw new Error(`Output directory is not empty: ${outDir}`);
    }
    await generateDemoApp(outDir);
    console.log(`✅ Demo app generated at: ${outDir}`);
    console.log(`Next:\n  cd ${opts.dir}\n  cp .env.example .env\n  docker compose up -d --build\n  # then open UI at http://localhost:5173`);
  });

program.parseAsync(process.argv);
