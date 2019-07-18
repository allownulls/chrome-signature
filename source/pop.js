var signIt = function () {
    var msg = $('#Message').val();
    if (msg !== undefined)
        chrome.extension.sendRequest({'notarize': msg},
            function (text) {
                if (text !== undefined){
                    $('#Message').val(text);
                }
            }
        );
}

var checkIt = function () {
    var msg = $('#Message').val();
    if (msg !== undefined)
        chrome.extension.sendRequest({'check': msg},
            function (response) {
                var resp = JSON.parse(response);
                if (resp.check){ alert('Validation passed!\nSigned by: '+ resp.user); }
                else { alert('Validity check failed!\n (Parsing status: ' + resp.status + ')'); }
            }
        );
}

$('#sendBtn').click(signIt);
$('#checkBtn').click(checkIt);