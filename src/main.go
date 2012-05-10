package main

import (
	"fmt"
	"net/http"
	"html/template"
	"bytes"
	"yack/web"
)

type StaticFilePath struct {
    StaticUrl string
}

type IndexHandle struct{
	indexCache string
}

func NewIndexHandle(resourcePath string) *IndexHandle {
	var this IndexHandle
	
	t, _ := template.ParseFiles("src/yack/templates/uploader/index.html")
	param := StaticFilePath{StaticUrl:resourcePath}

	var data bytes.Buffer
    t.Execute(&data, param)
    this.indexCache = data.String() 

	return &this
}

func (this IndexHandle) ServeHTTP(
			w http.ResponseWriter, 
			r *http.Request) {
	
	fmt.Println("IndexHandle: request="+r.URL.RequestURI());
	fmt.Fprintf(w, this.indexCache);
}
			
func main() {
	fmt.Println("Yack 1.0.0a8");
	
	var indexHandle = NewIndexHandle("static/")
	var loginHandle = web.NewLoginHandle()
	http.Handle("/", indexHandle)
	http.Handle("/yack/login", loginHandle)
	http.Handle("/static/",http.StripPrefix("/static", http.FileServer(http.Dir("src/yack/static"))))
	
	http.ListenAndServe("localhost:4000", nil)
}