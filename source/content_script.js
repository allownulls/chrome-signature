var notarizeKeyStr;
var checkKeyStr;
var changeNo = 0;

function textToClipboard (text) {	
	if (window.location.protocol === 'https:')
		navigator.clipboard.writeText(text)
	else {
        var dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = text;
        dummy.select();
	    document.execCommand("copy");	
		document.body.removeChild(dummy);
	}	
}

function changeSelectionClip() {
	var focused = document.activeElement;
	var selectedText;
	if (focused) {
		try { 
			selectedText = focused.value.substring(focused.selectionStart, focused.selectionEnd);
		} 
		catch (err) {}

		if (selectedText == undefined)
			selectedText = window.getSelection().toString();

		chrome.extension.sendRequest({'notarize': selectedText}, 
			function (text) { if (text !== undefined) { textToClipboard(text); } })
	}	
}

function checkSelection() {	
	var focused = document.activeElement;
	var selectedText;
	if (focused) {
		try { 
			selectedText = focused.value.substring(focused.selectionStart, focused.selectionEnd);
		} 
		catch (err) {}

		if (selectedText == undefined)					
			selectedText = window.getSelection().toString();

		chrome.extension.sendRequest({'check': selectedText})
	}	
}

function onExtensionMessage(request) {	
	if (request['changeSelectionClip'] != undefined){
		if (!document.hasFocus()) 
			return;
	} else if (request['notarizeKey'] != undefined && request['checkKey'] != undefined) {
			notarizeKeyStr = request['notarizeKey'];
			checkKeyStr = request['checkKey'];
		} 
	
}

function onKeyDown(evt) {	  	  			
	if (!document.hasFocus())
      return true;
    
	var keyStr = keyEventToString(evt);		
	
    if (keyStr == notarizeKeyStr && notarizeKeyStr.length > 0) {		
		changeSelectionClip();
		evt.stopPropagation();
		evt.preventDefault();
		return false;
	}
	if (keyStr == checkKeyStr && checkKeyStr.length > 0) {		
		checkSelection();
		evt.stopPropagation();
		evt.preventDefault();
		return false;
	}	
	return true;
}

function onClickIcon()
{
	chrome.windows.create({'url': 'pop.html', 'type': 'popup'}, function(window) {});
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
	chrome.extension.onRequest.addListener(onExtensionMessage);
	chrome.extension.sendRequest({'init': true}, onExtensionMessage);
	checkForNewIframe(document);
}

initContentScript();

