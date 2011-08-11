yack_taskNextId = 0;

function YackTask(file, listener) {
    
    this.worker_callback = function (e) {
	    var data = e.data;
	    switch (data.cmd) {
	        case 'log':
	            console.log('Task '+this.parent.id +'- '+data.message);
	            break;
	        case 'state':
                console.log('Task '+this.parent.id +'- set state '+data.value);
                this.parent.setState(data.value)
	            break;
	        case 'progress':
	            this.parent.setProgress(data.value)
	            break;
            case 'set_sha':
	            this.parent.file['sha'] = data.value;
	            break;
            case 'set_id':
	            console.log('Task '+this.parent.id +'- set id '+data.value);
                
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
	
	this.init = function(file, listener) {
		this.id = yack_taskNextId++;
		this.file = file;
        this.listener = listener;
        this.listener.taskCreated(this)
	}
	
    
	
	this.setState = function(state) {
		this.state = state;
        this.listener.taskStateChanged(this)
	}
	
	this.setProgress = function(progress) {
		this.progress = progress;
        this.listener.taskProgressChanged(this)
		
		
	}
	
	this.init(file, listener)
}
