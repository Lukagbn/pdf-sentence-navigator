const PDF_URL_PATTERN = /\.pdf(\?.*)?(#.*)?$/i;

function isPdfUrl(url) {
  if (!url) return false;

  if (url.startsWith(chrome.runtime.getURL(""))) return false;

  return PDF_URL_PATTERN.test(url);
}
