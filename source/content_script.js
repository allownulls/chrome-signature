var notarizeKeyStr;
var checkKeyStr;
var changeNo = 0;

// function doSign() {
// 	var rsa = new RSAKey();
// 	rsa.readPrivateKeyFromPEMString(document.form1.prvkey1.value);
// 	var hashAlg = document.form1.hashalg.value;
// 	var hSig = rsa.sign(document.form1.msgsigned.value, hashAlg);
// 	document.form1.siggenerated.value = linebrk(hSig, 64);
// }

function changeSelection() {	
	//console.log('sign');
	var focused = document.activeElement;
	var selectedText;
	if (focused) {
		try {
			selectedText = focused.value.substring(
				focused.selectionStart, focused.selectionEnd);
		} catch (err) {}

		if (selectedText !== undefined)		
			chrome.extension.sendRequest({'notarize': selectedText}, 
				function (text) {  								
					if (text !== undefined){
						focused.value = focused.value.replace(selectedText, text);
					}				
				}
			)
		else {	    
			var sel = window.getSelection();
			var selectedText = sel.toString();

			chrome.extension.sendRequest({'notarize': selectedText}, 
						function (text) {  								
							if (text !== undefined){								
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

function checkSelection() {
	//console.log('check');
	var focused = document.activeElement;
	var selectedText;
	if (focused) {
		try {
			selectedText = focused.value.substring(
				focused.selectionStart, focused.selectionEnd);
		} catch (err) {}

		if (selectedText !== undefined)		
			chrome.extension.sendRequest({'check': selectedText}, 
						function (response) {     //xxxx put result indication in this callback								
							var resp = JSON.parse(response);
							if (resp.check){ alert('Signature check passed!'); }
							else { alert('Signature check failed!\n (Parsing status: ' + resp.status + ')'); }
						}
			)
		else {	    
			var sel = window.getSelection();
			var selectedText = sel.toString();

			chrome.extension.sendRequest({'check': selectedText}, 
						function (response) {     //xxxx put result indication in this callback								
							var resp = JSON.parse(response);
							if (resp.check){ alert('Signature check passed!'); }
							else { alert('Signature check failed!\n (Parsing status: ' + resp.status + ')'); }
						}
		);		
		}
	}	
}

function onExtensionMessage(request) {	  
  if (request['changeSelection'] != undefined) {
    if (!document.hasFocus()) return;    
    //changeSelection();
  } else if (request['notarizeKey'] != undefined && request['checkKey'] != undefined) 
  {
	notarizeKeyStr = request['notarizeKey'];
	checkKeyStr = request['checkKey'];
  } 
      
	//   alert('onExtensionMessage ( request[init]: ' + request['init'] + ' \n'
	// 		  + 'request[notarizeKey]: ' + request['notarizeKey'] + ' \n' 
	// 		  + 'request[checkKey]: ' + request['checkKey'] + ' \n'
	//   		  + ')\n notarizeKeyStr: ' + notarizeKeyStr 
	// 		  + '\n checkKeyStr: ' + checkKeyStr);
}

function onKeyDown(evt) {	  	  	
	if (!document.hasFocus()) {
      return true;
    }
	var keyStr = keyEventToString(evt);		
    if (keyStr == notarizeKeyStr && notarizeKeyStr.length > 0) {		
		//alert('Keypressed: ' + keyStr);
		changeSelection();
		evt.stopPropagation();
		evt.preventDefault();
		return false;
	}
	if (keyStr == checkKeyStr && checkKeyStr.length > 0) {
		//alert('Keypressed: ' + keyStr);
		checkSelection();
		evt.stopPropagation();
		evt.preventDefault();
		return false;
	  }
    return true;
}

function checkForNewIframe(doc) {
    if (!doc) return; // document does not exist.

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
	console.log('content-load');
	chrome.extension.onRequest.addListener(onExtensionMessage);
	chrome.extension.sendRequest({'init': true}, onExtensionMessage);
	checkForNewIframe(document);
	console.log('content-load-finish');
}

initContentScript();

