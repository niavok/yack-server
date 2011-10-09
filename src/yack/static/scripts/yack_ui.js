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
        tabHeaderTitleBlock.setAttribute("class", "yabk_tab_header_title");
        var tabHeaderContentBlock =  document.createElement('div');
        tabHeaderContentBlock.setAttribute("class", "yabk_tab_header_content");
        
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
         alert("select")
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

function YackUploadTab() {

    this.init = function() {
        this.title = "upload"
        this.headerTitleComponent =  document.createElement('p');
        this.headerTitleComponent.innerHTML = "Upload";


        this.headerContentComponent =  document.createElement('div');
        
        this.contentComponent =  document.createElement('div');
        this.contentComponent.innerHTML = "Plop !"
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

function YackFilesTab() {

    this.init = function() {
        this.title = "files"
        this.headerTitleComponent =  document.createElement('p');
        this.headerTitleComponent.innerHTML = "Files";


        this.headerContentComponent =  document.createElement('div');
        
        this.contentComponent =  document.createElement('div');
        this.contentComponent.innerHTML = "Files tab !"
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



