package web

import (
	"github.com/fredb219/yack"
	"fmt"
	"strconv"
	"net/http"
	"os"
	"io"
	"path/filepath"
	"strings"
)

type FileHandle struct {
}

func NewFileHandle() *FileHandle {
	var this FileHandle

	return &this
}

func (this FileHandle) ServeHTTP(
	w http.ResponseWriter,
	r *http.Request) {
	

    fmt.Println("FileHandle: request=" + r.URL.RequestURI()+" range="+r.Header.Get("Range"))
    var sha = r.URL.Query().Get("sha")
	var id, _ = strconv.ParseInt(r.URL.Query().Get("id"), 10, 64)

    var file *yack.File = yack.GetModel().Files.GetById(id)
	
    if file == nil {
	    w.WriteHeader(404)
    	fmt.Fprint(w, "404 - File not found.")

	    return
    }
    
    if file.Sha() != sha {
        w.WriteHeader(403)
    	fmt.Fprint(w, "403 - Sha is invalid.")
	    return
    }
    
    if file.UploadState() != yack.UPLOADED {
        w.WriteHeader(403)
    	fmt.Fprint(w, "403 - Upload not finished.")
	    return
    }


    f, err := os.Open(file.Path())
    if err != nil {
        w.WriteHeader(505)
    	fmt.Fprint(w, "505 - Failed to read file on server.")
    	fmt.Println(err)
	    return
	}




    extension := filepath.Ext(file.Name())
	fmt.Println("extension="+extension)
    
    if extension == ".webm" {
        w.Header().Set("Content-Type", "video/webm")
        //w.Header().Set("X-Content-Duration", "0")
        w.Header().Set("Content-Disposition", "inline; filename=\""+file.Name()+"\"")
    } else if extension == ".ogg" {
        w.Header().Set("Content-Type", "audio/ogg")
        //w.Header().Set("X-Content-Duration", "15")
        w.Header().Set("Content-Disposition", "inline; filename=\""+file.Name()+"\"")
    } else {
        w.Header().Set("Content-Type", "application/binary")
        w.Header().Set("Content-Disposition", "attachement; filename=\""+file.Name()+"\"")
    }



    w.Header().Set("Accept-Ranges", "bytes")
    
    var requestRange string = r.Header.Get("Range")

    var sendLength int64 = file.Size() 
    var sendOffet int64 = 0
    var isRange bool = false
    
    if requestRange != "" {
        fmt.Println("requestRange ! "+ requestRange)
        isRange = true
        if strings.HasPrefix(requestRange, "bytes=") {
            var requestRangeValues string = requestRange[6:len(requestRange)]
            fmt.Println("requestRangeValues ! "+ requestRangeValues)
            if strings.HasSuffix(requestRangeValues, "-") {
                fmt.Println("sendOffet : "+ requestRangeValues[:len(requestRangeValues)-1])
                sendOffet, _ = strconv.ParseInt(requestRangeValues[:len(requestRangeValues)-1], 10, 64)
                sendLength -= sendOffet
            }
        }
        
    }

    w.Header().Set("Content-Length", strconv.FormatInt(sendLength,10))
    if isRange {
        fmt.Println("Content-Range: bytes "+ strconv.FormatInt(sendOffet,10) + "-"+ strconv.FormatInt(sendOffet + sendLength - 1 ,10) + "/"+ strconv.FormatInt(file.Size(),10))
        w.Header().Set("Content-Range","bytes "+ strconv.FormatInt(sendOffet,10) + "-"+ strconv.FormatInt(sendOffet + sendLength - 1 ,10) + "/"+ strconv.FormatInt(file.Size(),10))
    
	    w.WriteHeader(206)
	    if sendOffet > 0 {
	        fmt.Println("sendOffet "+ strconv.FormatInt(sendOffet,10))
	        f.Seek(sendOffet, 0)
	    }
	} else {    			
	    w.WriteHeader(200)
	}
	
	
    n, errWrite := io.Copy(w, f)
    if errWrite != nil {
    	fmt.Println("Error on write file to http write : ",errWrite)
	}
    fmt.Println("Writen bytes : ",n, "/", sendLength)
}
