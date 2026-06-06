"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendSvgHtml = appendSvgHtml;
exports.svgElement = svgElement;
function appendSvgHtml(parent, svg) {
    const el = svgElement(svg);
    if (el)
        parent.appendChild(el);
}
function svgElement(svg) {
    const template = document.createElement("template");
    template.innerHTML = svg.trim();
    const el = template.content.firstElementChild;
    if (!el || el.tagName.toLowerCase() !== "svg")
        return null;
    return el;
}
//# sourceMappingURL=settings-svg.js.map