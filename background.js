var isExtensionOn = true;

chrome.extension.onMessage.addListener(function (
  request,
  sender,
  sendResponse
) {
  if (request.cmd == "setOnOffState") {
    isExtensionOn = request.data.value;
  }

  if (request.cmd == "getOnOffState") {
    sendResponse(isExtensionOn);
  }
});
