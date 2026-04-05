import * as fs from 'fs';
import * as path from 'path';

export interface TaskStage {
  name: string;
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
      currentStage = { name: line.slice(3).trim(), done: 0, total: 0 };
      stages.push(currentStage);
    } else if (/^- \[[ x]\]/.test(line)) {
      const isDone = line.startsWith('- [x]');
      if (currentStage) {
        currentStage.total++;
        if (isDone) currentStage.done++;
      }
      total++;
      if (isDone) done++;
    }
  }

  return { stages, done, total };
}

export function scanTasksBoard(specsDir: string): TicketTasks[] {
  const planningDir = path.join(specsDir, 'Versions', 'planning');
  if (!fs.existsSync(planningDir)) return [];

  let versions: string[];
  try {
    versions = fs
      .readdirSync(planningDir)
      .filter((d) => /^v\d+\.\d+\.\d+$/.test(d))
      .sort()
      .reverse();
  } catch {
    return [];
  }

  // Collect all tickets across all versions, newest version wins on duplicate IDs
  const seen = new Set<string>();
  const tickets: TicketTasks[] = [];

  for (const version of versions) {
    const ticketsDir = path.join(planningDir, version, 'tickets');
    if (!fs.existsSync(ticketsDir)) continue;
    for (const ticketId of fs.readdirSync(ticketsDir).sort()) {
      if (seen.has(ticketId)) continue;
      const tasksFile = path.join(ticketsDir, ticketId, 'tasks.md');
      if (!fs.existsSync(tasksFile)) continue;
      try {
        const content = fs.readFileSync(tasksFile, 'utf-8');
        const { stages, done, total } = parseTasksMd(content);
        tickets.push({ id: ticketId, stages, done, total });
        seen.add(ticketId);
      } catch {
        // skip unreadable files
      }
    }
  }

  return tickets.sort((a, b) => a.id.localeCompare(b.id));
}

export function startTasksBoardWatch(
  specsDir: string,
  onUpdate: (tickets: TicketTasks[]) => void,
): fs.FSWatcher | null {
  const planningDir = path.join(specsDir, 'Versions', 'planning');
  if (!fs.existsSync(planningDir)) return null;

  let debounce: ReturnType<typeof setTimeout> | null = null;

  const trigger = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      onUpdate(scanTasksBoard(specsDir));
    }, 300);
  };

  try {
    const watcher = fs.watch(planningDir, { recursive: true }, trigger);
    return watcher;
  } catch {
    return null;
  }
}
