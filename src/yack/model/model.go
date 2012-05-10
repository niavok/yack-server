package model

import (
	"fmt"
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

type model struct{
	Users userList
}

func (this model) init() {

}

var Model model