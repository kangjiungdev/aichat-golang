package actions

import (
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func CreateAccount(c buffalo.Context) error {
	c.Set("title", "Create Account")
	return c.Render(http.StatusOK, r.HTML("pages/create-account.plush.html"))
}
