package actions

import (
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func LogOut(c buffalo.Context) error {
	c.Session().Clear()
	c.Session().Save()
	return c.Redirect(http.StatusSeeOther, "/")
}
