package actions

import (
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func ChatPage(c buffalo.Context) error {
	c.Set("title", "Chat")
	c.Set("javscript", "pages/chat.js")
	return c.Render(http.StatusOK, r.HTML("pages/chat.plush.html"))
}

func PostChat(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("pages/chat.plush.html"))
}
