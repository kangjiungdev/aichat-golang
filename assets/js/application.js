require("expose-loader?exposes=$,jQuery!jquery");
require("bootstrap/dist/js/bootstrap.bundle.js");
require("@fortawesome/fontawesome-free/js/all.js");
require("jquery-ujs/src/rails.js");


$("input, textarea").attr("autocomplete", "off");

$("input[type='password']").on("paste copy cut", function (e) {
  e.preventDefault();
});