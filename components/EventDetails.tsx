"use client";

import {
  Fragment,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Paperclip,
  Phone,
  Video,
} from "lucide-react";
import type { CalendarEvent } from "@/types/calendar";

/*
 * La descripción de un evento la escribe cualquiera que te invite, así que es
 * contenido no confiable. Nunca se inyecta como HTML: se analiza con
 * DOMParser (documento inerte, no ejecuta scripts ni carga recursos) y se
 * reconstruye con elementos React de una lista blanca. Los enlaces sólo se
 * aceptan con protocolos seguros.
 */

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function safeHref(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(/^www\./i.test(value) ? `https://${value}` : value);
    return SAFE_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;

/** Quita la puntuación final que no forma parte de la URL ("…/abc)." → "…/abc"). */
function trimUrl(raw: string) {
  let url = raw;
  while (/[.,;:!?'"»\]}>)]$/.test(url)) {
    const open = url.split("(").length - 1;
    const close = url.split(")").length - 1;
    if (url.endsWith(")") && open >= close) break;
    url = url.slice(0, -1);
  }
  return url;
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 decoration-blue-400/40"
    >
      {children}
    </a>
  );
}

/** Convierte las URLs sueltas de un texto en enlaces. */
function linkify(text: string, key: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    const url = trimUrl(match[0]);
    const href = safeHref(url);
    if (!href) continue;

    if (start > last) nodes.push(text.slice(last, start));
    nodes.push(
      <ExternalLink key={`${key}-${start}`} href={href}>
        {url}
      </ExternalLink>,
    );
    last = start + url.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

// Etiquetas que se descartan con todo su contenido.
const DROPPED_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "template",
  "noscript",
  "svg",
  "math",
  "img",
  "picture",
  "video",
  "audio",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "head",
  "title",
  "meta",
  "link",
]);

const BLOCK_TAGS = new Set([
  "p",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "tr",
  "table",
]);

function renderChildren(parent: Node, key: string): ReactNode[] {
  return Array.from(parent.childNodes).map((child, i) =>
    renderNode(child, `${key}.${i}`),
  );
}

function renderList(el: Element, key: string, ordered: boolean) {
  // Sólo <li> dentro de listas; el resto de nodos con texto se envuelve.
  const items = Array.from(el.childNodes).flatMap((child, i) => {
    const childKey = `${key}.${i}`;
    if (child.nodeType === ELEMENT_NODE && (child as Element).tagName === "LI") {
      return [renderNode(child, childKey)];
    }
    if (!child.textContent?.trim()) return [];
    return [<li key={childKey}>{renderNode(child, childKey)}</li>];
  });

  return ordered ? (
    <ol key={key} className="list-decimal pl-5 space-y-0.5">
      {items}
    </ol>
  ) : (
    <ul key={key} className="list-disc pl-5 space-y-0.5">
      {items}
    </ul>
  );
}

function renderNode(node: Node, key: string): ReactNode {
  if (node.nodeType === TEXT_NODE) {
    return <Fragment key={key}>{linkify(node.textContent ?? "", key)}</Fragment>;
  }
  if (node.nodeType !== ELEMENT_NODE) return null;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (DROPPED_TAGS.has(tag)) return null;

  switch (tag) {
    case "br":
      return <br key={key} />;
    case "hr":
      return <hr key={key} className="border-neutral-700 my-1" />;
    case "a": {
      const href = safeHref(el.getAttribute("href"));
      const text = el.textContent?.trim();
      if (!href) return <Fragment key={key}>{linkify(text ?? "", key)}</Fragment>;
      return (
        <ExternalLink key={key} href={href}>
          {text || href}
        </ExternalLink>
      );
    }
    case "ul":
      return renderList(el, key, false);
    case "ol":
      return renderList(el, key, true);
    case "li":
      return <li key={key}>{renderChildren(el, key)}</li>;
    case "b":
    case "strong":
      return (
        <strong key={key} className="font-semibold text-gray-300">
          {renderChildren(el, key)}
        </strong>
      );
    case "i":
    case "em":
      return <em key={key}>{renderChildren(el, key)}</em>;
    case "u":
      return <u key={key}>{renderChildren(el, key)}</u>;
    case "s":
    case "strike":
    case "del":
      return <s key={key}>{renderChildren(el, key)}</s>;
    case "code":
      return (
        <code key={key} className="font-mono text-[0.85em] text-rose-200">
          {renderChildren(el, key)}
        </code>
      );
    default:
      if (BLOCK_TAGS.has(tag)) {
        return <div key={key}>{renderChildren(el, key)}</div>;
      }
      // span, font, html-blob, td…: se conserva sólo el contenido.
      return <Fragment key={key}>{renderChildren(el, key)}</Fragment>;
  }
}

