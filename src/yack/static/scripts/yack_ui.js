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

function YackUI() {

    this.init = function() {
        this.userBlockDomElement = document.getElementById("user_block");
        this.tabsBlockDomElement = document.getElementById("tabs_block");
        this.contentBlockDomElement = document.getElementById("content_panel");
        this.consoleBlockDomElement = document.getElementById("tabs_yack_console");
        
    }
    
    this.run = function() {
        this.yackAuthComponent = new YackAuthComponent(this.userBlockDomElement);
        this.yackTabManager = new YackTabManager(this.tabsBlockDomElement, this.contentBlockDomElement);
        
        
        this.yackTabManager.addTab(new YackUploadTab());
        this.yackTabManager.addTab(new YackFilesTab());
        this.yackTabManager.addTab(new YackSettingsTab());
        this.yackTabManager.addTab(new YackMoreTabsTab());
    }
    
    this.init();

}


function YackTabManager(tabRootComponent, contentRootComponent) {

    this.tabRootComponent = tabRootComponent;
    this.contentRootComponent = contentRootComponent;
    
    
    this.init = function() {
        this.tabList = [];
        this.headerMap = {};
        this.contentMap = {};
        this.selectedTab = null
    }
    
    this.addTab = function(tab) {
        this.tabList.push(tab);
        
        var tabHeaderBlock =  document.createElement('div');
        tabHeaderBlock.setAttribute("class", "yack_unselected_tab_header");
        var tabHeaderTitleBlock =  document.createElement('div');
        tabHeaderTitleBlock.setAttribute("class", "yack_tab_header_title");
        var tabHeaderContentBlock =  document.createElement('div');
        tabHeaderContentBlock.setAttribute("class", "yack_tab_header_content");
        
        tabHeaderTitleBlock.appendChild(tab.getHeaderTitleComponent())
        tabHeaderContentBlock.appendChild(tab.getHeaderContentComponent())

        tabHeaderBlock.appendChild(tabHeaderTitleBlock)        
        tabHeaderBlock.appendChild(tabHeaderContentBlock)        
        
        this.tabRootComponent.appendChild(tabHeaderBlock)
        
        this.headerMap[tab.title] = tabHeaderBlock;
        this.contentMap[tab.title] = tab.getContentComponent();
        
        //Set click handler
        this.setClickHandler(tab)
        
        
        if(this.selectedTab == null) {
            this.select(tab)
        }
    
    }
    
    this.setClickHandler = function(tab) {
        var that = this;
        var  tabHeaderBlock = this.headerMap[tab.title]
        tabHeaderBlock.onclick = function() {
            that.select(tab)
        }
    }

    
    this.select = function(tab) {
         // Deselect previous element
         var previouslySelectedTab = this.selectedTab;
         if(previouslySelectedTab != null) {
             previouslySelectedTab.selected = false
             this.headerMap[previouslySelectedTab.title].setAttribute("class", "yack_unselected_tab_header");  
             this.setClickHandler(previouslySelectedTab)       
         }
         
         // Clean content panel
         while (this.contentRootComponent.hasChildNodes()) {
            this.contentRootComponent.removeChild(this.contentRootComponent.lastChild);
         }

         this.contentRootComponent.appendChild(this.contentMap[tab.title])
         var tabHeaderBlock =  this.headerMap[tab.title]
         tabHeaderBlock.setAttribute("class", "yack_selected_tab_header");
         tabHeaderBlock.onclick = null


         this.selectedTab = tab;
         tab.selected = true;
    
    }

    this.init();
}

