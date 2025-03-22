package actions

import (
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
)

func CreateSuccess(c buffalo.Context) error {
	what := c.Request().URL.Query().Get("what")
	var FirstStringUpperWhat string
	if what == "" {
		return c.Redirect(http.StatusFound, "/")
	}
	user, err := LogIn(c)
	if err == nil {
		c.Set("login", true)
		c.Set("user", user)
	}

	FirstStringUpperWhat = strings.ToUpper(what[:1]) + what[1:]
	c.Set("title", FirstStringUpperWhat+" successfully created")
	c.Set("createWhat", FirstStringUpperWhat)
	return c.Render(http.StatusOK, r.HTML("pages/create_success.plush.html"))
}
