import { parse, type HTMLElement } from "node-html-parser";
import { sanitizeUrl } from "../_shared/html.js";
import { normalizeText } from "../_shared/parse.js";
import {
  BASE_URL,
  isListingUrl,
  isProgramHost,
  PROGRAM_PAGE_URL,
} from "./constants.js";
import type { RawListing } from "./types.js";

function textOf(element: { textContent: string } | null | undefined): string {
  return element ? normalizeText(element.textContent) : "";
}

function hasClass(element: HTMLElement, name: string): boolean {
  return (element.getAttribute("class") ?? "").split(/\s+/).includes(name);
}

function actionFromEnlaces(enlaces: HTMLElement | null): {
  actionText: string;
  buyUrl: string;
  infoUrl: string;
} {
  if (!enlaces) return { actionText: "", buyUrl: "", infoUrl: "" };

  const infoLink = enlaces.querySelector("a.mas-info");
  const infoUrl = (infoLink?.getAttribute("href") ?? "").trim();

  for (const anchor of enlaces.querySelectorAll("a")) {
    if (hasClass(anchor, "mas-info")) continue;
    if (textOf(anchor).toLowerCase() === "comprar") {
      return {
        actionText: "Comprar",
        buyUrl: (anchor.getAttribute("href") ?? "").trim(),
        infoUrl,
      };
    }
  }

  for (const span of enlaces.querySelectorAll("span")) {
    const text = textOf(span);
    const lower = text.toLowerCase();
    if (
      text === "Agotado" ||
      lower.includes("agotado") ||
      lower.includes("proximamente") ||
      lower.includes("próximamente")
    ) {
      return { actionText: text, buyUrl: "", infoUrl };
    }
  }

  const text = textOf(enlaces);
  const lower = text.toLowerCase();
  if (lower.includes("agotado")) return { actionText: "Agotado", buyUrl: "", infoUrl };
  if (lower.includes("proximamente") || lower.includes("próximamente")) {
    return { actionText: "Próximamente", buyUrl: "", infoUrl };
  }

  return { actionText: "", buyUrl: "", infoUrl };
}

export function parseListingHtml(html: string): RawListing[] {
  const root = parse(html);
  const containers = root.querySelectorAll("[data-fecha]");
  const listings: RawListing[] = [];

  for (const container of containers) {
    const item = container.querySelector(".producto.row");
    if (!item) continue;

    const title = textOf(item.querySelector("h2.titulo"));
    if (!title) continue;

    const action = actionFromEnlaces(item.querySelector(".enlaces"));
    if (!action.actionText) continue;

    listings.push({
      fecha: (container.getAttribute("data-fecha") ?? "").trim(),
      category: textOf(container.querySelector(".categoria .font-bold")),
      title,
      director: textOf(item.querySelector("h3.subtitulo")),
      description: textOf(item.querySelector(".descripcion")),
      actionText: action.actionText,
      buyUrl: action.buyUrl,
      infoUrl: action.infoUrl,
    });
  }

  return listings;
}

export function parseNextPageUrl(html: string, currentPage: number): string | null {
  const root = parse(html);
  const target = String(currentPage + 1);
  const targetPattern = new RegExp(`[?&]pagina=${target}(?:&|$)`);

  for (const link of root.querySelectorAll(".pagination a")) {
    const href = (link.getAttribute("href") ?? "").trim();
    if (!href) continue;

    const text = textOf(link);
    if (text !== target && !targetPattern.test(href)) continue;

    try {
      const next = new URL(href, BASE_URL);
      if (!isListingUrl(next)) return null;
      return sanitizeUrl(next.href) ?? null;
    } catch {
      return null;
    }
  }

  return null;
}

export function parseProgramUrl(html: string): string {
  const root = parse(html);
  let fallback: string | undefined;

  for (const link of root.querySelectorAll("a")) {
    const href = (link.getAttribute("href") ?? "").trim();
    if (!href.includes(".pdf")) continue;

    let absolute: string | undefined;
    try {
      const program = new URL(href, PROGRAM_PAGE_URL);
      if (!isProgramHost(program.hostname)) continue;
      absolute = sanitizeUrl(program.href);
    } catch {
      continue;
    }
    if (!absolute) continue;

    fallback ??= absolute;
    const text = textOf(link).toLowerCase();
    const alt = (link.querySelector("img")?.getAttribute("alt") ?? "").toLowerCase();
    if (text.includes("programa") || alt.includes("programa")) {
      return absolute;
    }
  }

  return fallback ?? PROGRAM_PAGE_URL;
}
