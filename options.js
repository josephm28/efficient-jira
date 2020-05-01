//SET VARIABLE
// var isExtensionOn = false;
// chrome.extension.sendMessage({ cmd: "setOnOffState", data: { value: isExtensionOn } });

// //GET VARIABLE
// chrome.extension.sendMessage({ cmd: "isAutoFeedMode" }, function (response) {
//     if (response == true) {
//      //Run the rest of your content-script in here..
//     }
// });

// document.getElementById("myBtn").onclick = () => onClick();
function onClick() {
  console.log("hi");
  console.log(chrome);
  alert(chrome);
  chrome.management.getSelf((self) => {
    chrome.management.setEnabled(self.id, false);
  });
}
console.log("hi there");

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("myBtn").addEventListener("click", onClick);
  console.log("DOM Loaded");
});
