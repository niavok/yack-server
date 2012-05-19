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

function YackCore() {
    
    this.init = function() {
        this.server = new YackServer()
        this.loginEvent = new YackEventManager();
        this.loginEvent = new YackEventManager();
        this.changeInterruptedFilesListEvent = new YackEventManager();
        this.changeFilesListEvent = new YackEventManager();
        this.userLogged = false;
        this.uploadTaskManager = new YackUploadTaskManager(this);
    }

    this.run = function() {
        this.checkLogin();
    }
    
    this.checkLogin = function() {
        //Check is already logged
    	var userId = localStorage.getItem("userId");
    	var userToken = localStorage.getItem("userToken");
    	
    	if(userId && userToken) {
            this.server.sendCheckLogin(userId, userToken)
        }
	}
    
    this.loginByBrowserId = function(assertion) {
        this.server.sendLoginByBrowserId(assertion)
    }
    
    this.setLogged = function(id ,token, name) {
		this.userToken = token
		this.userLogged = true;
		this.userName = name; 
		this.userId = id;
		localStorage.setItem("userId", id);
		localStorage.setItem("userToken", token);
		this.loginEvent.fire();
		this.loadFiles()
	}
	
	this.logout = function() {
    	this.userToken = null
		this.userLogged = false;
		this.userName = null; 
		this.userId = null;
		localStorage.setItem("userId", null);
		localStorage.setItem("userToken", null);
    	this.loginEvent.fire();
		this.loadFiles()
	}
	
	this.isLogged = function() {
	    return this.userLogged;
	}
	
	this.addFilesToUpload = function(files) {
        console.log('add files');
     
        for (var i = 0, file; file = files[i]; i++) {
        	task = new YackUploadTask(file, this.uploadTaskManager)
            this.uploadTaskManager.addTask(task);
        }
    }

    this.loadFiles = function() {
        if(this.userLogged) {
            this.server.loadInterruptedFiles()
            this.server.loadFiles()
        } else {
            this.changeInterruptedFilesList([]);
            this.changeFilesList([]);
        }
    }
    
    this.changeInterruptedFilesList = function(interruptedFilesList) {
        this.interruptedFilesList = interruptedFilesList;
        this.changeInterruptedFilesListEvent.fire(interruptedFilesList);
    }

    this.changeFilesList = function(filesList) {
        this.filesList = filesList;
        this.changeFilesListEvent.fire(filesList);
    }
	
	this.init();
}
