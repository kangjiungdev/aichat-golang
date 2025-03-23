const aiReqForm = document.getElementById("ai-req-form")

aiReqForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(aiReqForm)
    const segments = window.location.pathname.split("/")
    let chatID;
    if (segments.length >= 3 && segments[1] === "chat") {
        chatID = segments[2]
    }
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