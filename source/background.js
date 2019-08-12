var lastSignSelection = '';
var lastCheckSelection = '';
var globalUtteranceIndex = 0;
//let domain = "http://cvproof-prototype.azurewebsites.net";
let domain = "http://cvproof-signature.azurewebsites.net"
//let domain = "http://localhost:14733";	

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
	let encodedText = selection + '#Fileproof\n' + signed + '\npubkey:' + window.localStorage.getItem('pubkey') + '\n#Fileproof';  
	
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
	var url = domain + '/FingerprintApi/CheckMessage';
	var param = 'msg='+ encodeURIComponent(text);	

	var xhr = new XMLHttpRequest();
	xhr.open("POST", url);
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');	
	xhr.onreadystatechange = function() {		
  		if (xhr.readyState == 4) {  
			//resp = JSON.parse(xhr.response);
			//alert("Check ok! \n check: " + resp.check + "\n status: " + resp.status);			
			sendResponse(xhr.response);
			
			var resp = JSON.parse(xhr.response);
			var respMsg = "";                    

			if (resp.check) { 
				respMsg = 'Validation passed!\nSigned by: ' + resp.user;
				if (resp.email !== null)	
					respMsg += '\nEmail: ' + resp.email;
				//+ '\nPublic key: ' + resp.publickey
				//+ '\nSignature: ' + resp.signature;																	
			}
			else 
				respMsg = ('Validity check failed!\n (Parsing status: ' + resp.status + ')');

			doNotify('Signature Verification', respMsg);

			// var opt = {
			// 	type: "basic",
			// 	title: "Verifying signature...",
			// 	message: respMsg,
			// 	iconUrl: "cvproof-finger.png"
			// };			

			// chrome.notifications.create('Verification', opt, function() {});		

			// create notification using forumUrl as id
			//chrome.notifications.create(forumUrl, options, function(notificationId){ }); 

			// create a on Click listener for notifications
			// chrome.notifications.onClicked.addListener(function(notificationId) {
			//   chrome.tabs.create({url: notificationId});
			// });  
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
	xhr.onreadystatechange = function() {		
  		if (xhr.readyState == 4) {			  
			var resp = JSON.parse(xhr.response);		    
			sendResponse(resp.signed);
			respMsg = '\nSigned by: ' + resp.user;
			if (resp.email !== null)	
				respMsg += '\nEmail: ' + resp.email;
			respMsg += '\nUse Ctrl + V to paste signed text from clipboard';
			doNotify("Message ", respMsg);
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

function doNotify (title, msg) {
	if (!Notify.needsPermission) {
		notification(title, msg);
	} else if (Notify.isSupported()) {
		Notify.requestPermission(onPermissionGranted, onPermissionDenied);
	}
}

function onClickNotification () {
	var signerUrl = 'http://cvproof-signature.azurewebsites.net/Signature/Signer';
	chrome.tabs.create({url: signerUrl});
}

function notification(title, msg){
	var myNotification = new Notify(title, {
		body: msg,		
		timeout: 10,
		notifyClick: onClickNotification
		// ,notifyShow: onShowNotification,
		// notifyClose: onCloseNotification,		
		// notifyError: onErrorNotification,
	});

	myNotification.show();
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
			{'changeSelectionClip': true});
		});

	//console.log('initbg-finish');	
}

initBackground();
