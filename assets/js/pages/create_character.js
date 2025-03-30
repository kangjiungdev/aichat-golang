const createCharacterForm = document.getElementById("create-character-form")
const createCharacterNameInput = document.getElementById("character-name")
const createCharacterInfoInput = document.getElementById("character-info")
const createCharacterOnelineInfo = document.getElementById("character-oneline-info")
const createCharacterAssetsInput = document.getElementById("character-assets")
const fileInput = document.getElementById("character-assets");
const uploadBtn = document.querySelector(".upload-button")
const fileName = document.getElementById("file-name");


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

document.querySelectorAll(".gender-tab input[type='radio']").forEach((input) => {
      input.addEventListener("change", () => {
        document.querySelectorAll(".gender-tab").forEach((label) => {
          label.classList.remove("gender-checked");
        });
        input.closest(".gender-tab").classList.add("gender-checked");
      });
});


fileInput.addEventListener("change", () => {
  const files = Array.from(fileInput.files);
  const maxChar = 60; // ✅ 버튼 안 뭉개지게 글자 수 제한

  if (files.length === 0) {
    fileName.textContent = "선택된 파일 없음";
    return;
  }

  let names = files.map(f => f.name).join(", ");

  if (names.length > maxChar) {
    names = names.slice(0, maxChar - 10) + "...";
  }

  fileName.textContent = `${names} (총 ${files.length}개)`;
});

fileName.addEventListener("click", () => {
  fileInput.click()
})

setBtnColor(uploadBtn, "mouseover","#e6ad00")
setBtnColor(fileName, "mouseover","#e6ad00")
setBtnColor(uploadBtn, "mouseout", "#FFC200")
setBtnColor(fileName, "mouseout", "#FFC200")

function setBtnColor(element, eventName, color) {
  element.addEventListener(eventName, () => {
    uploadBtn.style=`background-color: ${color}`
  })
}

function trimValue(element) {
    return element.value.trim()
}