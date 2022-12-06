// turn background red (in case of a website with a pw field), 
// you can even overlay Text here or bring up a alert and all such stuff,
// remember to not make your users mad, otherwise they find ways arround your restrictions ;)
// document.body.style.backgroundColor = 'red';

//get current tab url and send it back to service worker
chrome.runtime.sendMessage({ msg: location.href });