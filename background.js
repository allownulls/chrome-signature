var lastSelection = '';
var globalUtteranceIndex = 0;

if (localStorage['lastVersionUsed'] != '1') {
  localStorage['lastVersionUsed'] = '1';
  chrome.tabs.create({
    url: chrome.extension.getURL('options.html')
  });
}

function sign(selection) {
  if (selection == lastSelection) {
    return;
  }
  lastSelection = selection;

  var encodedText = '#Fileproof \n' + selection + '\n #Fileproof';
  
  return encodedText;
}

function initBackground() {
  loadContentScriptInAllTabs();

  var defaultKeyString = getDefaultKeyString();
  var keyString = localStorage['signKey'];
  if (keyString == undefined) {
    keyString = defaultKeyString;
    localStorage['signKey'] = keyString;
  }
  sendKeyToAllTabs(keyString);

  chrome.extension.onRequest.addListener(
      function(request, sender, sendResponse) {		
        if (request['init']) {			
          sendResponse({'key': localStorage['signKey']});
        } else if (request['sign']) {
		  var signed = sign(request['sign']);		  
          sendResponse(signed);
        }
      });

  chrome.browserAction.onClicked.addListener(
      function(tab) {
        chrome.tabs.sendRequest(
            tab.id,
            {'changeSelection': true});
      });
}

initBackground();
