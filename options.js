// Saves options to chrome.storage
function save_options() {  
  var key = document.getElementById('pkey').value;
  window.localStorage.setItem('pkey', key);
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {  
    document.getElementById('pkey').value = window.localStorage.getItem('pkey', key);
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);