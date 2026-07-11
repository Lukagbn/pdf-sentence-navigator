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
