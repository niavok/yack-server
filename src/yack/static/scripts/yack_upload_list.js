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

function YackUploadList(rootElement){

    this.rootElement = rootElement;
	
    this.clear = function(){
        this.rootElement.innerHTML = "";
    }

	this.create = function(task) {
		var block = '';
		block+='<p>'+task.file.name+' - Size: '+yack_render_size(task.file.size)+'</p>';
		block+='<p>State: <span id=task_'+task.id+'_state>Analyzing</span> <span id=task_'+task.id+'_progress>0 %</span></p>';
		block+='<a href="#" id="task_'+task.id+'_pause" >Pause</a>';
		block+='<a href="#" id="task_'+task.id+'_resume" ></a>';
		
		var div = document.createElement('div');
		div.setAttribute('id','task_'+task.id);
		div.innerHTML = block;
		
		document.getElementById('files_to_upload').appendChild(div);
	
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

