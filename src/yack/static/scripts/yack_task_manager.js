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

