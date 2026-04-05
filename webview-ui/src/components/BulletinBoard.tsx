import { useState } from 'react';

import type { OfficeState } from '../office/engine/officeState.js';
import type { ToolActivity } from '../office/types.js';

interface BulletinBoardProps {
  agents: number[];
  officeState: OfficeState;
  agentTools: Record<number, ToolActivity[]>;
  lastMessages: Record<number, string>;
}

const CJK_RE = /[\u2e80-\u9fff\uf900-\ufaff\ufe30-\ufe4f\uff00-\uffef]/;
const MAX_TEXT_WIDTH = 18;

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
): { text: string; active: boolean; permission: boolean } {
  const tools = agentTools[id];
  if (tools && tools.length > 0) {
    const active = [...tools].reverse().find((t) => !t.done);
    if (active) {
      if (active.permissionWait) return { text: 'Needs approval', active: false, permission: true };
      return { text: truncate(active.status), active: true, permission: false };
    }
  }
  const last = lastMessages[id];
  return { text: last ? truncate(last) : 'Idle', active: false, permission: false };
}

export function BulletinBoard({
  agents,
  officeState,
  agentTools,
  lastMessages,
}: BulletinBoardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="absolute top-0 right-0 h-full flex items-start pointer-events-none"
      style={{ zIndex: 60 }}
    >
      {/* Slide-out board */}
      <div
        className="h-full flex flex-col pointer-events-auto"
        style={{
          width: 260,
          background: 'var(--color-board-bg)',
          borderLeft: '6px solid var(--color-board-frame)',
          borderTop: '6px solid var(--color-board-frame)',
          borderBottom: '6px solid var(--color-board-frame)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.2s ease',
          boxShadow: open ? 'var(--shadow-pixel)' : 'none',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '12px 10px 8px',
            fontSize: 15,
            fontWeight: 'bold',
            color: 'var(--color-board-frame)',
            letterSpacing: 2,
            textTransform: 'uppercase',
            borderBottom: '2px solid var(--color-board-frame)',
          }}
        >
          📋 Agents {agents.length > 0 ? `(${agents.length})` : ''}
        </div>

        <div className="flex flex-col gap-8 p-8">
          {agents.length === 0 ? (
            <div
              style={{
                fontSize: 14,
                color: 'var(--color-board-card-muted)',
                textAlign: 'center',
                padding: '16px 0',
              }}
            >
              No active agents
            </div>
          ) : (
            agents.map((id) => {
              const ch = officeState.characters.get(id);
              const label = ch?.folderName ?? `#${id}`;
              const { text, active, permission } = getStatus(id, agentTools, lastMessages);
              const statusColor = permission
                ? 'var(--color-status-permission)'
                : active
                  ? 'var(--color-status-active)'
                  : 'var(--color-board-card-muted)';
              const statusSize = CJK_RE.test(text) ? 13 : 16;
              return (
                <div
                  key={id}
                  style={{
                    background: 'var(--color-board-card)',
                    border: '1px solid var(--color-board-frame)',
                    boxShadow: '2px 2px 0px var(--color-board-frame)',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      color: 'var(--color-board-card-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 'bold',
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: statusSize,
                      color: statusColor,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {text}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Toggle tab */}
      <button
        className="pointer-events-auto"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'absolute',
          right: open ? 260 : 0,
          top: 80,
          width: 24,
          padding: '20px 4px',
          background: 'var(--color-board-tab)',
          border: '3px solid var(--color-board-frame)',
          borderRight: open ? 'none' : '3px solid var(--color-board-frame)',
          color: 'var(--color-board-card)',
          fontSize: 10,
          writingMode: 'vertical-rl',
          letterSpacing: 2,
          cursor: 'pointer',
          transition: 'right 0.2s ease',
          boxShadow: '2px 2px 0px var(--color-board-frame)',
        }}
      >
        {open ? '▶' : '◀'} Board
      </button>
    </div>
  );
}
