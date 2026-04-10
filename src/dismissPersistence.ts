import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { DISMISSED_FILE_NAME } from '../server/src/constants.js';
import { LAYOUT_FILE_DIR } from './constants.js';

/**
 * Persistent dismiss list stored at ~/.pixel-agents/dismissed.json.
 * Maps JSONL file paths to the timestamp when they were dismissed.
 * External agents whose JSONL mtime is newer than the dismiss timestamp
 * are automatically un-dismissed (supports `claude --resume`).
 */

type DismissedMap = Record<string, number>; // path → dismiss timestamp (ms)

function getDismissedFilePath(): string {
  return path.join(os.homedir(), LAYOUT_FILE_DIR, DISMISSED_FILE_NAME);
}

export function readDismissedFiles(): Map<string, number> {
  const filePath = getDismissedFilePath();
  try {
    if (!fs.existsSync(filePath)) return new Map();
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as DismissedMap;
    return new Map(Object.entries(parsed));
  } catch (err) {
    console.error('[Pixel Agents] Failed to read dismissed file:', err);
    return new Map();
  }
}

export function writeDismissedFiles(dismissed: Map<string, number>): void {
  const filePath = getDismissedFilePath();
  const dir = path.dirname(filePath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const obj: DismissedMap = Object.fromEntries(dismissed);
    const json = JSON.stringify(obj, null, 2);
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, json, 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error('[Pixel Agents] Failed to write dismissed file:', err);
  }
}

export function dismissFile(filePath: string): void {
  const dismissed = readDismissedFiles();
  dismissed.set(path.resolve(filePath), Date.now());
  writeDismissedFiles(dismissed);
}

export function undismissFile(filePath: string): void {
  const dismissed = readDismissedFiles();
  if (dismissed.delete(path.resolve(filePath))) {
    writeDismissedFiles(dismissed);
  }
}

export function isDismissed(filePath: string): boolean {
  const dismissed = readDismissedFiles();
  const resolvedPath = path.resolve(filePath);
  const dismissedAt = dismissed.get(resolvedPath);
  if (dismissedAt === undefined) return false;

  // If the file's mtime is newer than dismiss time, it was resumed — un-dismiss it
  try {
    const stat = fs.statSync(resolvedPath);
    if (stat.mtimeMs > dismissedAt) {
      dismissed.delete(resolvedPath);
      writeDismissedFiles(dismissed);
      return false;
    }
  } catch {
    // File doesn't exist — keep dismissed
  }
  return true;
}
