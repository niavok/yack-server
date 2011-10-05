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
        this.rootComponent.innerHTML = "plop";
    }

    this.onLogin = function() {
        return false;    
    }


    this.onLogout = function() {
        return false;    
    }

    this.init();
}
