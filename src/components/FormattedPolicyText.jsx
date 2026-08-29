import React from 'react';
import { Mail, ExternalLink } from 'lucide-react';

const TOKEN_REGEX = /(\*\*[^*]+\*\*|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|https?:\/\/[^\s)]+|www\.[^\s)]+|\([^)\n]{3,80}\))/g;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const URL_REGEX = /^(https?:\/\/|www\.)[^\s)]+$/;

/**
 * Parses and formats inline text tokens (Emails, Links, Parentheses Badges, Bold Markdown)
 */
const formatInlineText = (text, lineKey = '') => {
  if (!text) return null;

  const parts = text.split(TOKEN_REGEX);

  return parts.map((part, idx) => {
    const key = `${lineKey}-part-${idx}`;
    if (!part) return null;

    // 1. Bold Markdown (**text**)
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="font-bold text-neutral-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // 2. Email Address (mailto clickable link)
    if (EMAIL_REGEX.test(part)) {
      return (
        <a
          key={key}
          href={`mailto:${part}`}
          className="inline-flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline decoration-primary-400/60 hover:decoration-primary-600 underline-offset-4 transition-colors font-mono text-xs sm:text-sm mx-0.5"
        >
          <Mail className="w-3.5 h-3.5 inline shrink-0" />
          <span>{part}</span>
        </a>
      );
    }

    // 3. URLs & Links (clickable in new tab)
    if (URL_REGEX.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-400 hover:underline decoration-primary-400/60 underline-offset-4 transition-colors mx-0.5"
        >
          <span>{part}</span>
          <ExternalLink className="w-3 h-3 inline shrink-0" />
        </a>
      );
    }

    // 4. Parentheses Notes / Badges (e.g. (bKash, Nagad, Cards, etc.))
    if (part.startsWith('(') && part.endsWith(')') && part.length >= 4) {
      return (
        <span
          key={key}
          className="inline-flex items-center px-2 py-0.5 mx-1 rounded-none bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs align-baseline"
        >
          {part}
        </span>
      );
    }

    // Default plain text
    return <span key={key}>{part}</span>;
  });
};

/**
 * FormattedPolicyText Component
 * Handles paragraphs, lists, and inline rich formatting dynamically.
 */
export const FormattedPolicyText = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = String(content).split('\n');

  return (
    <div className={`space-y-2.5 text-neutral-600 dark:text-neutral-300 leading-relaxed ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        // Bullet point line (•, -, *)
        if (/^([•\-*]|\d+\.)\s+/.test(trimmed)) {
          const bulletMatch = trimmed.match(/^([•\-*]|\d+\.)\s+/)[0];
          const restOfLine = trimmed.slice(bulletMatch.length);

          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2">
              <span className="text-primary-500 font-bold shrink-0 mt-0.5 select-none text-xs">
                {bulletMatch.includes('.') ? bulletMatch : '•'}
              </span>
              <div className="flex-1">
                {formatInlineText(restOfLine, `line-${lineIdx}`)}
              </div>
            </div>
          );
        }

        // Standard Paragraph Line
        return (
          <p key={lineIdx} className="leading-relaxed">
            {formatInlineText(line, `line-${lineIdx}`)}
          </p>
        );
      })}
    </div>
  );
};

export default FormattedPolicyText;
