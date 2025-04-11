import $ from "jquery";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "@fortawesome/fontawesome-free/js/all.js";
import "jquery-ujs/src/rails.js";

import * as popup from "./components/popup";

$("input, textarea").attr("autocomplete", "off");

$("input[type='password']").on("paste copy cut", function (event) {
  event.preventDefault();
});


// true는 타입 문제 없음, false는 타입 문제 있어서 수정
// return 값: [에러 존재 여부, 조건에 맞는 userInfos object]
export function userInfosValidationCheck(chatID) {
  try {
    const userInfos = JSON.parse(localStorage.getItem("userInfos")) || {};
    if (userInfos?.[chatID] && typeof userInfos[chatID] !== "object") {
        console.error("error: localStorage userInfos chatID value 타입이 object가 아닙니다.")
        delete userInfos[chatID]
        localStorage.setItem("userInfos", JSON.stringify(userInfos))
        return [false, userInfos]
    }
    
    return [true, userInfos]

  } catch (e) {
    console.error("error: localStorage userinfos value type error")
    localStorage.setItem("userInfos", JSON.stringify({}))
    return [false, null]
  }
}


export { popup };