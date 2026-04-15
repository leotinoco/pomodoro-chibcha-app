import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));

function run(cmd) {
  return execSync(cmd, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function isProbablyBinary(buf) {
  const sample = buf.subarray(0, Math.min(buf.length, 8000));
  for (let i = 0; i < sample.length; i++) {
    if (sample[i] === 0) return true;
  }
  return false;
}

function redact(value) {
  const v = String(value);
  if (v.length <= 12) return "***";
  return `${v.slice(0, 6)}…${v.slice(-4)}`;
}

const patterns = [
  { name: "Private key header", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { name: "AWS Access Key ID", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z\-_]{30,}\b/g },
  { name: "Slack token", re: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g },
  {
    name: "GitHub token",
    re: /\b(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/g,
  },
  { name: "Stripe key", re: /\bsk_(live|test)_[0-9A-Za-z]{16,}\b/g },
  {
    name: "Password assignment",
    re: /\b(password|passwd|pwd)\b\s*[:=]\s*(?!\s*process\.env\.)["']?[^"'\s]{6,}/gi,
  },
  {
    name: "Client secret assignment",
    re: /\bclient_secret\b\s*[:=]\s*(?!\s*process\.env\.)["']?[^"'\s]{6,}/gi,
  },
  { name: "Bearer token", re: /\bBearer\s+[A-Za-z0-9\-\._~\+\/]+=*\b/g },
  {
    name: "DB URL",
    re: /\b(postgres(ql)?:\/\/|mongodb(\+srv)?:\/\/|mysql:\/\/)\S+/gi,
  },
];

const blockedPathPatterns = [
  /\.env(\..+)?$/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)\.aws\/credentials$/i,
  /(^|\/)service-?account.*\.json$/i,
  /(^|\/)\.p12$/i,
  /(^|\/)\.pem$/i,
  /(^|\/)\.key$/i,
  /(^|\/)\.pfx$/i,
];

const allowedPathPatterns = [
  /\.env\.example$/i,
  /\.env\.template$/i,
  /\.env\.sample$/i,
];

const scanIgnorePathPatterns = [/^scripts\/scan-secrets\.mjs$/i];

function isBlockedPath(rel) {
  if (allowedPathPatterns.some((re) => re.test(rel))) return false;
  return blockedPathPatterns.some((re) => re.test(rel));
}

function getRepoRoot() {
  try {
    return run("git rev-parse --show-toplevel");
  } catch {
    return process.cwd();
  }
}

function listStagedFiles() {
  const output = run("git diff --cached --name-only --diff-filter=ACMR");
  if (!output) return [];
  return output.split(/\r?\n/).filter(Boolean);
}

function listWorktreeFiles() {
  const output = run("git ls-files");
  if (!output) return [];
  return output.split(/\r?\n/).filter(Boolean);
}

function scanFile(absPath, relPath) {
  let buf;
  try {
    buf = fs.readFileSync(absPath);
  } catch {
    return [];
  }

  if (isProbablyBinary(buf)) return [];

  const text = buf.toString("utf8");
  const findings = [];

  for (const { name, re } of patterns) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(text))) {
      const before = text.slice(0, match.index);
      const line = before.split(/\r?\n/).length;
      findings.push({
        relPath,
        line,
        rule: name,
        sample: redact(match[0]),
      });
    }
  }

  return findings;
}

function main() {
  const mode = args.has("--staged") ? "staged" : "worktree";
  if (!args.has("--staged") && !args.has("--worktree")) {
    process.stderr.write(
      "Uso: node scripts/scan-secrets.mjs --staged | --worktree\n",
    );
    process.exit(2);
  }

  const root = getRepoRoot();
  const relFiles = mode === "staged" ? listStagedFiles() : listWorktreeFiles();
  const findings = [];
  const blocked = [];

  for (const rel of relFiles) {
    const normalized = rel.replace(/\\/g, "/");
    if (scanIgnorePathPatterns.some((re) => re.test(normalized))) {
      continue;
    }

    if (isBlockedPath(normalized)) {
      blocked.push(normalized);
      continue;
    }

    const abs = path.join(root, rel);
    findings.push(...scanFile(abs, normalized));
  }

  if (blocked.length || findings.length) {
    if (blocked.length) {
      process.stderr.write("Archivos sensibles bloqueados por política:\n");
      for (const f of blocked) process.stderr.write(`- ${f}\n`);
      process.stderr.write("\n");
    }

    if (findings.length) {
      process.stderr.write("Posibles secretos detectados:\n");
      for (const f of findings) {
        process.stderr.write(
          `- ${f.relPath}:${f.line} [${f.rule}] (${f.sample})\n`,
        );
      }
      process.stderr.write("\n");
    }

    process.stderr.write(
      "Recomendación: mueve secretos a variables de entorno y rota cualquier credencial que haya estado expuesta.\n",
    );
    process.exit(1);
  }

  process.stdout.write(
    "OK: no se detectaron secretos en el alcance seleccionado.\n",
  );
}

main();
