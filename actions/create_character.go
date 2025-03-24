package actions

import (
	"aichat_golang/models"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gobuffalo/buffalo"
	"github.com/google/uuid"
)

func CreateCharacterPage(c buffalo.Context) error {
	user, err := LogIn(c)
	if err != nil {
		fmt.Println(err)
		c.Redirect(http.StatusSeeOther, "/login")
	}
	c.Set("title", "Create Character")
	c.Set("login", true)
	c.Set("user", user)
	c.Set("javascript", "pages/create_character.js")
	return c.Render(http.StatusOK, r.HTML("pages/create_character.plush.html"))
}

func CreateCharacterOnDB(c buffalo.Context) error {
	user, _ := LogIn(c)
	now := time.Now()
	createat, err := time.Parse("2006-01-02", now.Format("2006-01-02"))
	if err != nil {
		fmt.Println(err)
	}

	var gender string
	if i := c.Request().FormValue("character-gender"); i == "male" {
		gender = "남자"
	} else if i == "female" {
		gender = "여자"
	} else {
		gender = "기타"
	}

	character := &models.Character{
		CreatorID:            user.ID,
		CharacterName:        c.Request().FormValue("character-name"),
		CharacterInfo:        c.Request().FormValue("character-info"),
		CharacterGender:      gender,
		CharacterOnelineInfo: c.Request().FormValue("character-oneline-info"),
		WorldView:            c.Request().FormValue("world-view"),
		FirstMsgCharacter:    c.Request().FormValue("first-msg-character"),
		CreatorComment:       c.Request().FormValue("creator-comment"),
		CreatedAt:            createat,
	}

	dirname := "assets/images/character_img"
	os.MkdirAll(dirname, 0777)

	for _, n := range c.Request().MultipartForm.File["character-assets"] {
		uploadFile, err := n.Open()
		if err != nil {
			fmt.Println(err)
			continue
		}
		fileName := fmt.Sprintf("%s_user%d_%s%s", now.Format("20060102_150405"), character.CreatorID, uuid.New().String(), filepath.Ext(n.Filename))
		fmt.Println(fileName)
		path := fmt.Sprintf("%s/%s", dirname, fileName)
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
		character.CharacterAssets = append(character.CharacterAssets, path)
		uploadFile.Close()
		file.Close()
	}

	if err := models.DB.Create(character); err != nil {
		fmt.Println(err)
		return c.Render(http.StatusInternalServerError, r.String(err.Error()))
	}

	return c.Redirect(http.StatusSeeOther, "/success/create?what=character")
}
