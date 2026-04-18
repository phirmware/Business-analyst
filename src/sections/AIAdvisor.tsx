import { useMemo, useRef, useState, useEffect } from 'react';
import OpenAI from 'openai';
import type { AppSettings, BusinessAnalysis, ChatMessage } from '../types';
import { FRAMEWORK_SYSTEM_PROMPT, summarizeAnalysisForChat } from '../framework';
import { isUsageMode } from '../calculations';
import { Button, Card } from '../components/ui';

const FLAT_STARTER_PROMPTS = [
  'Stress-test this idea',
  "What's my moat?",
  'Is this margin good for my industry?',
  'What am I missing?',
];

const USAGE_STARTER_PROMPTS = [
  'Is my LTV:True-CAC ratio actually viable, given my free-tier cost?',
  'What happens to my business if my top 10% of customers churn?',
  'If my upstream supplier raises prices 40%, how do my margins and verdict change?',
  'Am I a wrapper business? What would I need to build to avoid being replaced?',
  'Is my free tier sustainable given the free-tier drag in my True CAC?',
  'Should I move to hybrid (base + usage) pricing, and what base fee would make p25 profitable?',
  'My NRR is below 100% — what does that mean for my long-term survival?',
];

export function AIAdvisor({
  analysis,
  onChange,
  settings,
  onSettings,
}: {
  analysis: BusinessAnalysis;
  onChange: (patch: Partial<BusinessAnalysis> | ((a: BusinessAnalysis) => BusinessAnalysis)) => void;
  settings: AppSettings;
  onSettings: () => void;
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasKey = settings.apiKey.trim().length > 0 && settings.baseURL.trim().length > 0 && settings.model.trim().length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [analysis.chat.length, loading]);

  const client = useMemo(() => {
    if (!hasKey) return null;
    try {
      return new OpenAI({
        apiKey: settings.apiKey,
        baseURL: settings.baseURL,
        dangerouslyAllowBrowser: true,
      });
    } catch {
      return null;
    }
  }, [settings.apiKey, settings.baseURL, hasKey]);

  const send = async (text: string, opts: { prepend?: string } = {}) => {
    if (!text.trim() || loading) return;
    if (!client) {
      setError('Set your API key, base URL, and model in Settings first.');
      return;
    }
    setError(null);
    const userMsg: ChatMessage = {
      role: 'user',
      content: opts.prepend ? `${opts.prepend}\n\n${text}` : text,
    };
    const nextMessages = [...analysis.chat, userMsg];
    onChange({ chat: nextMessages });
    setInput('');
    setLoading(true);
    try {
      const resp = await client.chat.completions.create({
        model: settings.model,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: FRAMEWORK_SYSTEM_PROMPT },
          ...nextMessages.map((m) => ({ role: m.role, content: m.content })),
        ],
      });
      const assistant = resp.choices[0]?.message?.content ?? '';
      const withReply: ChatMessage[] = [
        ...nextMessages,
        { role: 'assistant', content: assistant || '(empty response)' },
      ];
      onChange({ chat: withReply });
    } catch (e: any) {
      setError(e?.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeCurrent = () => {
    const summary = summarizeAnalysisForChat(analysis);
    send('Give me a full critique of this business using the framework.', {
      prepend: `Here is the current analysis:\n\n${summary}`,
    });
  };

  const clearChat = () => {
    if (analysis.chat.length === 0) return;
    if (confirm('Clear the conversation for this business?')) onChange({ chat: [] });
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">AI Advisor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Skeptical investor on tap. Configure your model in Settings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={analyzeCurrent} disabled={!hasKey || loading}>
            Analyze my current business
          </Button>
          <Button variant="ghost" onClick={clearChat} disabled={analysis.chat.length === 0}>
            Clear
          </Button>
        </div>
      </div>

      {!hasKey && (
        <Card>
          <div className="text-sm">
            <p className="mb-2">
              Add your provider, API key, base URL, and model in{' '}
              <button className="underline" onClick={onSettings}>Settings</button> to enable
              the advisor. The key is kept in your browser only and used to call the
              endpoint directly.
            </p>
          </div>
        </Card>
      )}

      <Card className="flex-1 flex flex-col min-h-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0"
        >
          {analysis.chat.length === 0 && (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p className="mb-3">
                Start by describing your idea, pasting the numbers, or clicking "Analyze my
                current business" above.
              </p>
              <div className="flex flex-wrap gap-2">
                {(isUsageMode(analysis) ? USAGE_STARTER_PROMPTS : FLAT_STARTER_PROMPTS).map(
                  (p) => (
                    <button
                      key={p}
                      className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-left"
                      onClick={() => setInput(p)}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
          {analysis.chat.map((m, i) => (
            <Message key={i} message={m} />
          ))}
          {loading && (
            <div className="text-sm text-slate-500 italic">Thinking…</div>
          )}
          {error && (
            <div className="text-sm text-red-600 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 rounded-md p-2">
              {error}
            </div>
          )}
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={2}
            placeholder={
              hasKey
                ? 'Describe a business idea, or ask a question…'
                : 'Finish configuring the provider in Settings first.'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            disabled={!hasKey}
          />
          <Button type="submit" disabled={loading || !hasKey || !input.trim()}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
          isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="prose-chat" dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
        )}
      </div>
    </div>
  );
}

// Minimal, safe-ish markdown renderer for assistant replies.
function renderMarkdown(src: string): string {
  const escaped = src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks ``` ... ```
  let html = escaped.replace(/```([\s\S]*?)```/g, (_m, code) => {
    return `<pre class="bg-slate-900 text-slate-100 rounded-md p-2 text-xs overflow-x-auto my-2"><code>${code}</code></pre>`;
  });
  // Inline code
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  // Headings
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  // Bold / italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  // Unordered lists (group consecutive `- ` lines)
  html = html.replace(/(^|\n)((?:- .*(?:\n|$))+)/g, (_m, pre, block: string) => {
    const items = block
      .trim()
      .split(/\n/)
      .map((l) => l.replace(/^- /, ''))
      .map((l) => `<li>${l}</li>`)
      .join('');
    return `${pre}<ul>${items}</ul>`;
  });
  // Ordered lists
  html = html.replace(/(^|\n)((?:\d+\. .*(?:\n|$))+)/g, (_m, pre, block: string) => {
    const items = block
      .trim()
      .split(/\n/)
      .map((l) => l.replace(/^\d+\. /, ''))
      .map((l) => `<li>${l}</li>`)
      .join('');
    return `${pre}<ol>${items}</ol>`;
  });
  // Paragraphs (blank-line separated)
  html = html
    .split(/\n\n+/)
    .map((block) => (block.match(/^<(h\d|ul|ol|pre|blockquote)/) ? block : `<p>${block.replace(/\n/g, '<br/>')}</p>`))
    .join('\n');
  return html;
}
