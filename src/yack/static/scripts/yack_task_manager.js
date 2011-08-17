function YackTaskManager(app){

    this.taskList = [];
    this.uploadList = app.uploadList;
    this.app = app

    this.pauseAll = function() {
	    for (var i = 0, file; task = taskList[i]; i++) {
		    task.pause()
	    }
    }


    this.resumeAll = function() {
	    for (var i = 0, file; task = taskList[i]; i++) {
            task.setListener(this)
		    task.start();
	    }
    }

    this.addTask = function(task) {
        this.taskList[task.id] = task;
        task.start();
    }

    this.deleteTask = function(task) {
        this.uploadList.delete(task);
        this.taskList[task.id] = null;
    }

    //Callback

    this.taskCreated = function(task) {
        this.uploadList.create(task);
    }

    this.taskStateChanged = function(task) {
        this.uploadList.stateChanged(task);
        
        if(task.state == "uploaded") {
            this.app.fileUploaded(task)
        }    
    }
    
    this.taskProgressChanged = function(task) {
        this.uploadList.progressChanged(task);
    }

    this.taskFileIdChanged = function(task) {
        this.uploadList.deleteInterrupted(task.distantId);
    }
}

