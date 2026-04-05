import { useState } from 'react';

import type { TicketTasks } from '../hooks/useExtensionMessages.js';
import { vscode } from '../vscodeApi.js';

interface TasksBoardProps {
  tickets: TicketTasks[];
  specsDirectory: string | null;
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      style={{
        height: 6,
        background: 'var(--color-board-frame)',
        position: 'relative',
        marginTop: 4,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${pct}%`,
          background: pct === 100 ? 'var(--color-status-success)' : 'var(--color-status-active)',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

export function TasksBoard({ tickets, specsDirectory }: TasksBoardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="absolute top-0 left-0 h-full flex items-start pointer-events-none"
      style={{ zIndex: 60 }}
    >
      {/* Slide-out board */}
      <div
        className="h-full flex flex-col pointer-events-auto"
        style={{
          width: 260,
          background: 'var(--color-board-bg)',
          borderRight: '6px solid var(--color-board-frame)',
          borderTop: '6px solid var(--color-board-frame)',
          borderBottom: '6px solid var(--color-board-frame)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
          boxShadow: open ? '2px 2px 0px var(--color-board-frame)' : 'none',
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
          📌 Tasks {tickets.length > 0 ? `(${tickets.length})` : ''}
        </div>

        <div className="flex flex-col gap-8 p-8">
          {!specsDirectory ? (
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-board-card-muted)',
                textAlign: 'center',
                padding: '16px 4px',
                lineHeight: 1.5,
              }}
            >
              No specs directory set.{' '}
              <span
                style={{
                  color: 'var(--color-board-frame)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => vscode.postMessage({ type: 'setSpecsDirectory' })}
              >
                Set directory
              </span>
            </div>
          ) : tickets.length === 0 ? (
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-board-card-muted)',
                textAlign: 'center',
                padding: '16px 0',
              }}
            >
              No tasks found
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
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
                    fontWeight: 'bold',
                    color: 'var(--color-board-card-text)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span>{ticket.id}</span>
                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--color-board-card-muted)',
                      fontWeight: 'normal',
                    }}
                  >
                    {ticket.done}/{ticket.total}
                  </span>
                </div>
                <ProgressBar done={ticket.done} total={ticket.total} />
                <div className="flex flex-col gap-2" style={{ marginTop: 4 }}>
                  {ticket.stages.map((stage, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 12,
                        color:
                          stage.done === stage.total && stage.total > 0
                            ? 'var(--color-status-success)'
                            : 'var(--color-board-card-muted)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {stage.done === stage.total && stage.total > 0 ? '✓ ' : '· '}
                        {stage.name}
                      </span>
                      <span style={{ marginLeft: 6, flexShrink: 0 }}>
                        {stage.done}/{stage.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toggle tab */}
      <button
        className="pointer-events-auto"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'absolute',
          left: open ? 260 : 0,
          top: 80,
          width: 24,
          padding: '20px 4px',
          background: 'var(--color-board-tab)',
          border: '3px solid var(--color-board-frame)',
          borderLeft: open ? 'none' : '3px solid var(--color-board-frame)',
          color: 'var(--color-board-card)',
          fontSize: 10,
          writingMode: 'vertical-rl',
          letterSpacing: 2,
          cursor: 'pointer',
          transition: 'left 0.2s ease',
          boxShadow: '2px 2px 0px var(--color-board-frame)',
        }}
      >
        {open ? '◀' : '▶'} Tasks
      </button>
    </div>
  );
}
