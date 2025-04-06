package actions

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func ErrorHandlerMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		err := next(c)

		// 404 처리
		if c.Request().Response.StatusCode == 404 {
			return PageNotFound(404, err, c)
		}

		// 다른 에러 핸들
		if err != nil {
			return c.Error(http.StatusInternalServerError, err)
		}

		return nil
	}
}

func PageNotFound(status int, _ error, c buffalo.Context) error {
	// 로그인 상태 처리
	user, err := LogIn(c)
	if err != nil {
		c.Set("login", false)
	} else {
		c.Set("login", true)
		c.Set("user", user)
	}

	const tokenKey = "authenticity_token"

	// 세션에서 토큰 가져오기
	raw := c.Session().Get(tokenKey)

	var realToken []byte
	if raw == nil {
		realToken, _ = generateRandomBytes(tokenLength)
		c.Session().Set(tokenKey, realToken)
	} else {
		realToken = raw.([]byte)
	}

	// 마스크된 토큰 생성
	maskedToken, err := mask(realToken)
	if err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}

	// 템플릿에 넣기
	c.Set(tokenKey, maskedToken)

	c.Set("title", "404 - Page Not Found")

	// 404 페이지 렌더링
	return c.Render(status, r.HTML("pages/404.plush.html"))
}

const (
	tokenLength = 32
	tokenKey    = "authenticity_token"
)

func generateRandomBytes(n int) ([]byte, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)
	return b, err
}

func xorToken(a, b []byte) []byte {
	n := len(a)
	if len(b) < n {
		n = len(b)
	}
	res := make([]byte, n)
	for i := 0; i < n; i++ {
		res[i] = a[i] ^ b[i]
	}
	return res
}

func mask(realToken []byte) (string, error) {
	otp, err := generateRandomBytes(tokenLength)
	if err != nil {
		return "", err
	}
	masked := xorToken(otp, realToken)
	combined := append(otp, masked...)
	return base64.StdEncoding.EncodeToString(combined), nil
}
