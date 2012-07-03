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


function YackDownloadList(rootElement){

	this.rootElement = rootElement;

    this.clear = function(){
        this.rootElement.innerHTML = "";
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

    this.addFileByDescription = function(file) {
        this.addFileBlock(file.name, file.size, file.description, file.link);
    }
	
}

