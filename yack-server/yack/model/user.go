package model

import (
)

type User struct{
	Id int
}

func NewUser(email string) *User {
	var user User
	return &user
}


func (this User) DisplayName() string{
	return "TODO:return real name"
}

func (this User) AuthToken() string{
	return "TODO:return real token"
}
