var signKeyStr;
var changeNo = 0;

function doSign() {
  var rsa = new RSAKey();
  rsa.readPrivateKeyFromPEMString(document.form1.prvkey1.value);
  var hashAlg = document.form1.hashalg.value;
  var hSig = rsa.sign(document.form1.msgsigned.value, hashAlg);
  document.form1.siggenerated.value = linebrk(hSig, 64);
}

function changeSelection() {
  var focused = document.activeElement;
  var selectedText;
  var newText;
  //alert('elem:' + document.activeElement.innerHTML);
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
		)
   else {	    
		var sel = window.getSelection();
		var selectedText = sel.toString();

		chrome.extension.sendRequest({'sign': selectedText}, 
					function (text) {  								
						if (text !== undefined){
							//alert('else:' + text);
							if (sel.rangeCount) {
								range = sel.getRangeAt(0);
								range.deleteContents();
								range.insertNode(document.createTextNode(text));
							}							
						}				
					}
				);		
  	}
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

function onKeyDown(evt) {	  	  
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
}

function checkForNewIframe(doc) {
    if (!doc) return; // document does not exist. Cya

    // Note: It is important to use "true", to bind events to the capturing
    // phase. If omitted or set to false, the event listener will be bound
    // to the bubbling phase, where the event is not visible any more when
    // Gmail calls event.stopPropagation().
    // Calling addEventListener with the same arguments multiple times bind
    // the listener only once, so we don't have to set a guard for that.
    doc.addEventListener('keydown', onKeyDown, true);    
    doc.hasSeenDocument = true;
    for (var i = 0, contentDocument; i<frames.length; i++) {
        try {
            contentDocument = iframes[i].document;
        } catch (e) {
            continue; // Same-origin policy violation?
        }
        if (contentDocument && !contentDocument.hasSeenDocument) {
            // Add poller to the new iframe
            checkForNewIframe(iframes[i].contentDocument);
        }
    }
    setTimeout(checkForNewIframe, 250, doc); // <-- delay of 1/4 second
}

function initContentScript() {
  chrome.extension.onRequest.addListener(onExtensionMessage);
  chrome.extension.sendRequest({'init': true}, onExtensionMessage);
  checkForNewIframe(document);
}

initContentScript();

