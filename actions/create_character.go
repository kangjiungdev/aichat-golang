package actions

import (
	"aichat_golang/models"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
	"unicode/utf8"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
	"github.com/google/uuid"
)

func CreateCharacterPage(c buffalo.Context) error {
	user, err := LogIn(c)
	if err != nil {
		return c.Redirect(http.StatusSeeOther, "/login")
	}
	c.Set("title", "Create Character")
	c.Set("login", true)
	c.Set("user", user)
	c.Set("javascript", "pages/create-character.js")
	return c.Render(http.StatusOK, r.HTML("pages/create-character.plush.html"))
}

func CreateCharacterOnDB(c buffalo.Context) error {
	user, err := LogIn(c)
	if err != nil {
		return c.Render(http.StatusUnauthorized, r.String(err.Error()))
	}

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
		CreatorID: user.ID,
		CreatedAt: createat,
	}

	c.Bind(character)

	character.CharacterGender = gender

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

	tx := c.Value("tx").(*pop.Connection)

	if err := tx.Create(character); err != nil {
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

func GetCharacterData(c buffalo.Context) error {
	var userName string

	user, err := LogIn(c)
	if err == nil {
		c.Set("login", true)
		c.Set("user", user)
		userName = user.Name
	} else {
		userName = "Guest"
	}

	tx := c.Value("tx").(*pop.Connection)
	body, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}
	characterID, err := strconv.Atoi(string(body))
	if err != nil {
		return c.Error(http.StatusBadRequest, err)
	}
	character := &models.Character{}
	err = tx.Find(character, characterID)
	if err != nil {
		fmt.Println(err)
	}

	creator := &models.User{}
	err = tx.Find(creator, character.CreatorID)
	if err != nil {
		return c.Render(http.StatusInternalServerError, r.String("DB 에러: "+err.Error()))
	}

	characterInfoJson := struct {
		CreatorID            string             `json:"creator_id"`
		CharacterName        string             `json:"character_name"`
		CharacterInfo        string             `json:"character_info"`
		CharacterOnelineInfo string             `json:"character_oneline_info"`
		WorldView            string             `json:"world_view"`
		FirstMsgCharacter    string             `json:"first_msg_character"`
		CharacterAssets      models.StringArray `json:"character_assets"`
	}{
		CreatorID:            creator.UserID,
		CharacterName:        character.CharacterName,
		CharacterInfo:        ReplaceMessages(character.CharacterInfo, userName, character.CharacterName),
		CharacterOnelineInfo: character.CharacterOnelineInfo,
		WorldView:            ReplaceMessages(character.WorldView, userName, character.CharacterName),
		FirstMsgCharacter:    ReplaceMessages(character.FirstMsgCharacter, userName, character.CharacterName),
		CharacterAssets:      character.CharacterAssets,
	}

	return c.Render(http.StatusOK, r.JSON(characterInfoJson))
}
