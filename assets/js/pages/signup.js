const signUpForm = document.getElementById("signup-form")
const phoneInput = document.getElementById("phone-number")
const userIdInput = document.getElementById("user-id")
const passwordInput = document.getElementById("password")
const passwordCheckInput = document.getElementById("password-check")
const nameInput = document.getElementById("name")
const birthDateInput = document.getElementById("birth-date")


restrictInput(userIdInput, /\s|[^a-zA-Z0-9]/g); 
restrictInput(passwordInput, /\s|[^a-zA-Z0-9]/g);
restrictInput(passwordCheckInput, /\s|[^a-zA-Z0-9]/g);

signUpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!trimValue(nameInput) || !birthDateInput.value || !birthDateInput.checkValidity() || [...userIdInput.value].length < 6) {
        return
    }
    if ([...passwordInput.value].length < 8 || [...passwordInput.value].length > 20) {
      createErrorMessage("비밀번호는 8자~20자여야 합니다.")
      return
    }
    if (passwordInput.value !== passwordCheckInput.value) {
      createErrorMessage("비밀번호가 일치하지 않습니다.")
      return
    }
    if ([...phoneInput.value].length !== 13) {
      createErrorMessage("전화번호 형식이 올바르지 않습니다.")
      return
    }
    nameInput.value = trimValue(nameInput)
    const form = new FormData(signUpForm)
    const res = await fetch("/signup", {method: "POST", body: form})
    if (res.redirected) {
        window.location.href = res.url;
    } else if (!res.ok) {
      const errorMsg = await res.text()
      createErrorMessage(errorMsg)
    }
})

function trimValue(element) {
    return element.value.trim()
}


phoneInput.addEventListener("keydown", function (event) {
  // 숫자, 백스페이스, Delete, 화살표 키 허용
  if (!/[\d]/.test(event.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
  }
});

phoneInput.addEventListener("input", function () {
  // 숫자만 남기기
  let numbers = this.value.replace(/\D/g, '');

  // 자동 하이픈 추가
  if (numbers.length <= 3) {
      this.value = numbers;
  } else if (numbers.length <= 7) {
      this.value = numbers.slice(0, 3) + '-' + numbers.slice(3);
  } else {
      this.value = numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7, 11);
  }
});

function restrictInput(element, pattern) {
  element.addEventListener("input", function () {
      this.value = this.value.replace(pattern, "");
  });
}

function createErrorMessage(errMsg) {
  const errorMsgClass = document.getElementById("error-msg")
  if (errorMsgClass) {
    errorMsgClass.remove();
  }
  const msg = document.createElement("p")
  msg.innerText = errMsg
  msg.id = "error-msg"
  signUpForm.appendChild(msg)
}