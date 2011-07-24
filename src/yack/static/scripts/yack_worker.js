importScripts('sha1.js')

var yack_block_size = 500000; // 500 ko
var yack_file_read_size = 5000000; // 5 mo



self.addEventListener('message', function(e) {
    var data = e.data;
    switch (data.cmd) {
        case 'init':
            init();
            break;
        case 'add_files':
            addFiles(data.files);
            break;
        case 'add_file':
            addFile(data.file);
            break;
    }    
    
}, false);

var server;

function init() {
    log('yack_worker: init');
    server = new Server();
}



function addFiles(files) {
    log('yack_worker: add files');
    
    for (var i = 0, file; file = files[i]; i++) {
        addFile(file);
    }
    
}

function addFile(file) {
    
    sha = fileSha(file);
    
    log('yack_worker: sha='+sha)
    
    
    distantFile = server.createDistantFile(file.name, file.size, sha);
    
    distantFile.send();
    
    
}

function Server() {

    this.createDistantFile = function(name, size, sha) {
          response = this.sendCommand('createFile', {'name': name, 'size': size, 'sha': sha});
          
          log(response);
          
          return new DistantFile();
          
    }
    
    this.sendCommand = function(command, params) {
        var xhr_object = new XMLHttpRequest();
        
        var url = "/yack/command?format=json&cmd="+command;
        
        for(param in params) {
            url += '&'+param+'='+params[param];
        }
        log('yack_worker: send '+url);
        xhr_object.open("GET", url , false);
        xhr_object.send(null);
        log(xhr_object.responseText);
        return eval(xhr_object.responseText);

    }
    
    
}

function DistantFile() {
    
    this.send = function() {
    
    }
}

function fileSha(file) {
     var fileSize = file.size
    
    var start = new Date().getTime();
    var sha = new Sha1();
    var reader = new FileReaderSync();
    var i;
    for (i = 0; i+yack_file_read_size <= fileSize; i+=yack_file_read_size) {
        var blob = file.blob.webkitSlice(i, i+yack_file_read_size);
        var raw = reader.readAsArrayBuffer(blob);
        
        sha.update(raw);
    }
    var blob = file.blob.webkitSlice(i, fileSize);
    var lastRaw = reader.readAsArrayBuffer(blob);
    
    sha.update(lastRaw);
    
    return rstr2hex(sha.digest());
}



function log(message) {
    self.postMessage({'cmd' : 'log', 'message' : message});
}
