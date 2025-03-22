package actions

import (
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func HomeHandler(c buffalo.Context) error {
	user, err := LogIn(c)
	if err == nil {
		c.Set("login", true)
		c.Set("user", user)
	}
	c.Set("title", "Home")
	return c.Render(http.StatusOK, r.HTML("pages/index.plush.html"))
}
