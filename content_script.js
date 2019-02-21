var signKeyStr;
var changeNo = 0;

function changeSelection() {
  var focused = document.activeElement;
  var selectedText;
  var newText;    
  if (focused) {
    try {
      selectedText = focused.value.substring(
          focused.selectionStart, focused.selectionEnd);
    } catch (err) {}
  	
	if (selectedText !== undefined)		
		chrome.extension.sendRequest({'sign': selectedText}, 
			function (text) {  								
				if (text !== undefined){
					focused.value = focused.value.replace(selectedText, text);
				}				
			}
		);	
  } else {
    var sel = window.getSelection();
    var selectedText = sel.toString();
	alert(selectedText);
  }
 
	
}

function onExtensionMessage(request) {	
  if (request['changeSelection'] != undefined) {
    if (!document.hasFocus()) {
      return;
    }
    changeSelection();
  } else if (request['key'] != undefined) {
    signKeyStr = request['key'];
  }
}

function initContentScript() {
  chrome.extension.onRequest.addListener(onExtensionMessage);
  chrome.extension.sendRequest({'init': true}, onExtensionMessage);

  document.addEventListener('keydown', function(evt) {	  
	  
    if (!document.hasFocus()) {
      return true;
    }
    var keyStr = keyEventToString(evt);	
    if (keyStr == signKeyStr && signKeyStr.length > 0) {		
      changeSelection();
      evt.stopPropagation();
      evt.preventDefault();
      return false;
    }
    return true;
  }, false);
}

initContentScript();
