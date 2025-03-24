const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
const deleteChatBtn = document.getElementsByClassName("delete-chat")


if (deleteChatBtn.length > 0) {
    [...deleteChatBtn].forEach(element => {
        element.addEventListener("click", async (event) => {
            event.preventDefault();
            try {
                const req = await fetch(`/chat/${element.value}`, { method: "DELETE", headers: { "X-CSRF-Token": csrfToken } })
                if (req.ok) {
                    const chatCard = element.closest(".chat-card");
                    if (chatCard) {
                        chatCard.remove();
                      }
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