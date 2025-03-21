const createCharacterForm = document.getElementById("create-character-form")
const createCharacterNameInput = document.getElementById("character-name")
const createCharacterInfoInput = document.getElementById("character-info")
const createCharacterOnelineInfo = document.getElementById("character-oneline-info")
const createCharacterAssetsInput = document.getElementById("character-assets")


createCharacterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const createCharacterGender = document.querySelector('input[name="character-gender"]:checked');
    if (!trimValue(createCharacterNameInput) || !trimValue(createCharacterInfoInput) || !trimValue(createCharacterOnelineInfo) || !createCharacterAssetsInput.files.length || !createCharacterGender) {
        return
    }
    const form = new FormData(createCharacterForm)
    const res = await fetch("/create-character", {method: "POST", body: form})
    if (res.redirected) {
        window.location.href = res.url;
    }
})

function trimValue(element) {
    return element.value.trim()
}
