package web

import (
	"fmt"
	//"io/ioutil"
	"encoding/json"
	"github.com/fredb219/yack"
	"net/http"
	"strconv"
	//"net/url"
)

type CommandHandle struct {
}

func NewCommandHandle() *CommandHandle {
	var this CommandHandle

	return &this
}

/*type loginSucessMessage struct {
	Status bool  `json:"status"`
	Id int  `json:"id"`
	Name string  `json:"name"`
	Token string  `json:"token"`
}


type loginFailMessage struct {
	Status bool `json:"status"`
	Error string `json:"error"`
}*/

type fileMessage struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	Size     int    `json:"size"`
	Link     string `json:"link"`
	CanWrite bool   `json:"can_write"`
}

type fileListMessage struct {
	Files []fileMessage
}

type commandFailMessage struct {
	Status bool   `json:"status"`
	Error  string `json:"error"`
}

func (this CommandHandle) ServeHTTP(
	w http.ResponseWriter,
	r *http.Request) {

	fmt.Println("CommandHandle: request=" + r.URL.RequestURI())

	var cmd = r.URL.Query().Get("cmd")
	var authToken = r.URL.Query().Get("auth_token")
	var authIdStr = r.URL.Query().Get("auth_id")
	var user *yack.User = nil

	fmt.Println("CommandHandle: cmd=", cmd, " authId=", authIdStr, " authToken=", authToken)

	if authToken != "" && authIdStr != "" {
		// Try to authenticate
		var authId, _ = strconv.Atoi(authIdStr)
		user = yack.GetModel().Users.GetByAuthToken(authToken, authId)

		if user == nil {
			// Invalid token or user
			writeError(w, "Invalid user or auth token")
			return
		}
	}

	fmt.Println("CommandHandle: user=", user)

	if cmd == "getInterruptedFilesList" {
		if user == nil {
			writeError(w, "You must be logged to get the interrupted files list")
			return
		}

		var files []*yack.File = user.GetInterruptedFiles()
		var fileMessages []fileMessage = make([]fileMessage, len(files))

		for i, file := range files {
			var link string = "/file?id=" + string(file.Id()) + "&sha=" + file.Sha()
			fileMessages[i] = fileMessage{file.Id(), file.Name(), file.Size(), link, file.CanWrite(user)}
		}

		var m = loginSucessMessage{true, user.Id(), user.DisplayName(), user.AuthToken()}
		var data []byte
		data, _ = json.Marshal(m)
		writeResponse(w, data)
	}

	/*   

	   files = YackFile.objects.all()
	   data = json.dumps([{'id': yackFile.pk,'size': yackFile.size, 'progress': yackFile.get_progress(), 'name': yackFile.name , 'link': "/file?pk="+str(yackFile.pk)+"&sha="+str(yackFile.sha), 'can_write': yackFile.can_write(auth_user) }  for yackFile in files  if yackFile.can_write(auth_user)  and yackFile.get_progress() < 1])
	   return HttpResponse(data,mimetype)

	*/

	/*
			if method == "check" {
				var token = r.URL.Query().Get("token")
				var id , _= strconv.Atoi(r.URL.Query().Get("id"))

				// database.users.get(auth_token=token, id=id)
				var user = model.GetModel().Users.GetByAuthToken(token, id)
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
		            user := model.GetModel().Users.GetByEmail(result.Email)
		            if user == nil {
		                model.NewUser(result.Email)
		                user = model.GetModel().Users.GetByEmail(result.Email)
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
			}*/
}

func writeResponse(w http.ResponseWriter, data []byte) {
	fmt.Println("generated response json: ", string(data))
	w.Header().Set("Content-Type", "application/javascript")
	w.WriteHeader(200)
	w.Write(data)
}

func writeError(w http.ResponseWriter, error string) {
	var m = commandFailMessage{false, error}
	var data, _ = json.Marshal(m)
	fmt.Println("generated error json: ", string(data))
	w.Header().Set("Content-Type", "application/javascript")
	w.WriteHeader(200)
	w.Write(data)
}
