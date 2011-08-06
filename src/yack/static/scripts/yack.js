// Yack main script

var yack_input;
var yack_workList;
var yack_worker;
var yack_dlList;

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
    
    addFiles(filesStruct);
    
    return true;
    
}

var taskList = [];
var taskNextId = 0;

function addFiles(files) {
    console.log('add files');
 
    for (var i = 0, file; file = files[i]; i++) {
    	task = new YackTask(file)
        taskList[task.id] = task;
        task.start();
    }
    
}


function YackTask(file) {

	

	this.worker_callback = function (e) {
	    var data = e.data;
	    switch (data.cmd) {
	        case 'log':
	            console.log('Task '+this.parent.id +'- '+data.message);
	            break;
	        case 'state':
	            this.parent.setState(data.value)
	            break;
	        case 'progress':
	            this.parent.setProgress(data.value)
	            break;
            case 'set_sha':
	            this.parent.file['sha'] = data.value;
	            break;
            case 'set_id':
	            this.parent['distantId'] = data.value;
	            break;
	    }       
	}
	
	
	
	this.start = function() {
		if(this.running) {
			return
		}
		this.worker = new Worker("/static/scripts/yack_worker_send_file.js");
	    this.worker.addEventListener('message', this.worker_callback, false);
		this.worker.postMessage({'cmd' : 'init'});
		this.worker.postMessage({'cmd' : 'add_file', 'file': this.file});
		this.worker['parent'] = this;
		this.running = true; 
	}
	
	this.pause = function() {
		console.log("task pause")
		this.worker.terminate()
		this.running = false;
		if(this.state == "analysing") {
			this.setProgress(-1);
		}
		this.setState("paused")
		
	} 
	
	this.init = function(file) {
		this.id = taskNextId++;
		this.file = file;
		this.addFileBlock()
	}
	
	
	this.addFileBlock = function() {
		var block = '';
		block+='<div id=task_'+this.id+'>';
		block+='<p>'+this.file.name+' - Size: '+yack_render_size(this.file.size)+'</p>';
		block+='<p>State: <span id=task_'+this.id+'_state>Analyzing</span> <span id=task_'+this.id+'_progress>0 %</span></p>';
		block+='<a href="#" id="task_'+this.id+'_pause" >Pause</a>';
		block+='<a href="#" id="task_'+this.id+'_resume" ></a>';
		block+="<div>";
		
		document.getElementById('files_to_upload').innerHTML += block;
		self = this;
		
		document.getElementById('task_'+this.id+'_resume').onclick = function() {
			self.start();
		}
		document.getElementById('task_'+this.id+'_pause').onclick = function() {
			self.pause();
		}
	}
	
	this.setState = function(state) {
		this.state = state;
		
		var stateElement = document.getElementById('task_'+this.id+'_state');
		
		if(state == "analysing") {
			stateElement.innerHTML = "Analysing";
			document.getElementById('task_'+this.id+'_pause').innerHTML = "Pause";
			document.getElementById('task_'+this.id+'_resume').innerHTML = "";
		} else if(state == "paused") {
			stateElement.innerHTML = "Paused";
			document.getElementById('task_'+this.id+'_pause').innerHTML = "";
			document.getElementById('task_'+this.id+'_resume').innerHTML = "Resume";
		} else if(state == "uploading") {
			stateElement.innerHTML = "Uploading";
			document.getElementById('task_'+this.id+'_pause').innerHTML = "Pause";
			document.getElementById('task_'+this.id+'_resume').innerHTML = "";
		} else if(state == "uploaded") {
			stateElement.innerHTML = "Uploaded";
			this.setProgress(-1);
			yack_dlList.addFileById(this.distantId);
			this.delete()
		}
		
	}
	
	this.setProgress = function(progress) {
		this.progress = progress;
		
		var progressElement = document.getElementById('task_'+this.id+'_progress');
		
		if(progress < 0) {
			progressElement.innerHTML = "";
		} else {
			progressElement.innerHTML = parseInt(progress*100) + ' %';
		}
		
		
	}
	
	this.delete = function(progress) {
		taskList[this.id] = null;
		document.getElementById('files_to_upload').removeChild(document.getElementById('task_'+this.id));
	}
	
	this.init(file)
}

function yack_init() {
    yack_checkApiCompatibility();
    yack_input = document.getElementById('main_file');
    yack_workList = document.getElementById('work_list');
    
    //yack_worker = new Worker("/static/scripts/yack_worker_core.js");
    
    //yack_worker.addEventListener('message', yack_workerMessage, false);

    //yack_worker.postMessage({'cmd' : 'init'}); // Send data to our worker.
    
    yack_input.onchange = yack_inputChange
    
    document.getElementById('resume_all').onclick = yack_resume_all;
    document.getElementById('pause_all').onclick = yack_pause_all;
    
    yack_dlList = new YackDownloadList(document.getElementById('files_to_download'));
    yack_dlList.update()
}

function yack_pause_all() {
	console.log("pause all")
	for (var i = 0, file; task = taskList[i]; i++) {
		task.pause()
	}
	return false;
}


function yack_resume_all() {
	for (var i = 0, file; task = taskList[i]; i++) {
		task.start()
	}
	return false;
}


function YackDownloadList(rootElement){

	this.rootElement = rootElement;
	
	this.update = function() {
		
		var url = "/yack/command?format=json&cmd=getFileList";
		var self = this
	
		yack_ajaxCall(url, function(response) {
			
			for(var i=0; i< response.length; i++) {
				file = response[i];
				self.addFileBlock(file.name, file.size,  file.description, file.link)
			}
		
		});
	}
	
	this.addFileBlock = function(name, size, description, link) {
		var block = '';
		block+='<div>';
		block+='<a href="'+link+'">'+name+'</a> - Size: '+yack_render_size(size);
		block+="<div>";
		
		this.rootElement.innerHTML = block + this.rootElement.innerHTML;
	}
	
	this.addFileById = function(id) {
		var url = "/yack/command?format=json&cmd=getFileLink&pk="+id;
		var self = this
	
		yack_ajaxCall(url, function(response) {
			
			self.addFileBlock(response[0].name, response[0].size,  response[0].description, response[0].link);
			
		});
	}
	
}


function yack_render_size(size) {
	if(size > 1000000000) {
		value = size/1000000000
		unit = "Go"
	} else if(size > 1000000) {
		value = size/1000000
		unit = "Mo"
	} else if(size > 1000) {
		value = size/1000
		unit = "Ko"
	} else {
		value = size
		unit = "bytes"
	}
	
	if(value >= 100) {
		displayValue = parseInt(value);
	} else if(value >= 10) {
		displayValue = parseInt(value*10)/10;
	} else  {
		displayValue = parseInt(value*100)/100;
	}
	
	return displayValue + " "+ unit;

}		

function  yack_ajaxCall(url, callback) {
    var xhr_object = new XMLHttpRequest();
    
    xhr_object.onreadystatechange = function(){                   
    	if (xhr_object.readyState == 4) {
    		 callback(eval(xhr_object.responseText));
		}
	}    
	
    xhr_object.open("GET", url , true);
    xhr_object.send(null);
    
    return eval(xhr_object.responseText);

}
    
	

yack_init();

