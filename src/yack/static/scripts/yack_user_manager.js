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


function YackUserManager(rootElement){

	this.rootElement = rootElement;

    this.init = function() {
    	//Check is already logged
    	userId = localStorage.getItem("userId");
    	userToken = localStorage.getItem("userToken");
    	
    	if(userId && userToken) {
    		this.checkLogin(userId, userToken);
		}
		this.generateLoginButton();
    	 
    }
    
    this.generateLoginButton = function() {
    	var self = this;
    	this.rootElement.innerHTML = '<img id="browserid_button" alt="Sign in" src="https://browserid.org/i/sign_in_green.png" style="opacity: 1; cursor: pointer;">';
    	document.getElementById('browserid_button').onclick = function() {
    		self.login();
		}
    	
    	    	
    }
    
    this.generateUserBar = function() {
    this.rootElement.innerHTML = '<p>Logged as <em>'+this.userName+'</em></p>';
    }
    
    this.checkLogin = function(userId, userToken) {
    	var self = this;
		
    	yack_ajaxCall('/yack/login?method=check&id='+userId+'&token='+userToken, function(response) {
    		console.log(response)
			if(response[0].status) {
				self.setLogged(response[0].id, response[0].token, response[0].name)
			} 							
		});			    	
		
	}
    
    this.login = function() {
    	var self = this;
		navigator.id.getVerifiedEmail(function(assertion) {
			    if (assertion) {
			    	yack_ajaxCall('/yack/login?method=browserid&token='+assertion, function(response) {
			    		console.log(response)
						if(response[0].status) {
							self.setLogged(response[0].id, response[0].token, response[0].name)
						} 							
					});			    	
			    } else {
			        // something went wrong!  the user isn't logged in.
			    }
			});
	}

	this.setLogged = function(id ,token, name) {
		this.userToken = token
		this.userLogged = true;
		this.userName = name; 
		this.userId = id;
		localStorage.setItem("userId", id);
		localStorage.setItem("userToken", token);
		this.generateUserBar();
	}
    
    this.init();
}

