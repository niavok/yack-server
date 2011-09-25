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

// Yack main script

var yack_input;
var yack_workList;
var yack_worker;
var yack_dlList;

function Yack() {

    var self = this;

    this.init = function() {
        this.checkApiCompatibility();

        this.fileChooserElement = document.getElementById('main_file');
        
        // Bind actions        
        this.fileChooserElement.onchange = this.fileInputChangeAction
        document.getElementById('resume_all').onclick = this.resumeAllAction;
        document.getElementById('pause_all').onclick = this.pauseAllAction;
        
        this.downloadList = new YackDownloadList(document.getElementById('files_to_download'));
        this.uploadList = new YackUploadList(document.getElementById('files_to_upload'));
        this.taskManager = new YackTaskManager(this);

        //Login
        this.userManager = new YackUserManager(document.getElementById('user_block'));
    }

    this.reload = function() {
        this.downloadList.clear();
        this.uploadList.clear();

        //Get current file list
        var url = "/yack/command?format=json&cmd=getFileList";
		var self = this;
	
		yack_ajaxCall(url, function(response) {
			
			for(var i=0; i< response.length; i++) {
				file = response[i];
				if(file.progress == 1) {
                    // Uploaded file
					self.downloadList.addFileByDescription(file);
				} else {
                    // Not uploaded file
					self.uploadList.addInterruptedFile(file);
				}
			}
		
		});

    }

    this.checkApiCompatibility = function() {
        // Check for the various File API support.

        if (window.File && window.FileReader && window.FileList && window.Blob) {
            
            // Great success! All the File APIs are supported.
        } else {
            alert('The File APIs are not fully supported in this browser.');
        }
    }

    this.addFiles = function(files) {
        console.log('add files');
     
        for (var i = 0, file; file = files[i]; i++) {
        	task = new YackTask(file, this.taskManager)
            this.taskManager.addTask(task);
        }
    }

    // Callback
    this.fileUploaded = function(task) {
        this.taskManager.deleteTask(task)
        this.downloadList.addFileByTask(task)
    }

    // Action
    this.fileInputChangeAction = function() {
        
        var files = self.fileChooserElement.files;
        var filesStruct = [];
        
        for (var i = 0, file; file = files[i]; i++) {
            if(file.slice) {
                slice = file.slice(0,file.size);
            } else if(file.webkitSlice) {
                slice = file.webkitSlice(0,file.size);
            } else if(file.mozSlice) {
            	slice = file.mozSlice(0,file.size);
            } else {
                // Fail to find slice method
                alter("Your browser is too all : file.slice method is missing."); 
                return;
            }

 
           filesStruct[i] = {'name' : file.name , 'size' : file.size, 'blob' : slice}
        }
        
        self.addFiles(filesStruct);
        return true;
    }

    this.pauseAllAction = function() {
	    self.taskManager.pauseAll()
	    return false;
    }

    this.resumeAllAction = function() {
        self.taskManager.resumeAll()
	    return false;
    }

}
	
yack = new Yack();
yack.init();
yack.reload();

