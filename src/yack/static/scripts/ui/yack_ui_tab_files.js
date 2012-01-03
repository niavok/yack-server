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
        
        // Files block
        var filesBlock = document.createElement('div');
        filesBlock.setAttribute("class", "files_block");
           // files list
           this.filesList = document.createElement('div');
           this.filesList.setAttribute("class", "files_list");
           
           filesBlock.appendChild(this.filesList);
        
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
                var fileName = document.createElement('h2');
                fileName.setAttribute("class", "file_name");
                var fileNameLink = document.createElement('a');
                fileNameLink.setAttribute("href", file.link);
                //fileNameLink.setAttribute("target", "_blank");
                fileNameLink.appendChild(document.createTextNode(file.name));
                fileName.appendChild(fileNameLink);
                
                //Link
                var fileLink = document.createElement('div');
                fileLink.setAttribute("class", "file_link");
                var fileLinkInput = document.createElement('input');
                fileLinkInput.setAttribute("type", "text");
                if(location.port == "80" || location.port == "443") {
                    fileLinkInput.setAttribute("value", location.protocol + "//" + location.hostname + file.link);
                } else {
                    fileLinkInput.setAttribute("value", location.protocol + "//" + location.hostname+ ":"+ location.port + file.link);
                }
                fileLink.appendChild(fileLinkInput);

            fileBlock.appendChild(fileName);
            fileBlock.appendChild(fileLink);

            this.filesList.appendChild(fileBlock);
        }
    }

    
    this.init();
}

