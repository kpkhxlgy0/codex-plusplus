export function appendSvgHtml(parent: HTMLElement, svg: string): void {
  const el = svgElement(svg);
  if (el) parent.appendChild(el);
}

export function svgElement(svg: string): Element | null {
  const template = document.createElement("template");
  template.innerHTML = svg.trim();
  const el = template.content.firstElementChild;
  if (!el || el.tagName.toLowerCase() !== "svg") return null;
  return el;
}
