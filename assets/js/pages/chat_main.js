const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
const deleteChatBtn = document.getElementsByClassName("delete-chat")


if (deleteChatBtn.length > 0) {
    [...deleteChatBtn].forEach(element => {
        element.addEventListener("click", async (event) => {
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