function YackDownloadList(rootElement){

	this.rootElement = rootElement;

    this.clear = function(){
        this.rootElement.innerHTML = "";
    }
	
	this.update = function() {
		
		var url = "/yack/command?format=json&cmd=getFileList";
		var self = this
	
		yack_ajaxCall(url, function(response) {
			
			for(var i=0; i< response.length; i++) {
				file = response[i];
				if(file.progress == 1) {
					self.addFileBlock(file.name, file.size,  file.description, file.link)
				} else {
					console.log("Interupted file : "+file.name+" at "+file.progress*100+" %");
				}
			}
		
		});
	}
	
	this.addFileBlock = function(name, size, description, link) {
		var block = '';
		block+='<div>';
		block+='<a href="'+link+'">'+name+'</a> - Size: '+yack_render_size(size);
		block+="<div>";
		
		this.rootElement.innerHTML = block + this.rootElement.innerHTML;
	}
	
    this.addFileByTask = function(task) {
        console.log(task.state);
        this.addFileById(task.distantId);
    }

	this.addFileById = function(id) {
		var url = "/yack/command?format=json&cmd=getFileLink&pk="+id;
		var self = this
	
		yack_ajaxCall(url, function(response) {
			
			self.addFileBlock(response[0].name, response[0].size,  response[0].description, response[0].link);
			
		});
	}
	
}

