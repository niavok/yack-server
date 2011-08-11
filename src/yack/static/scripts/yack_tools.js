function yack_render_size(size) {
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
