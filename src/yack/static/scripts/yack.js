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
    }

    this.reload = function() {
        this.downloadList.clear()
        this.uploadList.clear()


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
            filesStruct[i] = {'name' : file.name , 'size' : file.size, 'blob' : file.webkitSlice(0,file.size)}
        }
        
        self.addFiles(filesStruct);
        return true;
    }

    this.pauseAllAction = function() {
	    this.uploadList.pauseAll()
	    return false;
    }

    this.resumeAllAction = function() {
        this.uploadList.resumeAll()
	    return false;
    }

}






    
	
yack = new Yack();
yack.init();
yack.reload();

