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

// Yack main script


function Yack() {
    
    this.init = function() {
        this.console = document.getElementById('yack_console');
        this.print("Initialising Yack");

        this.core = new YackCore();
        this.ui = new YackUI();

        this.print("Yack Initialised");
    }

    this.run = function() {
        yack.print("Starting yack");
        this.core.run();
        this.ui.run();
        yack.print("Yack Started");
    }

    this.print = function(text) {
        this.console.appendChild(document.createElement('br'));
        this.console.appendChild(document.createTextNode(text));
    }
    
    this.init();
}
yack = new Yack();
yack.run();

