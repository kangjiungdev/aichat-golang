const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
const deleteChatBtn = document.getElementsByClassName("delete-chat")
const userName = document.querySelectorAll(".chat-footer-username")
const chatCharacterImage = document.querySelectorAll(".chat-img")

const userInfos = JSON.parse(localStorage.getItem("userInfos"))

userName.forEach(element => {
    chatID = element.dataset.chatId
    if (userInfos?.[chatID] && typeof userInfos[chatID] === "object") {
        element.innerText = userInfos[chatID].userName
    }
})

chatCharacterImage.forEach(element => {
    chatID = element.dataset.chatId
    if (userInfos?.[chatID] && typeof userInfos[chatID] === "object") {
        element.src = userInfos[chatID].characterImg
    }

    const imgSrcWhenLoadErr = JSON.parse(element.dataset.img)[0]


    if (element.complete) {
        if (chatCharacterImage.naturalWidth === 0) {
          console.error('로드 실패: 이미지가 없거나 깨졌음');
          element.src = `/${imgSrcWhenLoadErr}`
        }
      } else {
        element.addEventListener('error', () => {
          console.error('로드 실패: 잘못된 URL이거나 이미지 없음');
          element.src = `/${imgSrcWhenLoadErr}`
        });
      }
})


if (deleteChatBtn.length > 0) {
    [...deleteChatBtn].forEach(element => {
        element.addEventListener("click", async event => {
            event.preventDefault();
            const chatID = element.value
            try {
                const req = await fetch(`/chat/${chatID}`, { method: "DELETE", headers: { "X-CSRF-Token": csrfToken } })
                if (req.ok) {
                    const chatCard = element.closest(".chat-card");
                    if (chatCard) {
                        chatCard.remove();
                      }
                    let userInfos = JSON.parse(localStorage.getItem("userInfos")) || {};
                    delete userInfos[chatID];
                    localStorage.setItem("userInfos", JSON.stringify(userInfos));
                } else {
                    const res = await req.text()
                    console.log(res)
                }
            }
            catch (e) {
                console.error(e)
            }
        })
    });
}