//
// Copyright (c) 2011 Frédéric Bertolus.
//
// This file is part of Yack.
// Yack is free software: you can redistribute it and/or modify it
// under the terms of the GNU Affero General Public License as published by the
// Free Software Foundation, either version 3 of the License, or (at your
// option) any later version.
//
// Yack is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for
// more details.
// You should have received a copy of the GNU Affero General Public License along
// with Yack. If not, see http://www.gnu.org/licenses/.
//

importScripts('sha1.js')

var yack_initial_block_size = 100000; // 100 ko
var yack_file_read_size = 5000000; // 5 mo
var worker_running = true;


self.addEventListener('message', function(e) {
    var data = e.data;
    switch (data.cmd) {
        case 'init':
            init(data.authId, data.authToken);
            break;
        case 'add_file':
            addFile(data.file);
            break;
        case 'close':
            worker_running = false;
            break;
    }    
    
}, false);

var server;

function init(authId, authToken) {
    log('yack_worker_send_file: init');
    server = new Server(authId, authToken);

}

function addFile(file) {
    log('yack_worker_send_file: add file');
    
    
    if(!file.sha) {
        self.postMessage({'cmd' : 'state', 'value' : 'analysing'});

	    sha = fileSha(file, function (progress){
	    	self.postMessage({'cmd' : 'progress', 'value' : progress});
	    });
	    if(!worker_running) {
    	    return;
	    }
	    
	    self.postMessage({'cmd' : 'set_sha', 'value' : sha});
    } else {
    	sha = file.sha;
    }
    
    distantFile = server.createDistantFile(file.name, file.size, sha);
    self.postMessage({'cmd' : 'set_id', 'value' : distantFile.id});
    
    
    self.postMessage({'cmd' : 'state', 'value' : 'uploading'});
    
    distantFile.send(file, function (progress){
    	self.postMessage({'cmd' : 'progress', 'value' : progress});
    });
    if(!worker_running) {
	    return;
    }
    
    self.postMessage({'cmd' : 'state', 'value' : 'uploaded'});
    
}

function Server(authId, authToken) {

    this.authId = authId;
    this.authToken = authToken;	

    this.createDistantFile = function(name, size, sha) {
          response = this.sendCommand('createFile', {'name': name, 'size': size, 'sha': sha});
          log('yack_worker_send_file: '+response)
          
          return new DistantFile(response[0].id);
          
    }
    
    this.sendCommand = function(command, params) {
        var xhr_object = new XMLHttpRequest();
        
        var url = "/yack/command?format=json&cmd="+command;
        
        params.auth_token = this.authToken
        params.auth_id = this.authId
        
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
        
        params.auth_token = this.authToken
        params.auth_id = this.authId
        
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
			if(!worker_running) {
			    return;
			}
			
			timer = new Timer()
			
			
			var blob = slice(file.blob,work.offset, work.offset+work.size);
			var raw = reader.readAsArrayBuffer(blob);
			
			var sha = new Sha1();
			sha.update(raw);
			var sha_digest = rstr2hex(sha.digest());
			
			
			response = server.sendDataCommand('sendFilePart', {'pk': this.id, 'size': work.size, 'offset': work.offset, 'sha': sha_digest}, raw);
			
			this.optimizeBlockSize(timer.getTime())
			
    		this.parts = response[0].parts
    		this.state = response[0].upload_state
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
    	this.state = response[0].upload_state
    	this.parts = response[0].parts
    	
    }
    
    this.optimizeBlockSize = function(time) {
    	optimalBlockTime = 2000; // 2s
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
    	if(this.state == "uploaded") {
    		return null;
    	}
    
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
        if(!worker_running) {
            return;
        }

        var blob = slice(file.blob,i, i+yack_file_read_size);
        var raw = reader.readAsArrayBuffer(blob);
        
        sha.update(raw);
        
        progressCallback(i/fileSize)
        
    }
    var blob = slice(file.blob,i, fileSize);
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


function slice(file, begin, end) {

    if(file.slice) {
        return file.slice(begin,end);
    } else if(file.webkitSlice) {
        return file.webkitSlice(begin,end);
    } else if(file.mozSlice) {
    	return file.mozSlice(begin,end);
    } else {
        // Fail to find slice method
        alert("Your browser is too all : file.slice method is missing."); 
        return;
    }
}