function YackAuthComponent(rootComponent) {

    this.rootComponent = rootComponent;

    this.init = function() {
        this.generate()
        var self =  this;
        yack.core.loginEvent.register(function () { self.generate()})
    }

    this.onLogin = function() {
        return false;    
    }


    this.onLogout = function() {
        return false;    
    }
    
    this.generateDisconnectedState = function() {
        this.rootComponent.innerHTML = '<img id="browserid_button" alt="Sign in" src="https://browserid.org/i/sign_in_green.png" style="opacity: 1; cursor: pointer;">';
        var self = this;
    	document.getElementById('browserid_button').onclick = function() {
    		self.onUiLogin();
		}
    }
    
    this.generateConnectedState = function() {
    this.rootComponent.innerHTML = '<p>Logged as <em>'+yack.core.userName+'</em></p>';
    }
    
    this.onUiLogin = function() {
    	var self = this;
		navigator.id.getVerifiedEmail(function(assertion) {
			    if (assertion) {
		            yack.core.loginByBrowserId(assertion);
			    } else {
			        // something went wrong!  the user isn't logged in.
			    }
			});
	}
	
	this.generate = function() {
	    if(yack.core.isLogged()) {
	        this.generateConnectedState()
	    } else {
	        this.generateDisconnectedState()
	    }
	}
    

    this.init();
}

