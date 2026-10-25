import { useMemo, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { ArrowRight, AtSign, ChevronDown, ChevronUp, Download, FileText, MessageSquare, MoreVertical, Paperclip, Send, X, Zap } from 'lucide-react';
import type { ActivityEntry, Comment, FileRef, User } from '@/domain/types';
import { makeFileRef, useClm, useCurrentUser, useUsers } from '@/store/caseStore';
import { fmtCommentTime, fmtDateTime, fmtSize } from '@/clm/format';
import { Avatar, EmptyState, TextArea, UnderlineTabs } from '@/clm/components/ui/misc';
import { Badge } from '@/clm/components/ui/Badge';
import { Button } from '@/clm/components/ui/Button';
import { MenuList, Popover } from '@/clm/components/ui/Popover';
import { Select } from '@/clm/components/ui/Select';
import { useWs } from '../context';
import { downloadFile } from '../dialogs/documents';

/** Highlights @Full Name mentions of known users. */
function renderBody(body: string, users: User[]): ReactNode[] {
  const names = users.map((u) => u.name).sort((a, b) => b.length - a.length);
  const out: ReactNode[] = [];
  let rest = body;
  let key = 0;
  while (rest.length) {
    const at = rest.indexOf('@');
    if (at === -1) break;
    const hit = names.find((n) => rest.startsWith(`@${n}`, at));
    if (!hit) {
      out.push(rest.slice(0, at + 1));
      rest = rest.slice(at + 1);
      continue;
    }
    out.push(rest.slice(0, at));
    out.push(
      <span key={key++} className="text-blue-600">
        @{hit}
      </span>,
    );
    rest = rest.slice(at + hit.length + 1);
  }
  out.push(rest);
  return out;
}

function AttachmentChip({ f, onRemove }: { f: FileRef; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-line bg-surface-sunken px-2.5 py-1.5 text-xs">
      <FileText className="h-3.5 w-3.5" />
      <span className="font-medium">{f.name}</span>
      <span className="text-ink-muted">{fmtSize(f.sizeKb)}</span>
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label={`Remove ${f.name}`} className="text-ink-muted hover:text-ink">
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button type="button" onClick={() => downloadFile(f)} aria-label={`Download ${f.name}`} className="text-ink-muted hover:text-ink">
          <Download className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}

function Composer() {
  const { c } = useWs();
  const me = useCurrentUser();
  const users = useUsers();
  const addComment = useClm((s) => s.addComment);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<FileRef[]>([]);
  const [mention, setMention] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  const insertMention = (u: User) => {
    const el = area.current;
    const pos = el?.selectionStart ?? body.length;
    const before = body.slice(0, pos).replace(/@$/, '');
    const next = `${before}@${u.name} ${body.slice(pos)}`;
    setBody(next);
    setMention(false);
    requestAnimationFrame(() => el?.focus());
  };

  const send = () => {
    if (!body.trim() && files.length === 0) return;
    addComment(c.id, body.trim(), files);
    setBody('');
    setFiles([]);
  };

  return (
    <div className="flex gap-3">
      <Avatar user={me} />
      <div className="flex-1 rounded-lg border border-line focus-within:border-ink/40">
        <TextArea
          ref={area}
          rows={3}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (e.target.value.endsWith('@')) setMention(true);
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.metaKey || e.ctrlKey) && send()}
          placeholder="Add a comment..."
          className="border-0 focus:border-0"
          aria-label="Add a comment"
        />
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pb-2">
            {files.map((f) => (
              <AttachmentChip key={f.id} f={f} onRemove={() => setFiles((fs) => fs.filter((x) => x.id !== f.id))} />
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 px-2 pb-2">
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []).map(makeFileRef);
              setFiles((fs) => [...fs, ...list]);
              e.target.value = '';
            }}
          />
          <button type="button" onClick={() => fileInput.current?.click()} aria-label="Attach files" title="Attach files" className="rounded p-1.5 text-ink-soft hover:bg-surface-sunken">
            <Paperclip className="h-4 w-4" />
          </button>
          <Popover
            open={mention}
            onOpenChange={setMention}
            width={240}
            trigger={({ ref }) => (
              <button ref={ref} type="button" onClick={() => setMention(!mention)} aria-label="Mention someone" title="Mention someone" className="rounded p-1.5 text-ink-soft hover:bg-surface-sunken">
                <AtSign className="h-4 w-4" />
              </button>
            )}
          >
            <div className="max-h-56 overflow-auto py-1">
              {users.map((u) => (
                <button key={u.id} type="button" onClick={() => insertMention(u)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-surface-sunken">
                  <Avatar user={u} size="sm" />
                  {u.name}
                </button>
              ))}
            </div>
          </Popover>
          <span className="flex-1" />
          <Button variant="primary" size="sm" onClick={send} disabled={!body.trim() && files.length === 0}>
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ cm }: { cm: Comment }) {
  const { c } = useWs();
  const users = useUsers();
  const me = useCurrentUser();
  const { editComment, deleteComment } = useClm();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cm.body);
  const author = users.find((u) => u.id === cm.authorId);
  const mine = cm.authorId === me.id;
  return (
    <li className="flex gap-3 py-3">
      <Avatar user={author} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">{author?.name}</span>
          <span className="text-xs text-ink-muted">{fmtCommentTime(cm.createdAt)}</span>
          {cm.editedAt && <span className="text-xs text-ink-muted">edited</span>}
          {cm.kind === 'info_request' && <Badge tone="purple">Information request</Badge>}
          <span className="flex-1" />
          {mine && !editing && (
            <Popover
              align="end"
              trigger={({ toggle, ref }) => (
                <button ref={ref} type="button" onClick={toggle} aria-label="Comment actions" className="rounded p-1 text-ink-soft hover:bg-surface-sunken">
                  <MoreVertical className="h-4 w-4" />
                </button>
              )}
            >
              {(close) => (
                <MenuList
                  close={close}
                  items={[
                    { key: 'edit', label: 'Edit', onSelect: () => setEditing(true) },
                    { key: 'delete', label: 'Delete', danger: true, onSelect: () => deleteComment(c.id, cm.id) },
                  ]}
                />
              )}
            </Popover>
          )}
        </div>
        {editing ? (
          <div className="mt-2">
            <TextArea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Edit comment" />
            <div className="mt-2 flex justify-end gap-2">
              <Button size="sm" onClick={() => (setEditing(false), setDraft(cm.body))}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={!draft.trim()}
                onClick={() => {
                  editComment(c.id, cm.id, draft.trim());
                  setEditing(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          cm.body && <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{renderBody(cm.body, users)}</p>
        )}
        {cm.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {cm.attachments.map((f) => (
              <AttachmentChip key={f.id} f={f} />
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function Comments() {
  const { c } = useWs();
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest');
  const sorted = useMemo(() => [...c.comments].sort((a, b) => (order === 'newest' ? 1 : -1) * (Date.parse(b.createdAt) - Date.parse(a.createdAt))), [c.comments, order]);
  return (
    <div className="pt-4">
      <Composer />
      <div className="mt-5 flex items-center justify-between">
        <h4 className="text-sm font-semibold">Recent Comments</h4>
        <div className="w-36">
          <Select
            value={order}
            onChange={(v) => setOrder(v as 'newest' | 'oldest')}
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
            ]}
          />
        </div>
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-5 w-5" />} title="No comments yet." />
      ) : (
        <ul className="divide-y divide-line">
          {sorted.map((cm) => (
            <CommentItem key={cm.id} cm={cm} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityRow({ a }: { a: ActivityEntry }) {
  const users = useUsers();
  const actor = a.actorId === 'system' ? null : users.find((u) => u.id === a.actorId);
  return (
    <li className="flex gap-3 py-3">
      {actor ? (
        <Avatar user={actor} size="sm" />
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
          <Zap className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0 flex-1 text-sm">
        <div>
          <span className="font-semibold">{actor?.name ?? 'System'}</span> <span className="text-ink-soft">{a.action}</span>
        </div>
        {(a.from || a.to) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {a.field && <span className="bidi font-medium">{a.field}:</span>}
            <span className="text-ink-muted">{a.from}</span>
            <ArrowRight className="h-3.5 w-3.5 text-ink-muted" />
            <span className={clsx('font-medium', a.tone === 'positive' && 'text-green-700', a.tone === 'negative' && 'text-red-700')}>{a.to}</span>
          </div>
        )}
        {a.detail && <div className="bidi mt-0.5 font-medium">{a.detail}</div>}
      </div>
      <span className="shrink-0 text-xs text-ink-muted">{fmtDateTime(a.at)}</span>
    </li>
  );
}

export function CommentsActivity() {
  const { c } = useWs();
  const [tab, setTab] = useState<'comments' | 'activity'>('comments');
  const [open, setOpen] = useState(true);
  return (
    <section id="comments" className="rounded-xl border border-line bg-white px-4 py-3" data-tour="comments">
      <div className="flex items-center">
        <h3 className="flex-1 text-sm font-semibold">Comments & activity</h3>
        <button type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Collapse' : 'Expand'} className="rounded p-1 hover:bg-surface-sunken">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="mt-3">
          <UnderlineTabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'comments', label: 'Comments' },
              { value: 'activity', label: 'Activity Log', tour: 'activity-log-tab' },
            ]}
          />
          {tab === 'comments' ? (
            <Comments />
          ) : (
            <ul className="divide-y divide-line" data-tour="activity-log-panel">
              {c.activity.map((a) => (
                <ActivityRow key={a.id} a={a} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
