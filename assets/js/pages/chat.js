const aiReqForm = document.getElementById("ai-req-form")
const deleteChatBtn = document.getElementById("delete-chat")
const segments = window.location.pathname.split("/")
const chatID = segments[2]

aiReqForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(aiReqForm)
    form.append("chat-id", chatID)
    try {
        const req = await fetch("/ai-response", {method:"POST", body: form})
        const res = await req.text()
        console.log(res)
    }
    catch (e) {
        console.error(e)
    }
})

deleteChatBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
        const req = await fetch(`/chat/${chatID}`, { method: "DELETE" })
        if (req.redirected) {
            window.location.href = req.url
        }
        const res = await req.text()
        console.log(res)
    }
    catch (e) {
        console.error(e)
    }
})