// Saves options to chrome.storage
function save_options() {  
  var pkey = document.getElementById('pkey').value;
  var pubkey = document.getElementById('pubkey').value;
  window.localStorage.setItem('pkey', pkey);
  window.localStorage.setItem('pubkey', pubkey);
  
  var status = document.getElementById('status');
  status.textContent = 'Options saved.';
  setTimeout(function() {
      status.innerHTML = '&nbsp;';
  }, 750);
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {  
    document.getElementById('pkey').value = window.localStorage.getItem('pkey');
	document.getElementById('pubkey').value = window.localStorage.getItem('pubkey');
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);