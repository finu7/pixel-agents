import type { OfficeState } from '../office/engine/officeState.js';
import type { ToolActivity } from '../office/types.js';

interface AgentListPanelProps {
  agents: number[];
  officeState: OfficeState;
  agentTools: Record<number, ToolActivity[]>;
  lastMessages: Record<number, string>;
}

const CJK_RE = /[\u2e80-\u9fff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef]/;
const MAX_TEXT_WIDTH = 20;

function truncate(text: string): string {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    const cp = text.codePointAt(i) ?? 0;
    width += cp > 0x2e7f ? 2 : 1;
    if (width > MAX_TEXT_WIDTH) return text.slice(0, i) + '…';
  }
  return text;
}

function getStatus(
  id: number,
  agentTools: Record<number, ToolActivity[]>,
  lastMessages: Record<number, string>,
): { text: string; colorVar: string } {
  const tools = agentTools[id];
  if (tools && tools.length > 0) {
    const active = [...tools].reverse().find((t) => !t.done);
    if (active) {
      if (active.permissionWait)
        return { text: 'Needs approval', colorVar: 'var(--color-status-permission)' };
      return { text: truncate(active.status), colorVar: 'var(--color-status-active)' };
    }
  }
  const last = lastMessages[id];
  if (last) return { text: truncate(last), colorVar: 'var(--color-text-muted)' };
  return { text: 'Idle', colorVar: 'var(--color-text-muted)' };
}

export function AgentListPanel({
  agents,
  officeState,
  agentTools,
  lastMessages,
}: AgentListPanelProps) {
  if (agents.length === 0) return null;

  return (
    <div className="absolute top-8 right-8 pointer-events-none" style={{ zIndex: 50, width: 200 }}>
      <div className="pixel-panel px-10 py-8 flex flex-col gap-6">
        <div
          style={{
            fontSize: 11,
            color: 'var(--color-text-muted)',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          Agents ({agents.length})
        </div>
        <div className="flex flex-col gap-8 overflow-y-auto" style={{ maxHeight: 320 }}>
          {agents.map((id) => {
            const ch = officeState.characters.get(id);
            const label = ch?.folderName ?? `#${id}`;
            const { text, colorVar } = getStatus(id, agentTools, lastMessages);
            const statusSize = CJK_RE.test(text) ? 12 : 14;
            return (
              <div key={id} className="flex flex-col gap-2">
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: statusSize,
                    color: colorVar,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {text}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
