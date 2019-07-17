var changeSelection = function () {		
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

$('#sendBtn').click(changeSelection);

