var lastSignSelection = '';
var lastCheckSelection = '';
var globalUtteranceIndex = 0;
let domain = "http://cvproof-signature.azurewebsites.net"
//let domain = "http://localhost:14733";

if (localStorage['lastVersionUsed'] != '1') {
  localStorage['lastVersionUsed'] = '1';
  chrome.tabs.create({ url: chrome.extension.getURL('options.html') });
}

function sign(selection, sendResponse) {
	if (selection == lastSignSelection)
		return;	
	lastSelection = selection;

	sanitized = selection.match(/[\x21-\x7E\xA1-\xFF]/g).join("");
	
	let pkey = "-----BEGIN RSA PRIVATE KEY-----\n" + window.localStorage.getItem('pkey') + "\n-----END RSA PRIVATE KEY-----";	
	let signed = doSign(sanitized,pkey);	
	let encodedText = selection + '#Fileproof\n' + signed + '\npubkey:' + window.localStorage.getItem('pubkey') + '\n#Fileproof';  

	callApiSign(encodedText, sendResponse);	
}

function check(selection, sendResponse) {
	if (selection == lastCheckSelection)
		return;	
	lastSelection = selection;
	callApiCheck(selection, sendResponse);
}

function decrypt(cypher, sendResponse){ 
	let pkey = "-----BEGIN RSA PRIVATE KEY-----\n" + window.localStorage.getItem('pkey') + "\n-----END RSA PRIVATE KEY-----";	
	var ret = doDecrypt(cypher, pkey);	
	sendResponse(ret);
}

function callApiCheck(text, sendResponse) 
{	
  var url = domain + '/FingerprintApi/CheckMessage';
  var param = 'msg='+ encodeURIComponent(text);	

  var xhr = new XMLHttpRequest();
  xhr.open("POST", url);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');	
  xhr.onerror = function(e){
	  alert("Something went wrong. Server returned error.");
  };
  xhr.onreadystatechange = function() {		
    if (xhr.readyState == 4) {  
      if (xhr.status === 200) {			  
		sendResponse(xhr.response);
			
		var resp = JSON.parse(xhr.response);
		var respMsg = "";                    

		if (resp.check) {
		  respMsg = 'Validation passed!\nSigned by: ' + resp.user;
		  respMsg += '\nClick to see the details';
		}
		else 
		  respMsg = ('Validity check failed!\n (Parsing status: ' + resp.status + ')');				
		doNotifyWithCheck('Signature Verification', respMsg, resp.msgid);
	  } 
	  else 
	  	alert("Something went wrong. Server returned error. \nStatus: " + xhr.status);
	  
	}
  }
  xhr.send(param);
}

function callApiSign(text, sendResponse) 
{	
	var url = domain + "/FingerprintApi/SignMessage";
	var param = 'pubkey=' + encodeURIComponent(window.localStorage.getItem('pubkey')) 
			  + '&msg='+ encodeURIComponent(text);
	
	var xhr = new XMLHttpRequest();	
	xhr.open("POST", url);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.onerror = function(e){
		alert("Something went wrong. Server returned error.");
	  };
	xhr.onreadystatechange = function() {		
  		if (xhr.readyState == 4) {			  
			if (xhr.status === 200) {
				var resp = JSON.parse(xhr.response);
				sendResponse(resp.signed);
				respMsg = '\nSigned by: ' + resp.user;
				respMsg += '\nUse Ctrl + V to paste signed text from clipboard';
				respMsg += '\nClick to see the details';	
				doNotifyWithCheck("Message ", respMsg, resp.msgid);
			} 
			else 
				alert("Something went wrong. Server returned error. \nStatus: " + xhr.status);			
  		}
	}

	xhr.send(param);
}

function doSign(message, key) {
	var rsa = new RSAKey();
	rsa.readPrivateKeyFromPEMString(key);
	var hashAlg = "sha256";
	var hSig = rsa.sign(message, hashAlg);
	return linebrk(hSig, 64);
}

function doDecrypt(message, key) {	
	var rsa = new RSAKey();
	rsa.readPrivateKeyFromPEMString(key);
	//var hashAlg = "sha256";
	var hDec = rsa.b64_decrypt(message);	
	return hDec;
}

function doNotifyWithCheck(title, msg, link) {
	if (!Notify.needsPermission)
		onNotifyPermissionGranted(title, msg, link);
	else if (Notify.isSupported())	
		Notify.requestPermission(onNotifyPermissionGranted(title, msg, link), onNotifyPermissionDenied)
	else 
		onNotifyPermissionDenied();	
}

function onNotifyPermissionDenied() {
	alert("Fileproof signature extension needs the notifications to be allowed!");
}

function onNotifyPermissionGranted(title,msg,link) {
	notification(title,msg,link);
}

function onClickNotification(link) {	
	var signerUrl = domain + '/Profile/ProfileView?id=' + encodeURIComponent(link);	
	chrome.tabs.create({url: signerUrl});
}

function notification(title, msg, link){	
	var myNotification;

	if (link != null && link.length > 1){
		myNotification = new Notify(title, {
			body: msg,		
			timeout: 0,
			notifyClick: function() {onClickNotification(link)}
			// ,notifyShow: onShowNotification,
			// notifyClose: onCloseNotification,		
			// notifyError: onErrorNotification,
		})
	} else {		
		myNotification = new Notify(title, {
			body: msg,		
			timeout: 0		
		});
	};

	myNotification.show();
}

function initBackground() {	
	loadContentScriptInAllTabs();

	var notarizeKeyString = getNotarizeKeyString();		
	if (localStorage['notarizeKey'] == undefined) 
		localStorage['notarizeKey'] = notarizeKeyString;			
	
	var checkKeyString = getCheckKeyString();
	if (localStorage['checkKey'] == undefined)
		localStorage['checkKey'] = checkKeyString;	

	sendNotarizeKeyToAllTabs(notarizeKeyString);
	sendCheckKeyToAllTabs(checkKeyString);

	chrome.extension.onRequest.addListener(
		function(request, sender, sendResponse) {		

			if (request['init']) {			
				sendResponse({'notarizeKey': localStorage['notarizeKey'],'checkKey': localStorage['checkKey']});
			} else if (request['notarize']) {			
				sign(request['notarize'], sendResponse)		  
			}
			else if (request['check']) {			
				check(request['check'], sendResponse)		  
			}
			else if (request['decrypt']){
				decrypt(request['decrypt'], sendResponse)
			}
			return true;
		}
	);

	chrome.browserAction.onClicked.addListener(
		function(tab) {
		chrome.tabs.sendRequest(
			tab.id,
			{'changeSelectionClip': true});
		});
}

initBackground();