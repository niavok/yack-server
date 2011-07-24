// Yack main script

var yack_input;
var yack_workList;
var yack_worker;


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
    
    var filesStruct = [];
    
    for (var i = 0, file; file = files[i]; i++) {
        filesStruct[i] = {'name' : file.name , 'size' : file.size, 'blob' : file.webkitSlice(0,file.size)}
    }
    
    yack_worker.postMessage({'cmd' : 'add_files', 'files' : filesStruct});
    
    return true;
    
}


function yack_workerMessage(e) {
    var data = e.data;
    switch (data.cmd) {
        case 'log':
            console.log('Worker log: '+data.message);
            break;
    }       
}


function yack_init() {
    yack_checkApiCompatibility();
    yack_input = document.getElementById('main_file');
    yack_workList = document.getElementById('work_list');
    
    yack_worker = new Worker("/static/scripts/yack_worker.js");
    
    yack_worker.addEventListener('message', yack_workerMessage, false);

    yack_worker.postMessage({'cmd' : 'init'}); // Send data to our worker.
    
    yack_input.onchange = yack_inputChange
}

yack_init();

