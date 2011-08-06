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

	this.id = taskNextId++;
	this.file = file;

	this.worker_callback = function (e) {
	    var data = e.data;
	    switch (data.cmd) {
	        case 'log':
	            console.log('Task '+this.parent.id +'- '+data.message);
	            break;
	        case 'state':
	            console.log('Task '+this.parent.id +'- State: '+data.value);
	            break;
	        case 'progress':
	            console.log('Task '+this.parent.id +'- Progress: '+data.value);
	            break;
            case 'set_sha':
	            console.log('Task '+this.parent.id +'- Sha: '+data.sha);
	            this.parent.file['sha'] = data.sha;
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
	} 
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
}

function yack_pause_all() {
	console.log("pause all")
	for (var i = 0, file; task = taskList[i]; i++) {
		task.pause()
	}
}


function yack_resume_all() {
	for (var i = 0, file; task = taskList[i]; i++) {
		task.start()
	}
}


yack_init();

