const csrfToken = $('meta[name="csrf-token"]').attr("content")

$("#logout-btn").on("click", async () => {
    try {
        const logoutReq =  await fetch("/logout", {
        method:"POST",
        headers: {
            "Content-Type": "text/plain",
            "X-CSRF-Token": csrfToken
          },
        })
        if (logoutReq.redirected) {
        window.location.href = logoutReq.url
        }
    } catch(e) {
        console.error(e)
    }
})