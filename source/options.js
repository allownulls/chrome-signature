let domain = "http://cvproof-signature.azurewebsites.net"
// Saves options to chrome.storage
function saveOptions() {
  if (profileSealed()) return;  
  generateKeys();
  if (!register()) return;
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {    
  document.getElementById('name').value = window.localStorage.getItem('name');
  document.getElementById('email').value = window.localStorage.getItem('email');
  document.getElementById('pin').value = window.localStorage.getItem('pin');
  document.getElementById('pkey').value = window.localStorage.getItem('pkey');
  document.getElementById('pubkey').value = window.localStorage.getItem('pubkey');
  updateControls();
}

function generateKeys() {
  if (profileSealed()) return;

  var rsaKeypair = KEYUTIL.generateKeypair("RSA", 1024);
  //rsaKeypair.prvKeyObj.isPrivate = true;
  document.getElementById('pkey').value = KEYUTIL.getPEM(rsaKeypair.prvKeyObj, "PKCS1PRV")
                                                 .replace("-----BEGIN RSA PRIVATE KEY-----","")
                                                 .replace("-----END RSA PRIVATE KEY-----","");
  document.getElementById('pubkey').value = KEYUTIL.getPEM(rsaKeypair.pubKeyObj)
                                                   .replace("-----BEGIN PUBLIC KEY-----","")
                                                   .replace("-----END PUBLIC KEY-----","");
}

function register() 
{  
  var ok = false;

  var jsonModel = {
    "Name" : document.getElementById('name').value,
    "Email" : document.getElementById('email').value,
    "PublicKey" : document.getElementById('pubkey').value,
    "PIN" : document.getElementById('pin').value
  };

	var url = domain + "/FingerprintApi/Register";
	var param = JSON.stringify(jsonModel); 
			  	
	var xhr = new XMLHttpRequest();	
	xhr.open("POST", url);
	xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');	
	xhr.onreadystatechange = function() {		
  		if (xhr.readyState == 4) {			  
        var resp = JSON.parse(xhr.response);		    
        if (resp.error == null)
        {          
          document.getElementById('pin').value = resp.pin;
          
          window.localStorage.setItem('pkey', document.getElementById('pkey').value);
          window.localStorage.setItem('pubkey', document.getElementById('pubkey').value);
          window.localStorage.setItem('name', document.getElementById('name').value);
          window.localStorage.setItem('email', document.getElementById('email').value);
          window.localStorage.setItem('pin', document.getElementById('pin').value);
         
          var status = document.getElementById('status');
          status.textContent = 'Options saved. Close this tab and start using Fileproof signature!';

          updateControls();
        
          // setTimeout(function() {
          //     status.innerHTML = '&nbsp;';
          // }, 7500);
          ok = true;
        }
  		}
  }
  xhr.send(param);
  
  return ok;
}

function profileSealed()
{
  var ret = document.getElementById('pkey').value != ""
            && document.getElementById('pkey').value != null;    
  return ret;

}

function updateControls()
{
    if (profileSealed())
    {
      document.getElementById('generate').disabled = true;
      document.getElementById('pin').disabled = true;      
    }
    else
    {          
      document.getElementById('generate').addEventListener('click', saveOptions);
    }
}

document.addEventListener('DOMContentLoaded', restoreOptions);


