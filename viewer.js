import * as pdfjsLib from "./pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  chrome.runtime.getURL("pdf.worker.min.mjs");

let allSentences = [];

let currentIndex = -1;

function getFileUrlFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("file");
}

async function fetchPdfBytes(fileUrl) {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error("PDF ვერ ჩაიტვირთა");
  }

  return response.arrayBuffer();
}

function buildTextLayerForPage(textContent, viewport, containerEl) {
  const spans = [];

  textContent.items.forEach((item) => {
    if (!item.str) {
      spans.push(null);
      return;
    }

    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);

    const angle = Math.atan2(tx[1], tx[0]);
    const fontHeight = Math.hypot(tx[2], tx[3]);

    const span = document.createElement("span");
    span.textContent = item.str;
    span.style.left = `${tx[4]}px`;
    span.style.top = `${tx[5] - fontHeight}px`;
    span.style.fontSize = `${fontHeight}px`;
    span.style.fontFamily = "sans-serif";
    if (angle !== 0) {
      span.style.transform = `rotate(${angle}rad)`;
    }

    containerEl.appendChild(span);
    spans.push(span);
  });

  return spans;
}

function groupItemsIntoSentences(items, spans) {
  let fullText = "";

  const charToItemIndex = [];

  items.forEach((item, idx) => {
    const str = item.str || "";

    for (let k = 0; k < str.length; k++) {
      charToItemIndex.push(idx);
    }
    fullText += str;

    if (str && !/\s$/.test(str)) {
      fullText += " ";
      charToItemIndex.push(idx);
    }
  });

  const sentenceRegex = /[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g;

  const sentenceGroups = [];
  let match;
  while ((match = sentenceRegex.exec(fullText)) !== null) {
    if (!match[0].trim()) continue;

    const start = match.index;
    const end = start + match[0].length;

    const itemIndexSet = new Set();
    for (let c = start; c < end && c < charToItemIndex.length; c++) {
      itemIndexSet.add(charToItemIndex[c]);
    }

    const spansForThisSentence = [...itemIndexSet]
      .map((i) => spans[i])
      .filter(Boolean);

    if (spansForThisSentence.length > 0) {
      sentenceGroups.push(spansForThisSentence);
    }
  }

  return sentenceGroups;
}
