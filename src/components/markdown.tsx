import { Fragment, type ReactNode } from "react";

// Renderer Markdown tối giản (không cần dep): heading, bullet, code fence, **bold**, `inline code`.
// Đủ dùng cho bài giảng AI (Module 15).

function renderInline(text: string, keyBase: string): ReactNode[] {
  // Tách **bold** và `inline code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyBase}-${i}`} className="font-semibold text-gray-900 dark:text-gray-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={`${keyBase}-${i}`} className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em] text-pink-600 dark:bg-gray-800 dark:text-pink-400">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={`${keyBase}-${i}`}>{part}</Fragment>;
  });
}

export default function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    if (line.trim().startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // bỏ dòng đóng ```
      blocks.push(
        <pre key={key++} className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs leading-relaxed text-gray-100 dark:bg-black/60">
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const cls =
        level <= 2
          ? "mt-4 text-sm font-bold text-gray-900 dark:text-gray-100"
          : "mt-3 text-sm font-semibold text-gray-800 dark:text-gray-200";
      blocks.push(
        <p key={key++} className={cls}>
          {renderInline(h[2], `h${key}`)}
        </p>
      );
      i++;
      continue;
    }

    // Bullet list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="ml-4 list-disc space-y-1 text-gray-600 dark:text-gray-300">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `li${key}-${idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="ml-4 list-decimal space-y-1 text-gray-600 dark:text-gray-300">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ol${key}-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    blocks.push(
      <p key={key++} className="text-gray-600 dark:text-gray-300">
        {renderInline(line, `p${key}`)}
      </p>
    );
    i++;
  }

  return <div className="space-y-2 text-xs leading-relaxed">{blocks}</div>;
}