function YackUploadTab() {

    this.init = function() {
        this.title = "upload"
        this.headerTitleComponent =  document.createElement('p');
        this.headerTitleComponent.innerHTML = "Upload";


        this.headerContentComponent =  document.createElement('div');
        
        this.contentComponent =  this.generateContent();
        
        // Bind events
        var that = this;
        yack.core.uploadTaskManager.taskCreatedEvent.register(function (e) { that.onCoreTaskCreatedEvent(e)})
        yack.core.uploadTaskManager.taskStateChangedEvent.register(function (e) { that.onCoreTaskStateChangedEvent(e)})
        yack.core.uploadTaskManager.taskProgressChangedEvent.register(function (e) { that.onCoreTaskProgressChangedEvent(e)})
        yack.core.uploadTaskManager.taskFileIdChangedEvent.register(function (e) { that.onCoreTaskFileIdChangedEvent(e)})
        
        
        yack.core.changeInterruptedFilesListEvent.register(function (e) { that.onChangeInterruptedFilesListEvent(e)})
        
        
        // Drag drop
      
        this.dragDropBlock.addEventListener("dragenter", function(e) {
            console.log("dragenter "+e)
            e.stopPropagation();
            e.preventDefault();
            that.dragDropBlock.setAttribute("class", "drag_drop_block_draging");
        }, false);
        
        this.dragDropBlock.addEventListener("dragexit", function(e) {
            console.log("dragexit "+e)
            e.stopPropagation();
            e.preventDefault();
            that.dragDropBlock.setAttribute("class", "drag_drop_block");
        }, false);
        
        this.dragDropBlock.addEventListener("dragover", function(e) {
            console.log("dragover "+e)
            e.stopPropagation();
            e.preventDefault();
        }, false);
        
        this.dragDropBlock.addEventListener("drop", function(e) {
            console.log("drop "+e)
            e.stopPropagation();
            e.preventDefault();
            that.dragDropBlock.setAttribute("class", "drag_drop_block");
            
            var files = e.dataTransfer.files;
        
            that.addFilesToUpload(files)
            
        }, false);
        
    }
    
   
    
    this.getContentComponent = function() {
        return this.contentComponent;    
    }
    
    this.getHeaderTitleComponent = function() {
        return this.headerTitleComponent;
    }
    
    this.getHeaderContentComponent = function() {
        return this.headerContentComponent;
    }
    
    this.generateContent = function() {
    
        var content = document.createElement('div');
        content.setAttribute("class", "upload_tab");
        
        // Quota bar
        var quotaBar = document.createElement('div');
        quotaBar.setAttribute("class", "quota_bar");
        quotaBar.appendChild(document.createTextNode("Quota"));
                
        // Title
        var title = document.createElement('h1');
        title.appendChild(document.createTextNode("Upload"));
        
        content.appendChild(quotaBar);
        content.appendChild(title);
        
        // Upload block
        var uploadBlock = document.createElement('div');
        uploadBlock.setAttribute("class", "upload_block");
        
            // Title
            var uploadBlockTitle = document.createElement('h2');
            uploadBlockTitle.appendChild(document.createTextNode("Select files to upload"));
            // SubBox
            var uploadBlockSubBox = document.createElement('div');
            uploadBlockSubBox.setAttribute("class", "upload_block_subbox");

                // FileChooser Block
                var fileChooserBlock = document.createElement('div');
                fileChooserBlock.setAttribute("class", "file_chooser_block");

                    // File Chooser
                    this.fileChooser = document.createElement('input');
                    this.fileChooser.setAttribute("type", "file");
                    this.fileChooser.setAttribute("multiple", "multiple");
                    var that = this;
                    this.fileChooser.onchange = function() { that.onUiFileInputChangeAction() };
                    
                    // Label
                    var fileChooserLabel = document.createElement('p');
                    fileChooserLabel.appendChild(document.createTextNode("You can select multiple files ..."));
                fileChooserBlock.appendChild(this.fileChooser);
                fileChooserBlock.appendChild(fileChooserLabel);
                    
                // DragDrop Block
                this.dragDropBlock = document.createElement('div');
                this.dragDropBlock.setAttribute("class", "drag_drop_block");

                    // Image
                    var dragDropImage = document.createElement('img');
                    dragDropImage.setAttribute("src", "static/yack_drag_drop_75px.png");
                    
                    // Label
                    var dragDropLabel = document.createElement('p');
                    dragDropLabel.appendChild(document.createTextNode("... or drag them here."));
                    
                this.dragDropBlock.appendChild(dragDropImage);
                this.dragDropBlock.appendChild(dragDropLabel);
            uploadBlockSubBox.appendChild(fileChooserBlock);
            uploadBlockSubBox.appendChild(this.dragDropBlock);
            
                    
        uploadBlock.appendChild(uploadBlockTitle);
        uploadBlock.appendChild(uploadBlockSubBox);

        // Tasks block
        var tasksBlock = document.createElement('div');
        tasksBlock.setAttribute("class", "tasks_block");

            // Task list
            this.tasksList = document.createElement('div');
            this.tasksList.setAttribute("class", "tasks_list");

            // Task controls
            var tasksControls = document.createElement('div');
            tasksControls.setAttribute("class", "tasks_controls");

                // Control buttons block
                var controlButtonsBlock = document.createElement('div');
                controlButtonsBlock.setAttribute("class", "control_buttons_block");

                    // pause all button
                    var pauseAllButton = document.createElement('a');
                    pauseAllButton.setAttribute("class", "inactive_button");
                    pauseAllButton.appendChild(document.createTextNode("pause all"));
                                        
                    // resume all button
                    var resumeAllButton = document.createElement('a');
                    resumeAllButton.setAttribute("class", "inactive_button");
                    resumeAllButton.appendChild(document.createTextNode("resume all"));

                controlButtonsBlock.appendChild(pauseAllButton);
                controlButtonsBlock.appendChild(resumeAllButton);   

                // Max upload chooser
                var maxUploadBlock = document.createElement('div');
                maxUploadBlock.setAttribute("class", "control_buttons_block");
                    // Label
                    var maxUploadLabel = document.createElement('label');
                    maxUploadLabel.setAttribute("for", "max_upload_chooser");
                    maxUploadLabel.appendChild(document.createTextNode("Max concurrent upload: "));
                    
                    // Input
                    var maxUploadInput = document.createElement('input');
                    maxUploadInput.setAttribute("type", "number");
                    maxUploadInput.setAttribute("name", "max_upload_chooser");
                    maxUploadInput.setAttribute("min", "1");
                    maxUploadInput.setAttribute("max", "100");
                    maxUploadInput.setAttribute("step", "1");
                    maxUploadInput.setAttribute("value", "5");

                maxUploadBlock.appendChild(maxUploadLabel);
                maxUploadBlock.appendChild(maxUploadInput);                                

                    
                // Interrupted files block
                var interruptedFilesBlock = document.createElement('div');
                interruptedFilesBlock.setAttribute("class", "interrupted_files_block");
                     // Interrupted files title
                     var interruptedFilesTitle = document.createElement('h2');
                     interruptedFilesTitle.appendChild(document.createTextNode("Interrupted files"));
                    
                     // Interrupted files list
                     this.interruptedFilesList = document.createElement('div');
                     this.interruptedFilesList.setAttribute("class", "interrupted_files_list");
                
                     // Interrupted files label
                     var interruptedFilesLabel = document.createElement('p');
                     interruptedFilesLabel.appendChild(document.createTextNode("You must upload these files again to finish the transfer."));

                interruptedFilesBlock.appendChild(interruptedFilesTitle);                
                interruptedFilesBlock.appendChild(this.interruptedFilesList);
                interruptedFilesBlock.appendChild(interruptedFilesLabel);                                
                
            tasksControls.appendChild(controlButtonsBlock);
            tasksControls.appendChild(maxUploadBlock);
            tasksControls.appendChild(interruptedFilesBlock);
    
        tasksBlock.appendChild(this.tasksList);
        tasksBlock.appendChild(tasksControls);
           
        
        content.appendChild(quotaBar);
        content.appendChild(title);
        content.appendChild(uploadBlock);
        content.appendChild(tasksBlock);

        
        return content;
    }
    
    // Action
    this.onUiFileInputChangeAction = function() {
        
        var files = this.fileChooser.files;
        
        this.addFilesToUpload(files)
        
        return true;
    }
    
    
    this.addFilesToUpload = function(files) {
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
                alert("Your browser is too all : file.slice method is missing."); 
                return;
            }

 
           filesStruct[i] = {'name' : file.name , 'size' : file.size, 'blob' : slice}
        }
        
        yack.core.addFilesToUpload(filesStruct);
        
        this.fileChooser.value = ""
    }
    
    this.onCoreTaskCreatedEvent = function(e) {
        //this.tasksList.innerHTML = this.tasksList.innerHTML+ "<br/>Create "+e.file.name
        taskComponent = new YackUploadTaskBlockComponent(e);
        
        this.tasksList.appendChild(taskComponent.getComponent());
    }
    this.onCoreTaskStateChangedEvent = function(e) {
          //  this.tasksList.innerHTML = this.tasksList.innerHTML+ "<br/>StateChanged "+e.state
    }
    this.onCoreTaskProgressChangedEvent = function(e) {
            //this.tasksList.innerHTML = this.tasksList.innerHTML+ "<br/>ProgressChanged "+e.progress
    }
    this.onCoreTaskFileIdChangedEvent = function(e) {
           // this.tasksList.innerHTML = this.tasksList.innerHTML+ "<br/>IdChanged "+e.distantId
    }
    
    
    this.onChangeInterruptedFilesListEvent = function() {
        this.generateInterruptedFilesList()
    }
    
    this.generateInterruptedFilesList = function() {
        var list = yack.core.interruptedFilesList;
        console.log("generateInterruptedFilesList "+list.length);

        for (var i = 0, file; file = list[i]; i++) {
            var interruptedFileBlock = document.createElement('div');
            interruptedFileBlock.setAttribute("class", "interrupted_file_block");
            
                // Name
                var interruptedFileName = document.createElement('div');
                interruptedFileName.setAttribute("class", "interrupted_file_name");
                var interruptedFileNameLink = document.createElement('a');
                interruptedFileNameLink.setAttribute("href", "#");
                interruptedFileNameLink.appendChild(document.createTextNode(file.name));
                interruptedFileName.appendChild(interruptedFileNameLink);
                
                // Percent
                var interruptedFilePercent = document.createElement('div');
                interruptedFilePercent.setAttribute("class", "interrupted_file_percent");
                interruptedFilePercent.appendChild(document.createTextNode(parseInt(file.progress*100)+" %"));

                
                // Cancel
                var interruptedFileCancel = document.createElement('div');
                interruptedFileCancel.setAttribute("class", "interrupted_file_cancel");


            interruptedFileBlock.appendChild(interruptedFileName);
            interruptedFileBlock.appendChild(interruptedFilePercent);
            interruptedFileBlock.appendChild(interruptedFileCancel);


            this.interruptedFilesList.appendChild(interruptedFileBlock);
        }
    }

    
    this.init();
}

