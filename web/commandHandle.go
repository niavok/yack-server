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

func (this CommandHandle) ServeHTTP(
	w http.ResponseWriter,
	r *http.Request) {

	fmt.Println("\nCommandHandle: request=" + r.URL.RequestURI())

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

	if cmd == "getInterruptedFilesList" {
		if user == nil {
			writeError(w, "You must be logged to get the interrupted files list")
			return
		}

		writeFileList(w, user.GetInterruptedFiles(), user)
	} else if cmd == "getFileList" {
		var path = r.URL.Query().Get("path")
		if path == "" && user != nil {
			fmt.Println("CommandHandle: user id=", user.Id(), " str=", strconv.Itoa(user.Id()))
			path = strconv.Itoa(user.Id())
		}

		var pack *yack.Pack = yack.GetModel().Packs.GetByPath(path)

		if pack == nil {
			writeError(w, "No pack found at this path: "+path)
			return
		}

		if !pack.CanRead(user) {
			writeError(w, "You don't have the right to read the pack: "+path)
			return
		}

		writeFileList(w, pack.GetFiles(), user)
	} else if cmd == "getCsrfToken" {
		if user == nil {
			writeError(w, "You must be logged to get a CSRF Token")
			return
		}

		type commandCsrfMessage struct {
			CsrfToken string `json:"csrf_token"`
		}

		// TODO: implement generation and verification
		var m = commandCsrfMessage{"it_is_not_a_valid_token!"}
		var data []byte
		data, _ = json.Marshal(m)
		writeResponse(w, data)
	} else if cmd == "createFile" {
		if user == nil {
			writeError(w, "You must be logged to get create a file")
			return
		}

		// The client ask to create a new file
		var name = r.URL.Query().Get("name")
		var sha = r.URL.Query().Get("sha")
		var sizeStr = r.URL.Query().Get("size")
		var size, _ = strconv.Atoi(sizeStr)

		var file = yack.GetModel().Files.GetBySha(sha)

		if file != nil {
			// The file already exist

			if !file.CanWrite(user) {
				//TODO handle multiple user send
				// To do that, search by sha and user. If no match, search by sha.
				// If match, to avoid the user to upload the entire file, and to avoid to get the file
				// with only the hash, challenge the user asking the sha of a ramdom small
				// part of the file
				writeError(w, "You don't have the right to write the file")
				return
			}
		} else {
			file = yack.NewFile(user, name, sha, size)
		}

		type createFileMessage struct {
			File int `json:"csrf_token"`
		}

		var m = createFileMessage{file.Id()}
		var data []byte
		data, _ = json.Marshal(m)
		writeResponse(w, data)

	} else {
		writeError(w, "Unknown command: "+cmd)
	}
}

func writeFileList(w http.ResponseWriter, files []*yack.File, user *yack.User) {
	type fileMessage struct {
		Id       int     `json:"id"`
		Name     string  `json:"name"`
		Size     int     `json:"size"`
		Link     string  `json:"link"`
		Progress float64 `json: progress`
		CanWrite bool    `json:"can_write"`
	}

	type fileListMessage struct {
		Files []fileMessage `json:"files"`
	}

	var fileMessages []fileMessage = make([]fileMessage, len(files))

	for i, file := range files {
		var link string = "/file?id=" + strconv.Itoa(file.Id()) + "&sha=" + file.Sha()
		fileMessages[i] = fileMessage{file.Id(), file.Name(), file.Size(), link, file.Progress(), file.CanWrite(user)}
	}

	var m = fileListMessage{fileMessages}
	var data []byte
	data, _ = json.Marshal(m)
	writeResponse(w, data)
}

func writeResponse(w http.ResponseWriter, data []byte) {
	fmt.Println("generated response json: ", string(data))
	w.Header().Set("Content-Type", "application/javascript")
	w.WriteHeader(200)
	w.Write(data)
}

func writeError(w http.ResponseWriter, error string) {

	type commandFailMessage struct {
		Status bool   `json:"status"`
		Error  string `json:"error"`
	}

	var m = commandFailMessage{false, error}
	var data, _ = json.Marshal(m)
	fmt.Println("generated error json: ", string(data))
	writeResponse(w, data)
}
