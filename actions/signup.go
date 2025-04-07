package actions

import (
	"aichat_golang/models"
	"fmt"
	"net/http"
	"regexp"
	"time"
	"unicode/utf8"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
	"golang.org/x/crypto/bcrypt"
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
	var signupForm struct {
		UserId          string `form:"user-id"`
		Password        string `form:"password"`
		Name            string `form:"name"`
		PhoneNumber     string `form:"phone-number"`
		BirthDateString string `form:"birth-date"`
	}
	if err := c.Bind(&signupForm); err != nil {
		return err
	}

	fmt.Println(signupForm.UserId)

	if signupForm.UserId == "" || signupForm.Password == "" || signupForm.Name == "" || signupForm.PhoneNumber == "" || signupForm.BirthDateString == "" {
		return c.Render(http.StatusBadRequest, r.String("입력값이 올바르지 않습니다."))
	}

	// ID는 영어+숫자만 허용 (JS와 동일한 규칙 적용)
	idRegex := regexp.MustCompile(`^[a-zA-Z0-9]+$`)
	if !idRegex.MatchString(signupForm.UserId) {
		fmt.Println("아이디는 영어와 숫자만 입력 가능합니다.")
		return c.Render(http.StatusBadRequest, r.String("아이디는 영어와 숫자만 입력 가능합니다."))
	}

	if utf8.RuneCountInString(signupForm.UserId) < 6 || utf8.RuneCountInString(signupForm.UserId) > 15 {
		fmt.Println("아이디는 6자~15자여야 합니다.")
		return c.Render(http.StatusBadRequest, r.String("아이디는 6자~15자여야 합니다."))
	}

	if utf8.RuneCountInString(signupForm.Password) < 8 || utf8.RuneCountInString(signupForm.Password) > 20 {
		fmt.Println("비밀번호는 8자~20자여야 합니다.")
		return c.Render(http.StatusBadRequest, r.String("비밀번호는 8자~20자여야 합니다."))
	}

	// 전화번호 형식 검사
	phoneRegex := regexp.MustCompile(`^\d{3}-\d{4}-\d{4}$`)
	if !phoneRegex.MatchString(signupForm.PhoneNumber) {
		fmt.Println("전화번호 형식이 올바르지 않습니다.")
		return c.Render(http.StatusBadRequest, r.String("전화번호 형식이 올바르지 않습니다."))
	}

	birthDate, err := time.Parse("2006-01-02", signupForm.BirthDateString)
	if err != nil {
		fmt.Println("Error parsing date:", err)
		return c.Render(http.StatusBadRequest, r.String("생년월일 형식이 올바르지 않습니다."))
	}

	tx := c.Value("tx").(*pop.Connection)

	existUser := &models.User{}
	err = tx.Where("user_id = ?", signupForm.UserId).First(existUser)
	if err == nil {
		return c.Render(http.StatusConflict, r.String("해당 아이디를 가진 유저가 이미 존재합니다."))
	}

	createat, err := time.Parse("2006-01-02", time.Now().Format("2006-01-02"))
	if err != nil {
		fmt.Println(err)
		return c.Render(http.StatusInternalServerError, r.String("현재 날짜를 가져올 수 없습니다: "+err.Error()))
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(signupForm.Password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println(err)
		return c.Render(http.StatusInternalServerError, r.String("비밀번호 해시 실패: "+err.Error()))
	}

	user := &models.User{
		UserID:      signupForm.UserId,
		Password:    string(hashedPassword),
		Name:        signupForm.Name,
		PhoneNumber: signupForm.PhoneNumber,
		BirthDate:   birthDate,
		CreatedAt:   createat,
	}

	if err := tx.Create(user); err != nil {
		fmt.Println(err)
		return c.Render(http.StatusInternalServerError, r.String("유저 생성 실패: "+err.Error()))
	}

	c.Session().Set("current_user_id", user.ID)
	c.Session().Save()

	return c.Redirect(http.StatusSeeOther, "/success/create?what=account")
}
