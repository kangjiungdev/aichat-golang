package actions

import (
	"fmt"
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func ChatPage(c buffalo.Context) error {
	_, err := LogIn(c)
	if err != nil {
		fmt.Println(err)
		c.Redirect(http.StatusSeeOther, "/login")
	}
	c.Set("title", "Chat")
	c.Set("login", true)
	c.Set("javascript", "pages/chat.js")
	return c.Render(http.StatusOK, r.HTML("pages/chat.plush.html"))
}

func PostChat(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("pages/chat.plush.html"))
}
