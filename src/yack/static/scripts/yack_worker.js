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



function init() {
    log('yack_worker: init');
}



function addFiles(files) {
    log('yack_worker: add files');
    
    for (var i = 0, file; file = files[i]; i++) {
        addFile(file);
    }
    
}

function addFile(file) {
    log(file)
    var fileSize = file.size
    log('yack_worker: file='+file.name);
    log('yack_worker: size='+file.size);
    
    
    var start = new Date().getTime();
    var sha = new Sha1();
    var reader = new FileReaderSync();
    var i;
    for (i = 0; i+yack_file_read_size <= fileSize; i+=yack_file_read_size) {
        //log('yack_worker: block size='+yack_file_read_size);
        var blob = file.blob.webkitSlice(i, i+yack_file_read_size);
        //log(blob);
        //log(blob.size);
        var raw = reader.readAsArrayBuffer(blob);
        
        //sha.update(rstr2binb(raw), raw.length);
        sha.update(raw);
    }
    var blob = file.blob.webkitSlice(i, fileSize);
    log('yack_worker: last block size='+(fileSize-i));
    log(blob);
    log(i);
    log(blob.size);
    var lastRaw = reader.readAsArrayBuffer(blob);
    
    //sha.update(rstr2binb(lastRaw), lastRaw.length);
    sha.update(lastRaw);
    
    var digest = rstr2hex(sha.digest());
    
            
    log('yack_worker: '+fileSize+' sha1='+digest);
    
    var elapsed = new Date().getTime() - start;
    log('yack_worker: elasped: '+elapsed+'ms');
}



function log(message) {
    self.postMessage({'cmd' : 'log', 'message' : message});
}
