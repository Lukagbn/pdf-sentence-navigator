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

function highlightSentenceAt(index) {
  if (currentIndex >= 0 && allSentences[currentIndex]) {
    allSentences[currentIndex].forEach((span) =>
      span.classList.remove("sentence-highlight"),
    );
  }

  index = Math.max(0, Math.min(index, allSentences.length - 1));
  currentIndex = index;

  const spans = allSentences[currentIndex];
  spans.forEach((span) => span.classList.add("sentence-highlight"));

  spans[0].scrollIntoView({ block: "center", behavior: "smooth" });
}

function moveToNextSentence() {
  if (allSentences.length === 0) return;
  highlightSentenceAt(currentIndex + 1);
}

function moveToPreviousSentence() {
  if (allSentences.length === 0) return;
  highlightSentenceAt(currentIndex - 1);
}

function handleKeydown(e) {
  if (e.key !== "Tab") return;

  e.preventDefault();

  if (e.shiftKey) {
    moveToPreviousSentence();
  } else {
    moveToNextSentence();
  }
}

async function main() {
  const statusEl = document.getElementById("status");
  const pagesContainer = document.getElementById("pages");

  const fileUrl = getFileUrlFromQuery();
  if (!fileUrl) {
    statusEl.textContent =
      "PDF ფაილის მისამართი ვერ მოიძებნა (აკლია ?file= პარამეტრი URL-ში).";
    return;
  }

  let pdfBytes;
  try {
    pdfBytes = await fetchPdfBytes(fileUrl);
  } catch (err) {
    statusEl.textContent = "შეცდომა PDF-ის ჩატვირთვისას: " + err.message;
    console.error(err);
    return;
  }

  const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    statusEl.textContent = `მუშავდება გვერდი ${pageNum} / ${pdf.numPages}...`;

    const page = await pdf.getPage(pageNum);

    const viewport = page.getViewport({ scale: 1.5 });

    const pageDiv = document.createElement("div");
    pageDiv.className = "page";
    pageDiv.style.width = `${viewport.width}px`;
    pageDiv.style.height = `${viewport.height}px`;

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const textLayerDiv = document.createElement("div");
    textLayerDiv.className = "textLayer";
    textLayerDiv.style.width = `${viewport.width}px`;
    textLayerDiv.style.height = `${viewport.height}px`;

    pageDiv.appendChild(canvas);
    pageDiv.appendChild(textLayerDiv);
    pagesContainer.appendChild(pageDiv);

    await page.render({ canvasContext: canvas.getContext("2d"), viewport })
      .promise;

    const textContent = await page.getTextContent();

    const spans = buildTextLayerForPage(textContent, viewport, textLayerDiv);

    const pageSentences = groupItemsIntoSentences(textContent.items, spans);
    allSentences.push(...pageSentences);
  }

  statusEl.textContent =
    `მზადაა — ${pdf.numPages} გვერდი, ${allSentences.length} წინადადება. ` +
    `გამოიყენე Tab (შემდეგი) და Shift+Tab (წინა).`;

  if (allSentences.length > 0) {
    highlightSentenceAt(0);
  }
}

document.addEventListener("keydown", handleKeydown);

main();