function YackProgressBar() {

    this.init = function() {
        this.element = document.createElement('canvas');
        this.element.setAttribute("class", "progress_bar");                        
    } 
    
    this.getElement = function() {
        return this.element;
    }
    
    this.setValue = function(value) {
        if (this.element.getContext){  
            var ctx = this.element.getContext('2d');  
            ctx.fillStyle = "rgb(233,233,233)";  
            ctx.fillRect (0, 0, this.element.width, this.element.height);  
  
            var pxWidth = value * this.element.width
  
            ctx.fillStyle = "rgb(54, 0, 128)";  
            ctx.fillRect (0, 0, pxWidth, this.element.height); 
            
        } else {  
            // Canvas not supported
            return
        }  
    }
    this.init();
}

function YackUploadTaskBlockComponent(task) {
    
    this.task = task;
    
    this.init = function() {
        var that = this;
        this.lastTime = null;
        this.lastProgress = null;
        
        // Block
        this.taskBlock = document.createElement('div');
        this.taskBlock.setAttribute("class", "task_block");
            //Cancel
            this.cancelButton = document.createElement('div');
            this.cancelButton.setAttribute("class", "cancel_button");

            // Title
            var taskTitle = document.createElement('h2');
             
                // Percentage
                this.taskPercent = document.createElement('span');

                // name
                this.taskName = document.createElement('a');
                this.taskName.appendChild(document.createTextNode(this.task.file.name));
            
            taskTitle.appendChild(this.taskPercent);
            taskTitle.appendChild(this.taskName);
            
            // SubBlock 2 colomns
            var twoColumn = document.createElement('div');
            twoColumn.setAttribute("class", "two_column");
                // Left colomn
                var leftColumn = document.createElement('div');
                leftColumn.setAttribute("class", "left_column");
                    // Progress block
                    var progressBlock = document.createElement('div');
                    progressBlock.setAttribute("class", "progress_block");
                        // Progress bar
                        var progressBarBlock = document.createElement('div');
                        progressBarBlock.setAttribute("class", "progress_bar_block");
                        this.progressBar = new YackProgressBar();
                        progressBarBlock.appendChild(this.progressBar.getElement());
                                            
                        // Progress size
                        this.progressSize = document.createElement('div');
                        this.progressSize.setAttribute("class", "progress_size");
                    progressBlock.appendChild(progressBarBlock);
                    progressBlock.appendChild(this.progressSize);

                        
                    // Status block
                    var statusBlock = document.createElement('div');
                    statusBlock.setAttribute("class", "status_block");
                        // Status
                        this.status = document.createElement('div');
                        this.status.setAttribute("class", "status");
                        
                        // Time
                        this.time = document.createElement('div');
                        this.time.setAttribute("class", "time");
                    statusBlock.appendChild(this.status);
                    statusBlock.appendChild(this.time);


                leftColumn.appendChild(progressBlock);
                leftColumn.appendChild(statusBlock);
                        
                // Rigth colomn
                var rightColumn = document.createElement('div');
                rightColumn.setAttribute("class", "right_column");
                    // Pause button
                    this.pauseButton = document.createElement('a');
                    this.pauseButton.setAttribute("class", "inactive_button");
                    this.pauseButton.appendChild(document.createTextNode("pause"));
                                        
                    // Resume button
                    this.resumeButton = document.createElement('a');
                    this.resumeButton.setAttribute("class", "inactive_button");
                    this.resumeButton.appendChild(document.createTextNode("resume"));
                
                rightColumn.appendChild(this.pauseButton);
                rightColumn.appendChild(this.resumeButton);

            twoColumn.appendChild(leftColumn);                
            twoColumn.appendChild(rightColumn);

        this.taskBlock.appendChild(this.cancelButton);            
        this.taskBlock.appendChild(taskTitle);
        this.taskBlock.appendChild(twoColumn);
               
        this.updateGlobalPercent();
        this.updateProgressBar();
        this.updateProgressSize();
        this.updateProgressTime();
        this.updateStatus();
        this.updateButtonsState();
        
        // Handlers
        yack.core.uploadTaskManager.taskCreatedEvent.register(function (e) { that.onCoreTaskCreatedEvent(e)})
        yack.core.uploadTaskManager.taskStateChangedEvent.register(function (e) { that.onCoreTaskStateChangedEvent(e)})
        yack.core.uploadTaskManager.taskProgressChangedEvent.register(function (e) { that.onCoreTaskProgressChangedEvent(e)})
        yack.core.uploadTaskManager.taskFileIdChangedEvent.register(function (e) { that.onCoreTaskFileIdChangedEvent(e)})
    }

    this.getComponent = function() {
        return this.taskBlock;
    }
    
    
    this.updateGlobalPercent = function() {
        
        
        var percent = 0;
        //Update percent 
		if(this.task.state == "analysing") {
            percent = 0
		} else if (this.task.state == "paused") {
		  // Don't change the percent value
          return;
		} else if (this.task.state == "uploading") {
            percent = parseInt(this.task.progress*100)
	    } else if (this.task.state == "uploaded") {
            percent = 100
		}
         
        // Clean
        while (this.taskPercent.hasChildNodes()) {
            this.taskPercent.removeChild(this.taskPercent.lastChild);
        }
        this.taskPercent.appendChild(document.createTextNode(percent + ' %'));
    }
    
    this.updateProgressBar = function() {
        
        var percent = 0;
        //Update percent 
		if(this.task.state == "analysing") {
            percent = 0
		} else if (this.task.state == "paused") {
		  // Don't change the percent value
          return;
		} else if (this.task.state == "uploading") {
            percent = this.task.progress
	    } else if (this.task.state == "uploaded") {
            percent = 1
		}
        
        this.progressBar.setValue(percent);
                 
        
    }
    
    this.updateProgressSize = function() {
        var percent = 0;
        //Update percent 
		if(this.task.state == "analysing") {
            percent = 0;
		} else if (this.task.state == "paused") {
		  // Don't change the percent value
          return;
		} else if (this.task.state == "uploading") {
            percent = this.task.progress;
	    } else if (this.task.state == "uploaded") {
            percent = 1
		}
                        
        // Clean
        while (this.progressSize.hasChildNodes()) {
            this.progressSize.removeChild(this.progressSize.lastChild);
        }
        
        if(percent == 1) {
            this.progressSize.appendChild(document.createTextNode(yack_renderSize(this.task.file.size)));        
        } else {
            this.progressSize.appendChild(document.createTextNode(yack_renderSizeProgress(percent, this.task.file.size)));        
        }
        
    }
    
    this.updateProgressTime = function() {
        
        
        if((this.task.state == "analysing" || this.task.state == "uploading")  && this.lastState == this.task.state) {
            // No valid progress
            if(this.task.progress < 0) {
                return;
            }


            var currentTime =   new Date().getTime(); // Milliseconds
            console.log("Current time : "+ currentTime);
            console.log("Last time : "+ this.lastTime);
            console.log("Current progress : "+ this.task.progress);
            console.log("Last progress : "+ this.lastProgress);

            
            
            if(this.lastTime != null && this.lastProgress != null) {
            
                console.log("Compute estimated time");
                // Compute estimated time
                var deltaTime = (currentTime - this.lastTime)/1000; //In seconds 
                var deltaProgress = this.task.progress - this.lastProgress;
                
                if(deltaTime < 2) {
                    return;
                }
                
                if(deltaProgress <= 0) {
                    return;
                }
                
                var progressPerSecond = deltaProgress/deltaTime;
                
                var sizePerSecond = progressPerSecond* this.task.file.size;
                
                var remainingTime = (1-this.task.progress)/ progressPerSecond; // In secondes
                
                
                console.log("deltaTime: "+ deltaTime);
                console.log("deltaProgress: "+ deltaProgress);
                console.log("progressPerSecond: "+ progressPerSecond);
                console.log("sizePerSecond: "+ sizePerSecond);
                console.log("remainingTime: "+ remainingTime);
                console.log("output: "+ yack_renderTime(remainingTime) + " at " + yack_renderSize(sizePerSecond)+"/s");
                
                
                
                
                // Clean
                while (this.time.hasChildNodes()) {
                    this.time.removeChild(this.time.lastChild);
                }

                this.time.appendChild(document.createTextNode(yack_renderTime(remainingTime) + " at " + yack_renderSize(sizePerSecond)+"/s")); 

            }               
            this.lastTime = currentTime;
            this.lastProgress = this.task.progress
            this.lastState = this.task.state
        } else {
            // Clean
            while (this.time.hasChildNodes()) {
                this.time.removeChild(this.time.lastChild);
            }
           this.lastTime = null;
           this.lastState = this.task.state    
        }

    }
    
    this.updateStatus = function() {
        // Clean
        while (this.status.hasChildNodes()) {
            this.status.removeChild(this.status.lastChild);
        }
        
        //Update status        
		if(this.task.state == "analysing" ) {
		    var percent = 0;
		    if(this.task.progress != -1) {
		        percent = parseInt(this.task.progress*100);
		    }
		    this.status.appendChild(document.createTextNode("Analysing (" + percent + " %)"));
		} else if(this.task.state == "paused") {
		    this.status.appendChild(document.createTextNode("Paused"));
		} else if(this.task.state == "uploading") {
		    this.status.appendChild(document.createTextNode("Uploading"));		
        } else if (this.task.state == "uploaded") {
		    this.status.appendChild(document.createTextNode("Uploaded"));		
		}
        
    }
    
    this.updateButtonsState = function() {
        //Update button state        
        var that = this;
		if(this.task.state == "analysing" || this.task.state == "uploading") {
            this.resumeButton.setAttribute("class", "inactive_button");
            this.resumeButton.onclick = null;
            
            this.pauseButton.setAttribute("class", "active_button");
            this.pauseButton.onclick = function() {
                that.task.pause();
            };
		} else if(this.task.state == "uploaded") {
         	this.resumeButton.setAttribute("class", "inactive_button");
            this.resumeButton.onclick = null;
            
            this.pauseButton.setAttribute("class", "inactive_button");
            this.pauseButton.onclick = null;
            
		} else {
            this.resumeButton.setAttribute("class", "active_button");
            this.resumeButton.onclick = function() {
                that.task.start();
            };
            
            this.pauseButton.setAttribute("class", "inactive_button");
            this.pauseButton.onclick = null;
		}
    }
    
    this.onCoreTaskCreatedEvent = function(e) {
        if(e != this.task) {
            return
        }
        this.updateStatus()
        this.updateGlobalPercent()

    }
    this.onCoreTaskStateChangedEvent = function(e) {
        if(e != this.task) {
            return
        }
        this.updateStatus()
        this.updateGlobalPercent()
        this.updateButtonsState()
        this.updateProgressBar();
        this.updateProgressSize();
        this.updateProgressTime();
    }
    this.onCoreTaskProgressChangedEvent = function(e) {
        if(e != this.task) {
            return
        }
        this.updateStatus()
        this.updateGlobalPercent()
        this.updateProgressBar();
        this.updateProgressSize();
        this.updateProgressTime();
    }
    this.onCoreTaskFileIdChangedEvent = function(e) {
        if(e != this.task) {
            return
        }

    }
    
    this.init()
}

