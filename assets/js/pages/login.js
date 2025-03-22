const logInForm = document.getElementById("login-form")
const userIdInput = document.getElementById("user-id")
const passwordInput = document.getElementById("password")


restrictInput(userIdInput, /\s|[^a-zA-Z0-9]/g); 
restrictInput(passwordInput, /\s|[^a-zA-Z0-9]/g);

logInForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if ([...userIdInput.value].length < 6 || [...userIdInput.value].length > 15) {
        createErrorMessage("아이디는 6자~15자여야 합니다.")
        return
    }
    if ([...passwordInput.value].length < 8 || [...passwordInput.value].length > 20) {
        createErrorMessage("비밀번호는 8자~20자여야 합니다.")
        return
    }
    const form = new FormData(logInForm)
    try{
        const res = await fetch("/login", {method: "POST", body: form})
        if (res.redirected) {
            window.location.href = res.url
        } else {
            createErrorMessage(await res.text())
        }
    }
    catch (e) {
        console.log(e)
    }
})

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
    logInForm.appendChild(msg)
  }