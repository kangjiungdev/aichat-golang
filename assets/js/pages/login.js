const $logInForm = $("#login-form");
const $userIdInput = $("#user-id");
const $passwordInput = $("#password");

// 입력 제한 함수
function restrictInput($el, pattern) {
  $el.on("input", function () {
    this.value = this.value.replace(pattern, "");
  });
}

// 에러 메시지 출력
function createErrorMessage(errMsg) {
  $("#error-msg").remove();
  const $msg = $("<p>").attr("id", "error-msg").text(errMsg);
  $(".auth-bottom-link").before($msg);
}

// 입력 제한 적용
restrictInput($userIdInput, /\s|[^a-zA-Z0-9]/g);
restrictInput($passwordInput, /\s|[^a-zA-Z0-9]/g);

// 로그인 제출 처리
$logInForm.on("submit", async function (e) {
  e.preventDefault();

  const userId = $userIdInput.val();
  const password = $passwordInput.val();

  if ([...userId].length < 6 || [...userId].length > 15) {
    createErrorMessage("아이디는 6자~15자여야 합니다.");
    return;
  }
  if ([...password].length < 8 || [...password].length > 20) {
    createErrorMessage("비밀번호는 8자~20자여야 합니다.");
    return;
  }

  const formData = new FormData(this);

  try {
    const res = await fetch("/login", {
      method: "POST",
      body: formData
    });
    if (res.redirected) {
      window.location.href = res.url;
    } else {
      createErrorMessage(await res.text());
    }
  } catch (err) {
    console.error(err);
  }
});