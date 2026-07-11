const PDF_URL_PATTERN = /\.pdf(\?.*)?(#.*)?$/i;

function isPdfUrl(url) {
  if (!url) return false;

  if (url.startsWith(chrome.runtime.getURL(""))) return false;

  return PDF_URL_PATTERN.test(url);
}

function redirectTabToViewer(tabId, originalPdfUrl) {
  const viewerUrl =
    chrome.runtime.getURL("viewer.html") +
    "?file=" +
    encodeURIComponent(originalPdfUrl);

  chrome.tabs.update(tabId, { url: viewerUrl });
}
