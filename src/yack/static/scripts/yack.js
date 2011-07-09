// Yack main script

var yack_input;
var yack_workList;


function yack_checkApiCompatibility() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
}
    

function yack_inputChange() {
    
    var files = yack_input.files;
    
    var output = '<ul>';
    
    for (var i = 0, file; file = files[i]; i++) {
        output +=  '<li><strong>' + file.name + '</strong>';
        output +=  '<ul>';
        output +=  '<li>Size: ' + file.size + '</li>';
        output +=  '<li>Type: ' + file.type + '</li>';
        output +=  '<li>Date: ' + file.lastModifiedDate + '</li>';
        output +=  '</ul>';
        output +=  '</li>';
    }
    
    yack_workList.innerHTML = output;
    
}



function yack_init() {
    yack_checkApiCompatibility();
    yack_input = document.getElementById('main_file');
    yack_workList = document.getElementById('work_list');
    
    alert(yack_input);
    
    yack_input.onchange = yack_inputChange
}


yack_init();

