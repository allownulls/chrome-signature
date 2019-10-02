let domain = "http://cvproof-signature.azurewebsites.net"
//let domain = "http://localhost:14733"

function saveOptions() {  
  if (profileSealed()) return;    
  generateKeys();
  register();
}

function restoreOptions() {    
  document.getElementById('name').value = window.localStorage.getItem('name');
  document.getElementById('email').value = window.localStorage.getItem('email');
  document.getElementById('pin').value = window.localStorage.getItem('pin');
  document.getElementById('pkey').value = window.localStorage.getItem('pkey');
  document.getElementById('pubkey').value = window.localStorage.getItem('pubkey');
  updateControls();
}

function generateKeys() {
  var rsaKeypair = KEYUTIL.generateKeypair("RSA", 1024);  
  document.getElementById('pkey').value = KEYUTIL.getPEM(rsaKeypair.prvKeyObj, "PKCS1PRV")
                                                 .replace("-----BEGIN RSA PRIVATE KEY-----","")
                                                 .replace("-----END RSA PRIVATE KEY-----","");
  document.getElementById('pubkey').value = KEYUTIL.getPEM(rsaKeypair.pubKeyObj)
                                                   .replace("-----BEGIN PUBLIC KEY-----","")
                                                   .replace("-----END PUBLIC KEY-----","");
}

function register() 
{  
  var jsonModel = {
    "Name" : document.getElementById('name').value,
    "Email" : document.getElementById('email').value,
    "PublicKey" : document.getElementById('pubkey').value,
    "PIN" : document.getElementById('pin').value
  };

  var status = document.getElementById('status');
	var url = domain + "/FingerprintApi/Register";
	var param = JSON.stringify(jsonModel); 
			  	
	var xhr = new XMLHttpRequest();	
	xhr.open("POST", url);
  xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');

  xhr.onerror = function(e){
    status.textContent = 'Saving options error. Check your connection and try again.';  
    document.getElementById('pkey').value = "";
    document.getElementById('pubkey').value = "";
    document.getElementById('pin').value = "";   
  }

	xhr.onreadystatechange = function() {		
    if (xhr.readyState == 4) {
      if (xhr.status === 200) {
        var resp = JSON.parse(xhr.response);
        if (resp.error == null)
        {
          updateOptions(resp);
          status.textContent = 'Options saved. Close this tab and start using Fileproof signature!';
        } else          
          showError('Saving options error: ' + resp.error);                  
      } 
      else 
        status.textContent = 'Saving options error. Something went wrong, server returned error.';      
    }
  }
  xhr.send(param);
}

function updateOptions(resp){ 
  document.getElementById('pin').value = resp.pin;
  
  window.localStorage.setItem('pkey', document.getElementById('pkey').value);
  window.localStorage.setItem('pubkey', document.getElementById('pubkey').value);
  window.localStorage.setItem('name', document.getElementById('name').value);
  window.localStorage.setItem('email', document.getElementById('email').value);
  window.localStorage.setItem('pin', document.getElementById('pin').value);         

  updateControls();
}

function profileSealed(){
  return document.getElementById('pkey').value;            
}

function updateControls(){
    if (profileSealed()){
      document.getElementById('name').disabled = true;
      document.getElementById('email').disabled = true;      
      document.getElementById('generate').disabled = true;
      document.getElementById('pin').disabled = true;      
    } else 
      document.getElementById('generate').addEventListener('click', saveOptions);    
}

function showError(text){  
  status.textContent = text;
  document.getElementById('pkey').value = "";
  document.getElementById('pubkey').value = "";
  document.getElementById('pin').value = "";
}

function onNotifyPermissionDenied() {
  var status = document.getElementById('status');
  status.textContent = 'Fileproof signature needs notifications to be allowed. Please, check your notification <a href="chrome://settings/content/notifications">settings</a>';  
}

document.addEventListener('DOMContentLoaded', restoreOptions);


