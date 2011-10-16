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



function yack_renderTime(time) {

	
	if(time > 3600) {
	    var hours = parseInt(time / 3600);
	    var minutes = parseInt((time - hours*3600)/60)
	    
	    var output = hours + " "+yack_pluralize(hours, "hour", "hours")
	    if(minutes > 0) {
	        output += " "+minutes + " "+yack_pluralize(minutes, "minute", "minutes")
	    }
        return output
	} else if(time > 60) {
		var minutes = parseInt(time / 60);
	    var seconds = parseInt(time - minutes*60)
	    
	    var output = minutes + " "+yack_pluralize(minutes, "minute", "minutes")
	    if(seconds > 0) {
	        output += " "+seconds + " "+yack_pluralize(seconds, "second", "seconds")
	    }
        return output
	} else {
		var seconds = parseInt(time);
		return seconds + " "+yack_pluralize(seconds, "second", "seconds")
	}
	
}	


function yack_pluralize(num, singular, plural) {
    if( num == 1) {
        return singular;
    } else {
        return plural; 
    }
}



function yack_renderSize(size) {
	var value;
	
	if(size > 1000000000) {
		value = size/1000000000
		unit = "Go"
	} else if(size > 1000000) {
		value = size/1000000
		unit = "Mo"
	} else if(size > 1000) {
		value = size/1000
		unit = "Ko"
	} else {
		value = size
		unit = "bytes"
	}
	
	if(value >= 100) {
		displayValue = parseInt(value);
	} else if(value >= 10) {
		displayValue = parseInt(value*10)/10;
	} else  {
		displayValue = parseInt(value*100)/100;
	}
	
	return displayValue + " "+ unit;

}	


function yack_renderSizeProgress(progress, size) {
	var value;
	var progressvalue;
    var displayValue
    var displayProgressValue
	
	if(size > 1000000000) {
		value = size/1000000000
		progressvalue = (progress * size)/1000000000
		unit = "Go"
	} else if(size > 1000000) {
		value = size/1000000
		progressvalue = (progress * size)/1000000
		unit = "Mo"
	} else if(size > 1000) {
		value = size/1000
		progressvalue = (progress * size)/1000
		unit = "Ko"
	} else {
		value = size
		progressvalue = progress * size
		unit = "bytes"
	}
	
	if(value >= 100) {
		displayValue = parseInt(value);
	} else if(value >= 10) {
		displayValue = parseInt(value*10)/10;
	} else  {
		displayValue = parseInt(value*100)/100;
	}
	
	if(progressvalue >= 100) {
		displayProgressValue = parseInt(progressvalue);
	} else if(value >= 10) {
		displayProgressValue = parseInt(progressvalue*10)/10;
	} else  {
		displayProgressValue = parseInt(progressvalue*100)/100;
	}
	
	return displayProgressValue + " / " + displayValue + " "+ unit;

}
	

function  yack_ajaxCall(url, callback) {
    var xhr_object = new XMLHttpRequest();
    
    xhr_object.onreadystatechange = function(){                   
    	if (xhr_object.readyState == 4) {
    		 callback(eval(xhr_object.responseText));
		}
	}    
	
    xhr_object.open("GET", url , true);
    xhr_object.send(null);
    
    return eval(xhr_object.responseText);

}

