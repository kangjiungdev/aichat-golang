const $signUpForm = $("#signup-form");
const $phoneInput = $("#phone-number");
const $userIdInput = $("#user-id");
const $passwordInput = $("#password");
const $passwordCheckInput = $("#password-check");
const $nameInput = $("#name");
const $birthDateInput = $("#birth-date");

restrictInput($userIdInput, /\s|[^a-zA-Z0-9]/g);
restrictInput($passwordInput, /\s|[^a-zA-Z0-9]/g);
restrictInput($passwordCheckInput, /\s|[^a-zA-Z0-9]/g);

$signUpForm.on("submit", async function (e) {
  e.preventDefault();

  const userId = trimValue($userIdInput)
  if (userId.length < 6 || userId.length > 15) {
    createErrorMessage("아이디는 6자~15자여야 합니다.");
    return;
  }

  const pw = trimValue($passwordInput);
  if (pw.length < 8 || pw.length > 20) {
    createErrorMessage("비밀번호는 8자~20자여야 합니다.");
    return;
  }
  if (pw !== $passwordCheckInput.val()) {
    createErrorMessage("비밀번호가 일치하지 않습니다.");
    return;
  }

  const name = trimValue($nameInput)
  if(!name) {
    createErrorMessage("이름을 입력해 주세요.");
    return;
  }
  if (name.length > 15) {
    createErrorMessage("이름은 15자 이하(좌우 공백 제외)여야 합니다.");
    return;
  }

  if (trimValue($phoneInput).length !== 13) {
    createErrorMessage("전화번호 형식이 올바르지 않습니다.");
    return;
  }

  if (!$birthDateInput.val() || !$birthDateInput[0].checkValidity()) {
    createErrorMessage("생년월일 형식이 올바르지 않습니다.");
    return;
  }

  $nameInput.val(trimValue($nameInput));

  const form = new FormData($signUpForm[0]);
  const res = await fetch("/signup", { method: "POST", body: form });

  if (res.redirected) {
    window.location.href = res.url;
  } else if (!res.ok) {
    const errorMsg = await res.text();
    createErrorMessage(errorMsg);
  }
});

$phoneInput.on("keydown", function (e) {
  const key = e.key;
  if (!/[\d]/.test(key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight"].includes(key)) {
    e.preventDefault();
  }
});

$phoneInput.on("input", function () {
  let numbers = $(this).val().replace(/\D/g, "");

  if (numbers.length <= 3) {
    $(this).val(numbers);
  } else if (numbers.length <= 7) {
    $(this).val(numbers.slice(0, 3) + "-" + numbers.slice(3));
  } else {
    $(this).val(numbers.slice(0, 3) + "-" + numbers.slice(3, 7) + "-" + numbers.slice(7, 11));
  }
});

function restrictInput($el, pattern) {
  $el.on("input", function () {
    $(this).val($(this).val().replace(pattern, ""));
  });
}

function trimValue($el) {
  return $el.val().trim();
}

function createErrorMessage(errMsg) {
  $("#error-msg").remove();
  const $msg = $("<p>")
    .attr("id", "error-msg")
    .text(errMsg)

  $signUpForm.append($msg);
  $signUpForm.css("padding-bottom", "1.7vh");
}