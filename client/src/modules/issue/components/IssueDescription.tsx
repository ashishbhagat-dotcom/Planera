import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useUpdateIssue } from '../hooks/useIssueMutations'
import type { Issue } from '@/shared/types/models'

interface IssueDescriptionProps {
  issue: Issue
  projectKey: string
}

export function IssueDescription({ issue, projectKey }: IssueDescriptionProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(issue.description ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const savedRef = useRef(issue.description ?? '')

  const { mutate: updateIssue } = useUpdateIssue(projectKey, issue.identifier)
  const debouncedValue = useDebounce(value, 800)

  // Sync if the issue prop changes from outside (e.g. WS update)
  useEffect(() => {
    if (!editing) setValue(issue.description ?? '')
  }, [issue.description, editing])

  // Autosave on debounced change while editing
  useEffect(() => {
    if (!editing) return
    if (debouncedValue === savedRef.current) return
    savedRef.current = debouncedValue
    updateIssue({ description: debouncedValue })
  }, [debouncedValue, editing, updateIssue])

  // Auto-resize textarea
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      textareaRef.current.focus()
    }
  }, [editing])

  function startEditing() {
    setValue(issue.description ?? '')
    setEditing(true)
  }

  function stopEditing() {
    // Flush immediately on blur — don't wait for debounce
    if (value !== savedRef.current) {
      savedRef.current = value
      updateIssue({ description: value })
    }
    setEditing(false)
  }

  return (
    <div className="mt-6">
      <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Description</p>

      {editing ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          onBlur={stopEditing}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); stopEditing() }
          }}
          placeholder="Add a description…"
          className={cn(
            'w-full resize-none rounded border border-[var(--accent)] bg-[var(--surface)]',
            'px-3 py-2 text-sm leading-relaxed text-[var(--text-primary)]',
            'placeholder:text-[var(--text-muted)] focus:outline-none',
            'min-h-[80px]',
          )}
          rows={4}
        />
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={startEditing}
          onKeyDown={(e) => e.key === 'Enter' && startEditing()}
          className={cn(
            'min-h-[48px] cursor-text rounded px-1 py-1 text-sm leading-relaxed',
            'transition-colors hover:bg-[var(--surface-hover)]',
            issue.description ? 'text-[var(--text-primary)]' : 'italic text-[var(--text-muted)]',
          )}
        >
          {issue.description ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                h1: ({ children }) => <h1 className="mb-2 text-base font-bold">{children}</h1>,
                h2: ({ children }) => <h2 className="mb-2 text-sm font-bold">{children}</h2>,
                h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold">{children}</h3>,
                ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                code: ({ children }) => (
                  <code className="rounded bg-[var(--surface-hover)] px-1 py-0.5 font-mono text-xs">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="mb-2 overflow-x-auto rounded bg-[var(--surface-hover)] p-3 font-mono text-xs">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="mb-2 border-l-2 border-[var(--border)] pl-3 text-[var(--text-muted)]">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a href={href} className="text-[var(--accent)] underline" target="_blank" rel="noreferrer">
                    {children}
                  </a>
                ),
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                hr: () => <hr className="my-3 border-[var(--border)]" />,
              }}
            >
              {issue.description}
            </ReactMarkdown>
          ) : (
            'Add a description…'
          )}
        </div>
      )}
    </div>
  )
}