function YackFilesTab() {

    this.init = function() {
        this.title = "files"
        this.headerTitleComponent =  document.createElement('p');
        this.headerTitleComponent.innerHTML = "Files";


        this.headerContentComponent =  document.createElement('div');
        
        this.contentComponent =  this.generateContent();
        
        // Bind events
        var that = this;
        yack.core.uploadTaskManager.taskStateChangedEvent.register(function (e) { that.onCoreTaskStateChangedEvent(e)})
        yack.core.changeFilesListEvent.register(function (e) { that.onChangeFilesListEvent(e)})
        
    }
    
   
    
    this.getContentComponent = function() {
        return this.contentComponent;    
    }
    
    this.getHeaderTitleComponent = function() {
        return this.headerTitleComponent;
    }
    
    this.getHeaderContentComponent = function() {
        return this.headerContentComponent;
    }
    
    this.generateContent = function() {
    
        var content = document.createElement('div');
        content.setAttribute("class", "upload_tab");
        
        // Quota bar
        var quotaBar = document.createElement('div');
        quotaBar.setAttribute("class", "quota_bar");
        quotaBar.appendChild(document.createTextNode("Quota"));
                
        // Title
        var title = document.createElement('h1');
        title.appendChild(document.createTextNode("Files"));
        
        content.appendChild(quotaBar);
        content.appendChild(title);
        
                 
        // Files block
        var filesBlock = document.createElement('div');
        filesBlock.setAttribute("class", "files_block");
           // files list
           this.filesList = document.createElement('div');
           this.filesList.setAttribute("class", "files_list");
           
           filesBlock.appendChild(this.filesList);
        
        content.appendChild(quotaBar);
        content.appendChild(title);
        content.appendChild(filesBlock);
        
        return content;
    }
    
    // Action
    
    this.onCoreTaskStateChangedEvent = function(e) {
          //  this.tasksList.innerHTML = this.tasksList.innerHTML+ "<br/>StateChanged "+e.state
    }

    
    this.onChangeFilesListEvent = function() {
        this.generateFilesList()
    }
    
    this.generateFilesList = function() {
        var list = yack.core.filesList;
        console.log("generateFilesList "+list.length);

        for (var i = 0, file; file = list[i]; i++) {
            var fileBlock = document.createElement('div');
            fileBlock.setAttribute("class", "file_block");
            
                // Name
                var fileName = document.createElement('div');
                fileName.setAttribute("class", "file_name");
                var fileNameLink = document.createElement('a');
                fileNameLink.setAttribute("href", file.link);
                //fileNameLink.setAttribute("target", "_blank");
                fileNameLink.appendChild(document.createTextNode(file.name));
                fileName.appendChild(fileNameLink);

            fileBlock.appendChild(fileName);

            this.filesList.appendChild(fileBlock);
        }
    }

    
    this.init();
}

