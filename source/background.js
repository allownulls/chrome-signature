var lastSignSelection = '';
var lastCheckSelection = '';
var globalUtteranceIndex = 0;
//let domain = "http://cvproof-prototype.azurewebsites.net";	
let domain = "http://localhost:14733";	

if (localStorage['lastVersionUsed'] != '1') {
  localStorage['lastVersionUsed'] = '1';
  chrome.tabs.create({
    url: chrome.extension.getURL('options.html')
  });
}

function sign(selection, sendResponse) {
	if (selection == lastSignSelection) {
		return;
	}
	lastSelection = selection;

	let pkey = "-----BEGIN RSA PRIVATE KEY-----\n" + window.localStorage.getItem('pkey') + "\n-----END RSA PRIVATE KEY-----";	
	let signed = doSign(selection,pkey);	
	let encodedText = selection + '\n \n #Fileproof \n' + signed + '\n pubkey:' + window.localStorage.getItem('pubkey') + '\n #Fileproof';  
	
	callApiSign(encodedText, sendResponse);	
}

function check(selection, sendResponse) {	
	if (selection == lastCheckSelection) {
		return;
	}
	lastSelection = selection;

	//xxxx to add here:
	//before checking the selection has to be parsed into following parts:
	// 1. text
	// 2. signature
	// 3. key/id
	// (todo: parse on client, check signature, send request to find a key)

	callApiCheck(selection, sendResponse);
}

function callApiCheck(text, sendResponse) 
{	    
	var url = domain + "/Ballot/CheckMessage?msg="+ encodeURIComponent(text);
	
	//alert('sending request: ' + url);

	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.onreadystatechange = function() {		
  		if (xhr.readyState == 4) {  
			//resp = JSON.parse(xhr.response);
			//alert("Check ok! \n check: " + resp.check + "\n status: " + resp.status);

			
			sendResponse(xhr.response);
  		}
	}

	xhr.send();		
}

function callApiSign(text, sendResponse) 
{	
	var url = domain + "/Ballot/SignMessage?pubkey=" + encodeURIComponent(window.localStorage.getItem('pubkey')) + "&msg="+ encodeURIComponent(text);	
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.onreadystatechange = function() {		
  		if (xhr.readyState == 4) {			  
			var resp = JSON.parse(xhr.response);
		    //alert("Check ok! \n sign: " + resp.signed + "\n status: " + resp.status);						
    		sendResponse(resp.signed);
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
	console.log('initbg');	
	loadContentScriptInAllTabs();

	var notarizeKeyString = getNotarizeKeyString();		
	if (localStorage['notarizeKey'] == undefined) {
		localStorage['notarizeKey'] = notarizeKeyString;		
	}
	
	var checkKeyString = getCheckKeyString();
	if (localStorage['checkKey'] == undefined) {
		localStorage['checkKey'] = checkKeyString;	
	}	

	sendNotarizeKeyToAllTabs(notarizeKeyString);
	sendCheckKeyToAllTabs(checkKeyString);

	chrome.extension.onRequest.addListener(
		function(request, sender, sendResponse) {		
			if (request['init']) {			
				sendResponse({'notarizeKey': localStorage['notarizeKey'],'checkKey': localStorage['checkKey']});
				//sendResponse({'checkKey': localStorage['checkKey']});
			} else if (request['notarize']) {			
				sign(request['notarize'], sendResponse)		  
			}
			else if (request['check']) {			
				check(request['check'], sendResponse)		  
			}
			return true;
		}
	);

	chrome.browserAction.onClicked.addListener(
		function(tab) {
		chrome.tabs.sendRequest(
			tab.id,
			{'changeSelection': true});
		});

	//console.log('initbg-finish');	
}

initBackground();
