#!/usr/bin/env node
// Prompts for a password on stdin (never as a CLI argument — that leaks into
// shell history) and prints its bcrypt hash. Paste the output into
// ADMIN_PASSWORD_HASH in .env.local and in Vercel's environment variables.

import bcrypt from "bcryptjs";
import readline from "node:readline";
import { Writable } from "node:stream";

const COST_FACTOR = 12;

function promptHiddenPassword(question) {
  return new Promise((resolve) => {
    const mutedOutput = new Writable({
      write(chunk, encoding, callback) {
        if (!mutedOutput.muted) process.stdout.write(chunk, encoding);
        callback();
      },
    });
    mutedOutput.muted = false;

    const rl = readline.createInterface({
      input: process.stdin,
      output: mutedOutput,
      terminal: true,
    });

    process.stdout.write(question);
    mutedOutput.muted = true;

    rl.question("", (answer) => {
      mutedOutput.muted = false;
      process.stdout.write("\n");
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const password = await promptHiddenPassword("New admin password: ");
  const confirm = await promptHiddenPassword("Confirm password: ");

  if (password.length === 0) {
    console.error("Password must not be empty.");
    process.exit(1);
  }
  if (password !== confirm) {
    console.error("Passwords did not match.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, COST_FACTOR);

  // Next.js expands unescaped `$VARIABLE` references in .env files (see
  // https://nextjs.org/docs/app/guides/environment-variables#referencing-other-variables).
  // A bcrypt hash's `$2b$12$...` segments look exactly like variable
  // references and get silently replaced with empty strings if pasted
  // as-is, breaking login with no visible error. Escape every `$` so the
  // value that goes in .env.local (and Vercel) is used to hash the password.
  const escapedForDotenv = hash.replace(/\$/g, "\\$");

  console.log("\nPaste this line into .env.local (dollar signs are pre-escaped):");
  console.log(`ADMIN_PASSWORD_HASH=${escapedForDotenv}`);
  console.log("\nFor Vercel's environment variable UI, use the raw hash instead (no escaping):");
  console.log(hash);
}

main();
