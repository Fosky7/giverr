// src/components/campaign/RichTextEditor.tsx
//
// Lightweight, dependency-free rich text editor used by the Create Campaign
// wizard (Step 2: long description + story). It renders a small formatting
// toolbar over a contentEditable surface and emits sanitized HTML via
// `onChange`, making it a drop-in for react-hook-form fields.
//
// Design goals:
//   * No heavy editor dependency — uses the built-in `document.execCommand`
//     formatting model, which is broadly supported for basic bold/italic/lists.
//   * Emits *sanitized* HTML (an allow-list of tags/attributes) so the public
//     detail page can render it safely.
//   * Controlled-ish: keeps the DOM in sync when `value` changes externally
//     (e.g. form reset / edit mode pre-population) without clobbering the
//     caret while the user is actively typing.

import * as React from "react";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Undo,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface RichTextEditorProps {
  /** Current HTML value. */
  value?: string;
  /** Called with sanitized HTML whenever the content changes. */
  onChange?: (html: string) => void;
  /** Placeholder shown when empty. */
  placeholder?: string;
  /** Disable editing. */
  disabled?: boolean;
  /** Minimum editor height in pixels. */
  minHeight?: number;
  className?: string;
  id?: string;
}

// Allow-list of tags/attributes we keep when sanitizing pasted / entered HTML.
const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "UL",
  "OL",
  "LI",
  "A",
  "H3",
  "H4",
  "BLOCKQUOTE",
  "DIV",
  "SPAN",
]);

/**
 * Strip disallowed tags/attributes from an HTML fragment. Runs entirely in the
 * DOM (no innerHTML re-injection of untrusted markup back into the live doc).
 */
export function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html;

  const template = document.createElement("template");
  template.innerHTML = html;

  const walk = (node: Node) => {
    // Iterate over a static copy since we mutate children as we go.
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;

        if (!ALLOWED_TAGS.has(el.tagName)) {
          // Unwrap disallowed elements: replace with their text content.
          const text = document.createTextNode(el.textContent ?? "");
          el.replaceWith(text);
          return;
        }

        // Strip every attribute except safe href on anchors.
        Array.from(el.attributes).forEach((attr) => {
          const name = attr.name.toLowerCase();
          if (el.tagName === "A" && name === "href") {
            const href = attr.value.trim();
            // Block javascript: and data: URLs.
            if (/^(https?:|mailto:|\/)/i.test(href)) {
              el.setAttribute("target", "_blank");
              el.setAttribute("rel", "noopener noreferrer");
              return;
            }
          }
          el.removeAttribute(attr.name);
        });

        walk(el);
      }
    });
  };

  walk(template.content);
  return template.innerHTML;
}

interface ToolbarButtonProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarButton({ label, icon: Icon, onClick, disabled }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      aria-label={label}
      title={label}
      disabled={disabled}
      // Use onMouseDown + preventDefault so the editor keeps focus/selection
      // when the button is pressed.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

/**
 * Rich text editor emitting sanitized HTML. Basic formatting only
 * (bold/italic/underline, bullet/numbered lists, links, quote/heading).
 */
export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Write your story…",
  disabled,
  minHeight = 200,
  className,
  id,
}: RichTextEditorProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = React.useState(!value);

  // Sync external value → DOM only when it differs, so we don't reset the caret
  // while the user is typing (the editor is the source of truth during input).
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value ?? "";
      setIsEmpty(!el.textContent?.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const clean = sanitizeHtml(el.innerHTML);
    setIsEmpty(!el.textContent?.trim());
    onChange?.(clean);
  }, [onChange]);

  const exec = (command: string, arg?: string) => {
    if (disabled) return;
    ref.current?.focus();
    // execCommand is deprecated but remains the pragmatic choice for a
    // lightweight editor without pulling in a large dependency.
    document.execCommand(command, false, arg);
    emit();
  };

  const handleLink = () => {
    if (disabled) return;
    const url = window.prompt("Enter a URL (https://…)");
    if (!url) return;
    const safe = url.trim();
    if (!/^(https?:|mailto:)/i.test(safe)) {
      window.alert("Please enter a valid http(s) or mailto URL.");
      return;
    }
    exec("createLink", safe);
  };

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "opacity-60",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-2 py-1">
        <ToolbarButton label="Bold" icon={Bold} disabled={disabled} onClick={() => exec("bold")} />
        <ToolbarButton label="Italic" icon={Italic} disabled={disabled} onClick={() => exec("italic")} />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <ToolbarButton
          label="Bulleted list"
          icon={List}
          disabled={disabled}
          onClick={() => exec("insertUnorderedList")}
        />
        <ToolbarButton
          label="Numbered list"
          icon={ListOrdered}
          disabled={disabled}
          onClick={() => exec("insertOrderedList")}
        />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <ToolbarButton label="Insert link" icon={LinkIcon} disabled={disabled} onClick={handleLink} />
        <ToolbarButton label="Undo" icon={Undo} disabled={disabled} onClick={() => exec("undo")} />
      </div>

      {/* Editable surface */}
      <div className="relative">
        {isEmpty ? (
          <span
            className="pointer-events-none absolute left-3 top-3 text-sm text-muted-foreground"
            aria-hidden="true"
          >
            {placeholder}
          </span>
        ) : null}
        <div
          id={id}
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          style={{ minHeight }}
          className={cn(
            "prose prose-sm max-w-none px-3 py-3 text-sm text-foreground outline-none",
            "[&_a]:text-primary [&_a]:underline",
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
            disabled && "cursor-not-allowed"
          )}
        />
      </div>
    </div>
  );
}

export default RichTextEditor;
