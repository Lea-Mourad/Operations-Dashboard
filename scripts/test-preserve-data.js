const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const prismaDir = path.join(projectRoot, "prisma");
const devDbPath = path.join(prismaDir, "dev.db");
const devDbJournalPath = path.join(prismaDir, "dev.db-journal");
const backupDir = fs.mkdtempSync(path.join(os.tmpdir(), "occ-test-backup-"));
const backupDbPath = path.join(backupDir, "dev.db");
const backupJournalPath = path.join(backupDir, "dev.db-journal");

function copyIfExists(sourcePath, destinationPath) {
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destinationPath);
  }
}

function restoreFile(sourcePath, destinationPath) {
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destinationPath);
  } else if (fs.existsSync(destinationPath)) {
    fs.rmSync(destinationPath, { force: true });
  }
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

function cleanup() {
  fs.rmSync(backupDir, { recursive: true, force: true });
}

try {
  copyIfExists(devDbPath, backupDbPath);
  copyIfExists(devDbJournalPath, backupJournalPath);

  runCommand("npx", ["prisma", "db", "push"]);
  runCommand("npx", ["vitest", "run"]);
} finally {
  restoreFile(backupDbPath, devDbPath);
  restoreFile(backupJournalPath, devDbJournalPath);
  cleanup();
}
