function YackUploadList(rootElement){

    this.rootElement = rootElement;
	
    this.clear = function(){
        this.rootElement.innerHTML = "";
    }

	this.create = function(task) {
		var block = '';
		block+='<div id=task_'+task.id+'>';
		block+='<p>'+task.file.name+' - Size: '+yack_render_size(task.file.size)+'</p>';
		block+='<p>State: <span id=task_'+task.id+'_state>Analyzing</span> <span id=task_'+task.id+'_progress>0 %</span></p>';
		block+='<a href="#" id="task_'+task.id+'_pause" >Pause</a>';
		block+='<a href="#" id="task_'+task.id+'_resume" ></a>';
		block+="<div>";
		
		document.getElementById('files_to_upload').innerHTML += block;
		
		document.getElementById('task_'+task.id+'_resume').onclick = function() {
			task.start();
		}
		document.getElementById('task_'+task.id+'_pause').onclick = function() {
			task.pause();
		}
	}

    this.stateChanged = function(task){
		
		var stateElement = document.getElementById('task_'+task.id+'_state');
		
		if(task.state == "analysing") {
			stateElement.innerHTML = "Analysing";
			document.getElementById('task_'+task.id+'_pause').innerHTML = "Pause";
			document.getElementById('task_'+task.id+'_resume').innerHTML = "";
		} else if(task.state == "paused") {
			stateElement.innerHTML = "Paused";
			document.getElementById('task_'+task.id+'_pause').innerHTML = "";
			document.getElementById('task_'+task.id+'_resume').innerHTML = "Resume";
		} else if(task.state == "uploading") {
			stateElement.innerHTML = "Uploading";
			document.getElementById('task_'+task.id+'_pause').innerHTML = "Pause";
			document.getElementById('task_'+task.id+'_resume').innerHTML = "";
		} else if(task.state == "uploaded") {
			stateElement.innerHTML = "Uploaded";
			document.getElementById('task_'+task.id+'_progress').innerHTML = "";
		}
    }	

    this.progressChanged = function(task){
		var progressElement = document.getElementById('task_'+task.id+'_progress');
		
		if(task.progress < 0) {
			progressElement.innerHTML = "";
		} else {
			progressElement.innerHTML = parseInt(task.progress*100) + ' %';
		}
    }
		

    this.delete = function(task) {
		document.getElementById('files_to_upload').removeChild(document.getElementById('task_'+task.id));
	}	


    this.addInterruptedFile = function(file) {
		var block = '';
        block+='<div id=interrupted_'+file.id+'>';
		block+='<p>'+file.name+' - Size: '+yack_render_size(file.size)+'</p>';
		block+='<p>State: <span>Interrupted</span> <span>'+parseInt(file.progress*100)+' %</span></p>';
		block+='<p>Choose the file to continue upload.</p>';
		block+="<div>";        
		document.getElementById('files_to_upload').innerHTML += block;
    }

    this.deleteInterrupted = function(id) {
        if(document.getElementById('interrupted_'+id)) {
    		document.getElementById('files_to_upload').removeChild(document.getElementById('interrupted_'+id));
        }
	}	
}