function YackMoreTabsTab() {

    this.init = function() {
        this.title = "moretabs"
        this.headerTitleComponent =  document.createElement('p');
        this.headerTitleComponent.innerHTML = "More tabs";


        this.headerContentComponent =  document.createElement('div');
        
        this.contentComponent =  document.createElement('div');
        this.contentComponent.innerHTML = "More tabs !"
    }
    
    this.getContentComponent = function() {
        return this.contentComponent;    
    }
    
    this.getHeaderTitleComponent = function() {
        return this.headerTitleComponent;
    }
    
    this.getHeaderContentComponent = function() {
        return this.headerContentComponent;
    }
    
    this.init();
}

function YackSettingsTab() {

    this.init = function() {
        this.title = "settings"
        this.headerTitleComponent =  document.createElement('p');
        this.headerTitleComponent.innerHTML = "Settings";


        this.headerContentComponent =  document.createElement('div');
        
        this.contentComponent =  document.createElement('div');
        this.contentComponent.innerHTML = "Settings tab !"
    }
    
    this.getContentComponent = function() {
        return this.contentComponent;    
    }
    
    this.getHeaderTitleComponent = function() {
        return this.headerTitleComponent;
    }
    
    this.getHeaderContentComponent = function() {
        return this.headerContentComponent;
    }
    
    this.init();
}

