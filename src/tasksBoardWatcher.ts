import * as fs from 'fs';
import * as path from 'path';

export interface TaskItem {
  text: string;
  done: boolean;
}

export interface TaskStage {
  name: string;
  items: TaskItem[];
  done: number;
  total: number;
}

export interface TicketTasks {
  id: string;
  stages: TaskStage[];
  done: number;
  total: number;
}

function parseTasksMd(content: string): { stages: TaskStage[]; done: number; total: number } {
  const lines = content.split('\n');
  const stages: TaskStage[] = [];
  let currentStage: TaskStage | null = null;
  let done = 0;
  let total = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentStage = { name: line.slice(3).trim(), items: [], done: 0, total: 0 };
      stages.push(currentStage);
    } else if (/^- \[[ x]\]/.test(line)) {
      const isDone = line.startsWith('- [x]');
      const text = line.replace(/^- \[[ x]\]\s*/, '').trim();
      if (currentStage) {
        currentStage.items.push({ text, done: isDone });
        currentStage.total++;
        if (isDone) currentStage.done++;
      }
      total++;
      if (isDone) done++;
    }
  }

  return { stages, done, total };
}

function findTasksFiles(dir: string, results: string[] = []): string[] {
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        findTasksFiles(path.join(dir, entry.name), results);
      } else if (entry.name === 'tasks.md') {
        results.push(path.join(dir, entry.name));
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return results;
}

export function scanTasksBoard(specsDir: string): TicketTasks[] {
  if (!fs.existsSync(specsDir)) return [];

  const taskFiles = findTasksFiles(specsDir);
  const seen = new Set<string>();
  const tickets: TicketTasks[] = [];

  for (const file of taskFiles) {
    const ticketId = path.basename(path.dirname(file));
    if (seen.has(ticketId)) continue;
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const { stages, done, total } = parseTasksMd(content);
      tickets.push({ id: ticketId, stages, done, total });
      seen.add(ticketId);
    } catch {
      // skip unreadable files
    }
  }

  return tickets.sort((a, b) => a.id.localeCompare(b.id));
}

export function scanAllTasksBoards(specsDirs: string[]): TicketTasks[] {
  const seen = new Set<string>();
  const all: TicketTasks[] = [];
  for (const dir of specsDirs) {
    for (const ticket of scanTasksBoard(dir)) {
      if (!seen.has(ticket.id)) {
        all.push(ticket);
        seen.add(ticket.id);
      }
    }
  }
  return all.sort((a, b) => a.id.localeCompare(b.id));
}

export function startTasksBoardWatch(specsDir: string, onUpdate: () => void): fs.FSWatcher | null {
  if (!fs.existsSync(specsDir)) return null;

  let debounce: ReturnType<typeof setTimeout> | null = null;

  const trigger = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(onUpdate, 300);
  };

  try {
    return fs.watch(specsDir, { recursive: true }, (_, filename) => {
      if (filename?.endsWith('tasks.md')) trigger();
    });
  } catch {
    return null;
  }
}
