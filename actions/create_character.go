package actions

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gobuffalo/buffalo"
)

type CreateCharcterData struct {
	CharacterName        string     `form:"character-name"`
	CharacterInfo        string     `form:"character-info"`
	CharacterGender      string     `form:"character-gender"`
	CharacterOnelineInfo string     `form:"character-oneline-info"`
	WorldView            string     `form:"world-view"`
	FirstMsgCharacter    string     `form:"first-msg-character"`
	CharacterAssets      []*os.File `form:"character-assets"`
	CreatorComment       string     `form:"creator-comment"`
}

func CreateCharacterPage(c buffalo.Context) error {
	c.Set("title", "Create Character")
	c.Set("javscript", "pages/create_character.js")
	return c.Render(http.StatusOK, r.HTML("pages/create_character.plush.html"))
}

func CreateCharacterOnDB(c buffalo.Context) error {
	CharacterData := CreateCharcterData{
		CharacterName:        c.Request().FormValue("character-name"),
		CharacterInfo:        c.Request().FormValue("character-info"),
		CharacterGender:      c.Request().FormValue("character-gender"),
		CharacterOnelineInfo: c.Request().FormValue("character-oneline-info"),
		WorldView:            c.Request().FormValue("world-view"),
		FirstMsgCharacter:    c.Request().FormValue("first-msg-character"),
		CreatorComment:       c.Request().FormValue("creator-comment"),
	}

	dirname := "assets/images/character_img"
	os.MkdirAll(dirname, 0777)

	for _, n := range c.Request().MultipartForm.File["character-assets"] {
		uploadFile, err := n.Open()
		if err != nil {
			fmt.Println(err)
			continue
		}
		path := fmt.Sprintf("%s/%s", dirname, filepath.Base(n.Filename))
		file, err := os.Create(path)
		if err != nil {
			fmt.Println(err)
			uploadFile.Close()
			continue
		}
		_, err = io.Copy(file, uploadFile)
		if err != nil {
			fmt.Println(err)
		}
		CharacterData.CharacterAssets = append(CharacterData.CharacterAssets, file)
		uploadFile.Close()
		file.Close()
	}

	return c.Redirect(303, "/create-character-success")
}

func CreateCharacterSuccess(c buffalo.Context) error {
	c.Set("title", "Create Character Success")
	return c.Render(http.StatusOK, r.HTML("pages/complete-create-character.plush.html"))
}
