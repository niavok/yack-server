package web

import (
	"fmt"
	"io/ioutil"
	"encoding/json"
	"net/http"
	"yack/model"
	"yack"
	"strconv"
	"net/url"
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
		var user = model.Model.Users.GetByAuthToken(token, id)

		var m = loginSucessMessage{true, user.Id, user.DisplayName(), user.AuthToken()}
		
		var data, _ = json.Marshal(m)
		fmt.Println("generated verify json: ",data)
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
        
        resp, _ := http.PostForm("https://browserid.org/verify", url.Values{"assertion": {token}, "audience": {yack.Hostname}})
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
            user := model.Model.Users.GetByEmail(result.Email)
            if user == nil {
                user = model.NewUser(result.Email)
            }
             
            var m = loginSucessMessage{true, user.Id, user.DisplayName(), user.AuthToken()}
		
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