const HTML_TAG =
  /<\/?(?:a|b|br|p|div|span|ul|ol|li|i|em|strong|u|s|font|html-blob|h[1-6]|table|tr|td|hr|code|pre|blockquote)\b[^>]*>/i;
const BLOCK_MARKUP = /<(?:br|p|div|li|tr|h[1-6])\b/i;

function renderDescription(description: string): {
  content: ReactNode;
  preserveLineBreaks: boolean;
} {
  const isHtml = HTML_TAG.test(description);

  if (!isHtml || typeof DOMParser === "undefined") {
    return { content: linkify(description, "d"), preserveLineBreaks: true };
  }

  const doc = new DOMParser().parseFromString(description, "text/html");
  return {
    content: renderChildren(doc.body, "d"),
    // HTML sin <br>/<p> pero con saltos de línea (p. ej. texto plano con un
    // único <a>): se respetan los saltos como lo hace Google Calendar.
    preserveLineBreaks: !BLOCK_MARKUP.test(description),
  };
}

function isLongDescription(description: string) {
  const breaks = description.match(/\n|<br|<p\b|<li\b|<div\b/gi)?.length ?? 0;
  return description.length > 500 || breaks > 8;
}

const noopSubscribe = () => () => {};

export default function EventDetails({ event }: { event: CalendarEvent }) {
  const [expanded, setExpanded] = useState(false);
  // DOMParser sólo existe en el navegador: en el servidor no se pinta la
  // descripción para que la hidratación coincida.
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const description = useMemo(
    () =>
      isClient && event.description
        ? renderDescription(event.description)
        : null,
    [isClient, event.description],
  );
  const isLong = !!event.description && isLongDescription(event.description);

  const meetHref = safeHref(event.meetLink);
  const phoneHref = safeHref(event.phone?.uri);
  const attachments = (event.attachments ?? []).flatMap((a) => {
    const href = safeHref(a.fileUrl);
    return href ? [{ href, title: a.title || "Archivo adjunto" }] : [];
  });

  const hasDetails =
    meetHref || phoneHref || event.location || description || attachments.length;
  if (!hasDetails) return null;

  return (
    <div className="mt-2 space-y-2 text-sm text-gray-400 wrap-anywhere">
      {(meetHref || phoneHref) && (
        <div className="flex flex-wrap items-center gap-2">
          {meetHref && (
            <a
              href={meetHref}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/20 px-2.5 py-1 text-xs font-medium text-blue-300 hover:bg-blue-600/30 transition-colors"
            >
              <Video className="w-3.5 h-3.5" />
              {event.conferenceName
                ? `Unirse a ${event.conferenceName}`
                : "Unirse a la reunión"}
            </a>
          )}
          {phoneHref && event.phone && (
            <a
              href={phoneHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-700/50 px-2.5 py-1 text-xs text-gray-300 hover:bg-neutral-700 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              {event.phone.label || event.phone.uri.replace(/^tel:/, "")}
              {event.phone.pin && ` · PIN ${event.phone.pin}`}
            </a>
          )}
        </div>
      )}

      {event.location && (
        <p className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
          <span>{linkify(event.location, "loc")}</span>
        </p>
      )}

      {description && (
        <div>
          <div
            className={`leading-relaxed ${description.preserveLineBreaks ? "whitespace-pre-line" : ""} ${isLong && !expanded ? "max-h-40 overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]" : ""}`}
          >
            {description.content}
          </div>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  Ver menos <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Ver más <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((a) => (
            <li key={a.href} className="flex items-start gap-1.5">
              <Paperclip className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-500" />
              <ExternalLink href={a.href}>{a.title}</ExternalLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
