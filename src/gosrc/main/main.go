package main

import (
	"fmt"
	"net/http"
	"html/template"
	"bytes"
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


type Hello struct{}

func (h Hello) ServeHTTP(
			w http.ResponseWriter, 
			r *http.Request) {
	fmt.Fprintf(w, "Hello! ");
}

type Hello2 struct{}

func (h Hello2) ServeHTTP(
			w http.ResponseWriter, 
			r *http.Request) {
	fmt.Fprintf(w, "Hello2! "+r.URL.RequestURI());
}
			
func main() {
	fmt.Println("Yack 1.0.0a8");
	
	var h Hello
	var indexHandle = NewIndexHandle("resources/")
	//var h2 Hello2
	//http.Handle("/", h)
	http.Handle("/bar", h)
	//http.Handle("/resources/", h2)
	
	http.Handle("/", indexHandle)
	http.Handle("/resources/",http.StripPrefix("/resources", http.FileServer(http.Dir("src/yack/static"))))
	//http.Handle("/", http.FileServer(http.Dir("src/yack/static/")))
	
	
	//http.ListenAndServe("localhost:4000",h)
	http.ListenAndServe("localhost:4000", nil)
}