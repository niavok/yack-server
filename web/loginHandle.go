package web

import (
	"fmt"
	"io/ioutil"
	"encoding/json"
	"net/http"
	"strconv"
	"net/url"
	"github.com/fredb219/yack"
)


type LoginHandle struct{
	indexCache string
}

func NewLoginHandle() *LoginHandle {
	var this LoginHandle

	return &this
}

type loginSucessMessage struct {
	Status bool  `json:"status"`
	Id int  `json:"id"`
	Name string  `json:"name"`
	Token string  `json:"token"`
}


type loginFailMessage struct {
	Status bool `json:"status"`
	Error string `json:"error"`
}


func (this LoginHandle) ServeHTTP(
			w http.ResponseWriter, 
			r *http.Request) {
	
	fmt.Println("LoginHandle: request="+r.URL.RequestURI());
	
	
	var method = r.URL.Query().Get("method")
	
	
	fmt.Println("LoginHandle: method="+method);
	
	if method == "check" {
		var token = r.URL.Query().Get("token")
		var id , _= strconv.Atoi(r.URL.Query().Get("id"))
		
		// database.users.get(auth_token=token, id=id)
		var user = yack.GetModel().Users.GetByAuthToken(token, id)
        var data []byte
        
        if user == nil {
            var m = loginFailMessage{false, fmt.Sprintf("AuthToken is invalid or perimed: %s", token)}
        	data, _ = json.Marshal(m)
        } else {
		    var m = loginSucessMessage{true, user.Id(), user.DisplayName(), user.AuthToken()}
		    data, _ = json.Marshal(m)
		}
		fmt.Println("generated verify json: ",string(data))
		w.Header().Set("Content-Type", "application/javascript")
		w.WriteHeader(200)
		w.Write(data)
		
        //except ObjectDoesNotExist:
        //    data = json.dumps([{'status':  False}])
    
	} else if method == "browserid" {
	 	var token = r.URL.Query().Get("token")
        
        type browserIdVerificationResponse struct {
        	Status string `json:"status"`
        	Email string `json:"email"`
        	Audience string `json:"audience"`
        	Expires int64 `json:"expiers"`
        	Issuer string `json:"issuer"`
        	Reason string `json:"reason"`
        }
        
        resp, _ := http.PostForm("https://browserid.org/verify", url.Values{"assertion": {token}, "audience": {Hostname}})
		defer resp.Body.Close()
		resultJson, _ := ioutil.ReadAll(resp.Body)
		
		fmt.Printf("%s\n",resultJson)
        
        var result browserIdVerificationResponse
        err := json.Unmarshal(resultJson, &result)
        
        if err != nil {
        	fmt.Println("error",err)
        }
        
        fmt.Println(result)
        
        var data []byte
        
        if result.Status == "okay" {
        	fmt.Println("okay")
            user := yack.GetModel().Users.GetByEmail(result.Email)
            if user == nil {
                yack.NewUser(result.Email)
                user = yack.GetModel().Users.GetByEmail(result.Email)
            }
             
            var m = loginSucessMessage{true, user.Id(), user.DisplayName(), user.AuthToken()}
		
			data, _ = json.Marshal(m)
			fmt.Println("generated json: ",string(data))
                
        } else {
        
        	var m = loginFailMessage{false, fmt.Sprintf("BrowserId status is '%s' ('okay' excepted), reason: %s", result.Status, result.Reason)}
        	data, _ = json.Marshal(m)
        }
        w.Header().Set("Content-Type", "application/javascript")
		w.WriteHeader(200)
		w.Write(data)
	
	} else {
		w.WriteHeader(404)
	}
}
