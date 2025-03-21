package actions

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"

	"github.com/gobuffalo/buffalo"
)

type CreateCharcterData struct {
	CharacterName        string                  `form:"character-name"`
	CharacterInfo        string                  `form:"character-info"`
	CharacterGender      string                  `form:"character-gender"`
	CharacterOnelineInfo string                  `form:"character-oneline-info"`
	WorldView            string                  `form:"world-view"`
	FirstMsgCharacter    string                  `form:"first-msg-character"`
	CharacterAssets      []*multipart.FileHeader `form:"character-assets"`
	CreatorComment       string                  `form:"creator-comment"`
}

func CreateCharacterPage(c buffalo.Context) error {
	c.Set("title", "Create Character")
	c.Set("javscript", "pages/create_character.js")
	return c.Render(http.StatusOK, r.HTML("pages/create_character.plush.html"))
}

func CreateCharacterOnDB(c buffalo.Context) error {
	characterData := CreateCharcterData{
		CharacterName:        c.Request().FormValue("character-name"),
		CharacterInfo:        c.Request().FormValue("character-info"),
		CharacterGender:      c.Request().FormValue("character-gender"),
		CharacterOnelineInfo: c.Request().FormValue("character-oneline-info"),
		WorldView:            c.Request().FormValue("world-view"),
		FirstMsgCharacter:    c.Request().FormValue("first-msg-character"),
		CharacterAssets:      c.Request().MultipartForm.File["character-assets"],
		CreatorComment:       c.Request().FormValue("creator-comment"),
	}

	dirname := "assets/images/character_img"
	os.MkdirAll(dirname, 0777)

	for _, n := range characterData.CharacterAssets {
		uploadFile, err := n.Open()
		if err != nil {
			fmt.Println(err)
			continue
		}
		filepath := fmt.Sprintf("%s/%s", dirname, n.Filename)
		file, err := os.Create(filepath)
		if err != nil {
			fmt.Println(err)
			uploadFile.Close()
			continue
		}
		_, err = io.Copy(file, uploadFile)
		if err != nil {
			fmt.Println(err)
		}
		file.Close()
		uploadFile.Close()
	}

	c.Set("title", "post")
	return c.Render(http.StatusOK, r.HTML("pages/create_character.plush.html"))
}
