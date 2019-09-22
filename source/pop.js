var signIt = function () {
    $('#waitSpinner').remove();
    $('#sendBtn').append($("<i id='waitSpinner' class='fa fa-spinner fa-spin'></i>"));
    var msg = $('#Message').val();
    if (msg !== undefined)
        chrome.extension.sendRequest({'notarize': msg},
            function (text) {
                if (text !== undefined){
                    $('#Message').val(text);
                    $('#waitSpinner').remove();
                }
            }
        )
        else 
            $('#waitSpinner').remove();
}

var checkIt = function () {
    $('#waitSpinner').remove();
    $('#checkBtn').append($("<i id='waitSpinner' class='fa fa-spinner fa-spin'></i>"));
    var msg = $('#Message').val();
    if (msg !== undefined)
        chrome.extension.sendRequest({'check': msg},
            function (response) {
                var resp = JSON.parse(response);
                var respMsg = "";                    

                if (resp.check) { 
                    respMsg = 'Validation passed!\nSigned by: ' + resp.user
                        + '\nEmail: ' + resp.email
                        + '\nPublic key: ' + resp.publickey
                        + '\nSignature: ' + resp.signature;																	
                }
                else 
                    respMsg = ('Validity check failed!\n (Parsing status: ' + resp.status + ')');
                
                //alert(respMsg);
                $('#waitSpinner').remove();
            }
        )
    else 
        $('#waitSpinner').remove();
}

$('#sendBtn').click(signIt);
$('#checkBtn').click(checkIt);