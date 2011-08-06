importScripts('sha1.js')

var yack_initial_block_size = 100000; // 100 ko
var yack_file_read_size = 5000000; // 5 mo



self.addEventListener('message', function(e) {
    var data = e.data;
    switch (data.cmd) {
        case 'init':
            init();
            break;
        case 'add_file':
            addFile(data.file);
            break;
    }    
    
}, false);

var server;

function init() {
    log('yack_worker_send_file: init');
    server = new Server();
}

function addFile(file) {
    log('yack_worker_send_file: add file');
    self.postMessage({'cmd' : 'state', 'value' : 'analysing'});
    
    
    if(!file.sha) {
	    sha = fileSha(file, function (progress){
	    	self.postMessage({'cmd' : 'progress', 'value' : progress});
	    });
	    
	    self.postMessage({'cmd' : 'set_sha', 'sha' : sha});
    } else {
    	sha = file.sha;
    }
    
    distantFile = server.createDistantFile(file.name, file.size, sha);
    
    self.postMessage({'cmd' : 'state', 'value' : 'uploading'});
    
    distantFile.send(file, function (progress){
    	self.postMessage({'cmd' : 'progress', 'value' : progress});
    });
    
    self.postMessage({'cmd' : 'state', 'value' : 'uploaded'});
    
}

function Server() {

	

    this.createDistantFile = function(name, size, sha) {
          response = this.sendCommand('createFile', {'name': name, 'size': size, 'sha': sha});
         
          
          return new DistantFile(response[0].pk);
          
    }
    
    this.sendCommand = function(command, params) {
        var xhr_object = new XMLHttpRequest();
        
        var url = "/yack/command?format=json&cmd="+command;
        
        for(param in params) {
            url += '&'+param+'='+params[param];
        }
        xhr_object.open("GET", url , false);
        xhr_object.send(null);
        return eval(xhr_object.responseText);

    }
    
    this.sendDataCommand = function(command, params, data) {
        var xhr_object = new XMLHttpRequest();
        
        var url = "/yack/command?format=json&cmd="+command;
        
        for(param in params) {
            url += '&'+param+'='+params[param];
        }
        xhr_object.open("POST", url , false);
        xhr_object.setRequestHeader("X-CSRFToken", this.csrfToken);
        xhr_object.send(data);
        return eval(xhr_object.responseText);

    }
    
    this.getCsrfToken = function() {
    	response = this.sendCommand('getCsrfToken', {})
    	this.csrfToken = response.token
    }
    
    this.getCsrfToken();
}

function DistantFile(id) {
    
    this.id = id;
    
    this.send = function(file, progressCallback) {
    	this.refresh()
    
    	var reader = new FileReaderSync();

		this.block_size = yack_initial_block_size

    	while(work = this.getWork()) {
			var blob = file.blob.webkitSlice(work.offset, work.offset+work.size);
			var raw = reader.readAsArrayBuffer(blob);
			
			var sha = new Sha1();
			sha.update(raw);
			var sha_digest = rstr2hex(sha.digest());
			
			timer = new Timer()
			response = server.sendDataCommand('sendFilePart', {'pk': this.id, 'size': work.size, 'offset': work.offset, 'sha': sha_digest}, raw);
			
			this.optimizeBlockSize(timer.getTime())
			
    		this.parts = response[0].parts
    		
    		// Update progress
    		progressCallback(this.getProgress())
    	}
    }
    
    this.getProgress = function() {
    	var sendSize = 0;
    	
    	for(var i = 0; i < this.parts.length; i++) {
    		sendSize += this.parts[i].size;
    	}
    	
    	return sendSize / this.size;
    }
        
    this.refresh = function() { 
    	response = server.sendCommand('getFileInfo', {'pk': this.id});
    	
    	this.size = response[0].size
    	this.sha = response[0].sha
    	this.parts = response[0].parts
    	
    }
    
    this.optimizeBlockSize = function(time) {
    	optimalBlockTime = 5000; // 5s
		relativeRatio =  optimalBlockTime / time;
		
		if(relativeRatio > 10) {
			relativeRatio = 10;
		}
		
		if(relativeRatio < 0.1) {
			relativeRatio = 0.1;
		}
		
		//Set new siez block
		this.block_size = parseInt(this.block_size * relativeRatio);
	}
    
    this.getWork = function() { 
		if(this.parts.length > 0) {
			var workBegin = this.parts[0].size;
		
			if(workBegin >= this.size) {
				return null;
			}
			
			if(this.parts.length > 1) {
				var workSize = this.parts[1].begin - workBegin;
			} else {
				var workSize = this.size- workBegin;
			}
		
		} else {
			var workBegin = 0;
			var workSize =this.size;
		}
		
		if( workSize > this.block_size) {
			workSize = this.block_size;
		}
		
		return {'offset': workBegin, 'size': workSize};
		 
		
    }
    
}

function fileSha(file, progressCallback) {
     var fileSize = file.size
    
    var start = new Date().getTime();
    var sha = new Sha1();
    var reader = new FileReaderSync();
    var i;
    
    for (i = 0; i+yack_file_read_size <= fileSize; i+=yack_file_read_size) {
        var blob = file.blob.webkitSlice(i, i+yack_file_read_size);
        var raw = reader.readAsArrayBuffer(blob);
        
        sha.update(raw);
        
        progressCallback(i/fileSize)
        
    }
    var blob = file.blob.webkitSlice(i, fileSize);
    var lastRaw = reader.readAsArrayBuffer(blob);
    
    sha.update(lastRaw);
    
    return rstr2hex(sha.digest());
}



function log(message) {
    self.postMessage({'cmd' : 'log', 'message' : message});
}


function Timer() {
	this.start = new Date().getTime();

	this.getTime = function() {
		
		var end = new Date().getTime();
		return end - this.start;
	}

}



