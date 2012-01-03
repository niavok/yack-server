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
        this.yackTabManager.addTab(new YackSettingsTab());
        this.yackTabManager.addTab(new YackMoreTabsTab());
        
        
         this.yackTabManager.selectByTitle(this.extractUrlParams()["tab"]);
        
        
        
        if(this.yackTabManager.selectedTab == null) {
             this.yackTabManager.select(this.yackTabManager.tabList[0]);
        }
        
        var that =  this;
        window.onpopstate = function(event) {
            that.yackTabManager.selectByTitle(event.state.tab);
        }
    }
    
    this.extractUrlParams = function(){	

	    var t = location.search.substring(1).split('&');

	    var f = [];

	    for (var i=0; i<t.length; i++){

		    var x = t[ i ].split('=');

		    f[x[0]]=x[1];

	    }

	    return f;
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
        tabHeaderTitleBlock.setAttribute("class", "yack_tab_header_title");
        var tabHeaderContentBlock =  document.createElement('div');
        tabHeaderContentBlock.setAttribute("class", "yack_tab_header_content");
        
        tabHeaderTitleBlock.appendChild(tab.getHeaderTitleComponent())
        tabHeaderContentBlock.appendChild(tab.getHeaderContentComponent())

        tabHeaderBlock.appendChild(tabHeaderTitleBlock)        
        tabHeaderBlock.appendChild(tabHeaderContentBlock)        
        
        this.tabRootComponent.appendChild(tabHeaderBlock)
        
        this.headerMap[tab.title] = tabHeaderBlock;
        this.contentMap[tab.title] = tab.getContentComponent();
        
        //Set click handler
        this.setClickHandler(tab)
        
    
    }
    
    this.setClickHandler = function(tab) {
        var that = this;
        var  tabHeaderBlock = this.headerMap[tab.title]
        tabHeaderBlock.onclick = function() {
            that.select(tab)
            history.pushState({tab: tab.title}, tab.getHeaderTitleComponent(), "/?tab="+tab.title);
        }
    }

    
    this.select = function(tab) {
         
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
    
    this.selectByTitle = function(tabTitle) {
        for (var i = 0, tab; tab = this.tabList[i]; i++) {
            if(tab.title == tabTitle) {
                this.select(tab);
                break;
            }
        }
        
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
    this.rootComponent.innerHTML = '<p>Logged as <em>'+yack.core.userName+'</em></p>';
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

function YackProgressBar() {

    this.init = function() {
        this.element = document.createElement('canvas');
        this.element.setAttribute("class", "progress_bar");                        
    } 
    
    this.getElement = function() {
        return this.element;
    }
    
    this.setValue = function(value) {
        if (this.element.getContext){  
            var ctx = this.element.getContext('2d');  
            ctx.fillStyle = "rgb(233,233,233)";  
            ctx.fillRect (0, 0, this.element.width, this.element.height);  
  
            var pxWidth = value * this.element.width
  
            ctx.fillStyle = "rgb(54, 0, 128)";  
            ctx.fillRect (0, 0, pxWidth, this.element.height); 
            
        } else {  
            // Canvas not supported
            return
        }  
    }
    this.init();
}


function YackMoreTabsTab() {

    this.init = function() {
        this.title = "moretabs"
        this.headerTitleComponent =  document.createElement('p');
        this.headerTitleComponent.innerHTML = "More tabs";


        this.headerContentComponent =  document.createElement('div');
        
        this.contentComponent =  document.createElement('div');
        this.contentComponent.innerHTML = "More tabs !"
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

function YackSettingsTab() {

    this.init = function() {
        this.title = "settings"
        this.headerTitleComponent =  document.createElement('p');
        this.headerTitleComponent.innerHTML = "Settings";


        this.headerContentComponent =  document.createElement('div');
        
        this.contentComponent =  document.createElement('div');
        this.contentComponent.innerHTML = "Settings tab !"
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

