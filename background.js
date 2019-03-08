var lastSelection = '';
var globalUtteranceIndex = 0;

if (localStorage['lastVersionUsed'] != '1') {
  localStorage['lastVersionUsed'] = '1';
  chrome.tabs.create({
    url: chrome.extension.getURL('options.html')
  });
}

function sign(selection, sendResponse) {
  if (selection == lastSelection) {
    return;
  }
  lastSelection = selection;

  var signed;
  var encodedText;
  //alert('selection:' + selection);
  
  //alert('key:' + window.localStorage.getItem('pkey'));
//   chrome.storage.sync.get({
//     pkey: '',
//   }, function(items) {
    // signed = doSign(selection,items.pkey);
	// alert('signed:' + signed);
	// encodedText = selection + '#Fileproof \n' + signed + '\n #Fileproof';
//   });
    
	signed = doSign(selection,window.localStorage.getItem('pkey'));
	//alert('signed:' + signed);
	
	encodedText = selection + '\n \n #Fileproof \n' + signed + '\n #Fileproof';  
	alert('encoded: ' + encodedText);
	callApiVote(encodedText, sendResponse);	
}

function callApiVote(text, sendResponse) 
{
	var url = "http://cvproof-prototype.azurewebsites.net/Ballot/Vote?par=0";
	var debugurl = "http://localhost:14733/Ballot/Vote?par=0"

	var xhr = new XMLHttpRequest();

	xhr.open("GET", debugurl);
	xhr.onreadystatechange = function() {		
  		if (xhr.readyState == 4) {  
			alert("onreadystatechange, readyState=" + xhr.readyState + ", responseText = " + xhr.responseText);	  				
			let msg = text + '\n #returned \n' + xhr.responseText + '\n #returned';
    		sendResponse(msg);
  		}
	}

	xhr.send();	
}

function doSign(message, key) {
  var rsa = new RSAKey();
  rsa.readPrivateKeyFromPEMString(key);
  var hashAlg = "sha256";
  var hSig = rsa.sign(message, hashAlg);
  return linebrk(hSig, 64);
}
//PKCS#1 and PKCS#8 (Public-Key Cryptography Standard) are simply standards that govern the use of particular cryptographic primitives, padding etc. Both define file formats that are used to store keys, certificates and other relevant information.

//PEM and DER are a little bit more interesting. DER is just ASN.1 encoding for keys and certificates etc., which you'll be able to Google plenty about. Private keys and certificates are encoded using DER and can be saved directly like this. However, these files are binary and can't be copied and pasted easily, so many (if not most?) implementations accept PEM encoded files also. PEM is basically just base64 encoded DER. We add a header, optional meta-data, and the base64 encoded DER data and we have a PEM file.

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
		  sign(request['sign'], sendResponse)		  
        }
		return true;
      });

  chrome.browserAction.onClicked.addListener(
      function(tab) {
        chrome.tabs.sendRequest(
            tab.id,
            {'changeSelection': true});
      });
}

initBackground();
