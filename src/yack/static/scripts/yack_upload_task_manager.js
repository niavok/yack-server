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

function YackUploadTaskManager(app){

    this.taskList = [];
    this.uploadList = app.uploadList;
    this.app = app
    this.taskCreatedEvent = new YackEventManager();
    this.taskStateChangedEvent = new YackEventManager();
    this.taskProgressChangedEvent = new YackEventManager();
    this.taskFileIdChangedEvent = new YackEventManager();

    this.pauseAll = function() {
    	
	    for(var taskId in this.taskList) {
	    	task = this.taskList[taskId];
			if(!task) {
				continue;
			}
		    task.pause()
	    }
	}

    this.resumeAll = function() {
	    for(var taskId in this.taskList) {
		    task = this.taskList[taskId];
			if(!task) {
				continue;
			}
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
        this.taskCreatedEvent.fire(task)
    }

    this.taskStateChanged = function(task) {
        this.taskStateChangedEvent.fire(task)
    }
    
    this.taskProgressChanged = function(task) {
        this.taskProgressChangedEvent.fire(task)
    }

    this.taskFileIdChanged = function(task) {
        // To delete interrupted
        this.taskFileIdChangedEvent.fire(task)
    }
}

