package model

import (
	"fmt"
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
)



type userList struct{
	
}

func (this userList) GetByAuthToken(authToken string, id int) *User {
	var myUser User
	fmt.Println("userList: Get authToken=%s id=%d",authToken,id);
	return &myUser
}

func (this userList) GetByEmail(email string) *User{
	var myUser User
	fmt.Println("userList: Get email=%s", email);
	return &myUser
}

type Model struct{
	Users userList
}

var model Model

func Init() {
    
	db, err := sql.Open("sqlite3", "/home/fred/.local/share/yack/yack.db")
    if err != nil {
        fmt.Println(err)
        return
    }
	defer db.Close()
	
	rows, err := db.Query("select id, name from user")
    if err != nil {
    fmt.Println(err)
    return
    }
    defer rows.Close()
    for rows.Next() {
    var id int
    var name string
    rows.Scan(&id, &name)
    println(id, name)
    }
    rows.Close()
	
}

func GetModel() Model {
    return model
}


