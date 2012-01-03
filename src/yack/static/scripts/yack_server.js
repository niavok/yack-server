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

function YackServer() {

    this.sendLoginByBrowserId = function(assertion) {
        yack_ajaxCall('/yack/login?method=browserid&token='+assertion, function(response) {
		    if(response[0].status) {
                yack.core.setLogged(response[0].id, response[0].token, response[0].name);
		    } else {
		        yack.error(response[0].error);
		    }
		})
    }
    
    this.sendCheckLogin = function(userId, userToken) {
            yack_ajaxCall('/yack/login?method=check&id='+userId+'&token='+userToken, function(response) {
			if(response[0].status) {
				yack.core.setLogged(response[0].id, response[0].token, response[0].name)
			} else {
    	        yack.error(response[0].error);
			}					
		});		
    }
    
    this.loadInterruptedFiles = function() {
    
        yack_ajaxCall('/yack/command?format=json&cmd=getInterrupedFilesList&auth_id='+yack.core.userId+'&auth_token='+yack.core.userToken, function(response) {
			if(!response[0].error) {
                yack.core.changeInterruptedFilesList(response);
			} else {
    	        yack.error(response[0].error);
			}					
		});		
    }
    
    this.loadFiles = function() {
    
        yack_ajaxCall('/yack/command?format=json&cmd=getFileList&auth_id='+yack.core.userId+'&auth_token='+yack.core.userToken, function(response) {
			if(!response[0].error) {
                yack.core.changeFilesList(response);
			} else {
    	        yack.error(response[0].error);
			}					
		});		
    }
    
    
    
}
