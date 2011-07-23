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
    
    /*var output = '<ul>';
    
    for (var i = 0, file; file = files[i]; i++) {
        
        var reader = new FileReader();
        
        reader.onload = (function(theFile) {
            return function(e) {
                alert('loaded');
                alert(theFile);
                var raw = e.target.result;
                
                alert(raw.length);
                
                
                
                sha.update(rstr2binb(raw), raw.length);
                var digest = rstr2hex(sha.digest());
                
                
                alert(digest);
                
                alert(rstr2hex(rstr_sha1(raw)));
                
            };
        })(file);
        
        reader.readAsBinaryString(file);


        
        
        output +=  '<li><strong>' + file.name + '</strong>';
        output +=  '<ul>';
        output +=  '<li>Size: ' + file.size + '</li>';
        output +=  '<li>Type: ' + file.type + '</li>';
        output +=  '<li>Date: ' + file.lastModifiedDate + '</li>';
        output +=  '</ul>';
        output +=  '</li>';
    }
    
    yack_workList.innerHTML = output;*/
    
    
    
    //alert(files);
    //alert(files[0]);
    //yack_worker.postMessage(files[0]);
    
        yack_size = document.getElementById('size').value;
    
    var filesStruct = [];
    
    for (var i = 0, file; file = files[i]; i++) {
        //filesStruct[i] = {'name' : file.name , 'size' : file.size, 'blob' : file.webkitSlice(0,file.size)}
        size = parseInt(yack_size);
        filesStruct[i] = {'name' : file.name , 'size' : size, 'blob' : file.webkitSlice(0,size)}
    }
    
    yack_worker.postMessage({'cmd' : 'add_files', 'files' : filesStruct});
    
    return true;
    
}


/*
function yack_fileSha(file, callback) {
    var reader = new FileReader();
    
    var sha = new Sha1();
    
    // compute sha with small blocks
    
    var i;
    
    for(i = 0; i < file.length; i++) {
       
    }
        
    
    
    reader.onload = (function(theFile) {
        return function(e) {
            
            
            
            
        };
    })(file);
    
}
*/

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
    
    //yack_input.onchange = yack_inputChange
    document.getElementById('submit').onclick = yack_inputChange
}

yack_init();

