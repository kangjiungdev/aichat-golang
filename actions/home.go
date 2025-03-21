package actions

import (
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func HomeHandler(c buffalo.Context) error {
	c.Set("title", "Home")
	return c.Render(http.StatusOK, r.HTML("pages/index.plush.html"))
}
