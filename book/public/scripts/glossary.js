const glossaryTerms = [
  { id: 'glossary-term-acceptance-time', terms: ['acceptance time'] },
  { id: 'glossary-term-auto-scan', terms: ['auto-scan', 'auto scan', 'autoscan'] },
  { id: 'glossary-term-continuous-scan', terms: ['continuous scanning', 'continuous scan'] },
  { id: 'glossary-term-critical-overscan', terms: ['critical overscan'] },
  { id: 'glossary-term-directed-scan', terms: ['directed scanning', 'directed scan'] },
  { id: 'glossary-term-dwell-time', terms: ['dwell time'] },
  { id: 'glossary-term-elimination-scan', terms: ['elimination scanning', 'elimination scan'] },
  { id: 'glossary-term-group-scan', terms: ['group scan', 'group scanning'] },
  { id: 'glossary-term-input-bandwidth', terms: ['input bandwidth'] },
  { id: 'glossary-term-row-column', terms: ['row-column scanning', 'row column scanning', 'row-column', 'row column'] },
  { id: 'glossary-term-scan-rate', terms: ['scan rate'] },
  { id: 'glossary-term-selection-set', terms: ['selection set'] },
  { id: 'glossary-term-step-scan', terms: ['step scan', 'step scanning'] }
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const skipTags = new Set(['A', 'CODE', 'PRE', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'BUTTON', 'SUMMARY', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

const linkGlossaryTerms = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (skipTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest('#appendix-glossary')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const text = node.nodeValue;
    let cursor = 0;
    const fragment = document.createDocumentFragment();
    let replaced = false;

    while (cursor < text.length) {
      let bestMatch = null;
      glossaryTerms.forEach((entry) => {
        entry.terms.forEach((term) => {
          const regex = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
          const match = regex.exec(text.slice(cursor));
          if (match) {
            const index = cursor + match.index;
            if (!bestMatch || index < bestMatch.index) {
              bestMatch = {
                index,
                length: match[0].length,
                text: match[0],
                id: entry.id
              };
            }
          }
        });
      });

      if (!bestMatch) {
        fragment.appendChild(document.createTextNode(text.slice(cursor)));
        break;
      }

      if (bestMatch.index > cursor) {
        fragment.appendChild(document.createTextNode(text.slice(cursor, bestMatch.index)));
      }

      const link = document.createElement('a');
      link.href = `#${bestMatch.id}`;
      link.className = 'glossary-link';
      link.textContent = bestMatch.text;
      fragment.appendChild(link);
      cursor = bestMatch.index + bestMatch.length;
      replaced = true;
    }

    if (replaced) {
      node.parentNode.replaceChild(fragment, node);
    }
  });
};

window.addEventListener('DOMContentLoaded', () => {
  linkGlossaryTerms(document.body);
});
