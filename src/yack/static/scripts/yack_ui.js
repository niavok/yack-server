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
    }

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
    this.rootComponent.innerHTML = '<p>Logged as <em>'+this.userName+'</em></p>';
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
