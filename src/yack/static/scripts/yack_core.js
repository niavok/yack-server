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
        this.userLogged = false;
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
	}
	
	this.isLogged = function() {
	    return this.userLogged;
	}

}
