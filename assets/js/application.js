import $ from "jquery";
import "bootstrap/dist/js/bootstrap.bundle.js";
import "@fortawesome/fontawesome-free/js/all.js";
import "jquery-ujs/src/rails.js";

import * as popup from "./components/popup";

$("input, textarea").attr("autocomplete", "off");

$("input[type='password']").on("paste copy cut", function (event) {
  event.preventDefault();
});

export { popup };