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

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;

  if (isPdfUrl(details.url)) {
    redirectTabToViewer(details.tabId, details.url);
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (isPdfUrl(tab.url)) {
    redirectTabToViewer(tab.id, tab.url);
  } else {
    console.log("მიმდინარე გვერდი PDF არ არის:", tab.url);
  }
});
