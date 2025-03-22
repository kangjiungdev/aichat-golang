package actions

import (
	"aichat_golang/models"
	"fmt"
	"net/http"
	"regexp"
	"time"
	"unicode/utf8"

	"github.com/gobuffalo/buffalo"
)

func SignUp(c buffalo.Context) error {

	_, err := LogIn(c)
	if err == nil {
		return c.Redirect(http.StatusSeeOther, "/")
	}

	now := time.Now()

	hundredYearsAgo := now.AddDate(-100, 0, 0)

	c.Set("today", now.Format("2006-01-02"))
	c.Set("hundredYearsAgo", hundredYearsAgo.Format("2006-01-02"))
	c.Set("title", "Sign up")
	c.Set("javascript", "pages/signup.js")
	return c.Render(http.StatusOK, r.HTML("pages/signup.plush.html"))
}

func CreateAccountInDB(c buffalo.Context) error {
	userId := c.Request().FormValue("user-id")
	password := c.Request().FormValue("password")
	name := c.Request().FormValue("name")
	phoneNumber := c.Request().FormValue("phone-number")
	birthDateString := c.Request().FormValue("birth-date")

	if userId == "" || password == "" || name == "" || phoneNumber == "" || birthDateString == "" {
		return c.Render(http.StatusBadRequest, r.String("입력값이 올바르지 않습니다."))
	}

	// ID는 영어+숫자만 허용 (JS와 동일한 규칙 적용)
	idRegex := regexp.MustCompile(`^[a-zA-Z0-9]+$`)
	if !idRegex.MatchString(userId) {
		fmt.Println("아이디는 영어와 숫자만 입력 가능합니다.")
		return c.Render(http.StatusBadRequest, r.String("아이디는 영어와 숫자만 입력 가능합니다."))
	}

	// 전화번호 형식 검사
	phoneRegex := regexp.MustCompile(`^\d{3}-\d{4}-\d{4}$`)
	if !phoneRegex.MatchString(phoneNumber) {
		fmt.Println("전화번호 형식이 올바르지 않습니다.")
		return c.Render(http.StatusBadRequest, r.String("전화번호 형식이 올바르지 않습니다."))
	}

	if utf8.RuneCountInString(password) < 8 || utf8.RuneCountInString(password) > 20 {
		fmt.Println("비밀번호는 8자~20자여야 합니다.")
		return c.Render(http.StatusBadRequest, r.String("비밀번호는 8자~20자여야 합니다."))
	}
	if utf8.RuneCountInString(userId) < 6 || utf8.RuneCountInString(userId) > 15 {
		fmt.Println("아이디는 6자~15자여야 합니다.")
		return c.Render(http.StatusBadRequest, r.String("아이디는 6자~15자여야 합니다."))
	}
	existUser := &models.User{}
	err := models.DB.Where("user_id = ?", userId).First(existUser)
	if err == nil {
		return c.Render(http.StatusBadRequest, r.String("해당 아이디를 가진 유저가 이미 존재합니다."))
	}

	birthDate, err := time.Parse("2006-01-02", birthDateString)
	if err != nil {
		fmt.Println("Error parsing date:", err)
		return c.Render(http.StatusBadRequest, r.String("Error parsing date:", err))
	}

	createat, err := time.Parse("2006-01-02", time.Now().Format("2006-01-02"))
	if err != nil {
		fmt.Println(err)
	}

	user := &models.User{
		UserID:      userId,
		Password:    password,
		Name:        name,
		PhoneNumber: phoneNumber,
		BirthDate:   birthDate,
		CreatedAt:   createat,
	}

	if err := models.DB.Create(user); err != nil {
		fmt.Println(err)
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]string{"error": err.Error()}))
	}

	c.Session().Set("current_user_id", user.ID)
	c.Session().Save()

	return c.Redirect(http.StatusSeeOther, "/create-success?what=account")
}
