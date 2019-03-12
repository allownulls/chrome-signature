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

	let pkey = "-----BEGIN RSA PRIVATE KEY-----\n" + window.localStorage.getItem('pkey') + "\n-----END RSA PRIVATE KEY-----";	
	let signed = doSign(selection,pkey);	
	let encodedText = selection + '\n \n #Fileproof \n' + signed + '\n #Fileproof';  

	callApiVote(encodedText, sendResponse);
}

function callApiVote(text, sendResponse) 
{
	sendResponse(text);
    let domain = "http://cvproof-prototype.azurewebsites.net";	
	var url = domain + "/Ballot/VoteMessage?pubkey=" + encodeURIComponent(window.localStorage.getItem('pubkey')) + "&msg="+ encodeURIComponent(text);	
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.onreadystatechange = function() {		
  		if (xhr.readyState == 4) {  
			alert("Vote sent! status: " + xhr.responseText);
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
