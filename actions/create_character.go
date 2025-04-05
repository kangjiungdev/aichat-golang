package actions

import (
	"aichat_golang/models"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
	"unicode/utf8"

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
	c.Set("javascript", "pages/create-character.js")
	return c.Render(http.StatusOK, r.HTML("pages/create-character.plush.html"))
}

func CreateCharacterOnDB(c buffalo.Context) error {
	user, _ := LogIn(c)
	now := time.Now()
	createat, err := time.Parse("2006-01-02", now.Format("2006-01-02"))
	if err != nil {
		fmt.Println(err)
	}

	var gender string
	if g := c.Request().FormValue("character-gender"); g == "male" {
		gender = "남자"
	} else if g == "female" {
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

	if err := validateLength(c, "캐릭터 이름", character.CharacterName, 15); err != nil {
		return err
	}
	if err := validateLength(c, "캐릭터 소개", character.CharacterInfo, 1000); err != nil {
		return err
	}
	if err := validateLength(c, "한 줄 소개", character.CharacterOnelineInfo, 50); err != nil {
		return err
	}
	if err := validateLength(c, "세계관 설명", character.WorldView, 1000); err != nil {
		return err
	}
	if err := validateLength(c, "첫 대사", character.FirstMsgCharacter, 500); err != nil {
		return err
	}
	if err := validateLength(c, "창작자 코멘트", character.CreatorComment, 500); err != nil {
		return err
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

func validateLength(c buffalo.Context, fieldName, value string, max int) error {
	if utf8.RuneCountInString(value) > max {
		msg := fmt.Sprintf("%s은(는) %d자 이내여야 합니다.", fieldName, max)
		return c.Render(http.StatusBadRequest, r.String(msg))
	}
	return nil
}
