// ==============================================================================================================================
// PINK THUMB 2023
// ==============================================================================================================================
// By @jangeisbauer // emptydc.com
// ==============================================================================================================================
// Chrome based Browser Extension that shows you and your users the thumb, whenever they are browsing
// a trusted website (which can be configured in a config file). When it finds a password field in the webpage
// it will check if the site is configured as a trusted site. If not, it will show a warning icon instead of the
// pink thumb. In addition, you can make pink thumb to send the deep url of the site with a password field that is not trusted
// to MDE (Microsoft Defender for Endpoint). This is accomplished by a trick: pink thumb is trying to make a request to a website 
// that you can configure.
// This website needs to be accessible by port 80. Pink Thumb is then sending a get request to this URL with a 
// fake url parameter of "?s2MDE=" and providing the current URL (of the website with a password field that is not
// configured in trusted sites) alongside. This get request can then be queried in MDE later. 
// ==============================================================================================================================

// path to config file
const configUrls = './config/urls.json'

// read config file function
async function fetchAsync () {
  let response = await fetch(configUrls);
  let data = await response.json();
  return data;
}

// LISTENER for Content Script Call, gets only triggered if, password field was found in HTML of page
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
    // Query current URL from Tab
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
      var url = tabs[0].url;
      // compare current URL and URL sent from content script to make sure to not update all tabs
      if(url == request.msg)
      {
        // call read config file
        fetchAsync().then(data => {

            // FUNCTION: sendSignalToMDE
            var sendSignalToMDE = function(){
              var fetchUrl = data.Config.MdeSignalUrl + '/?s2MDE=' + url 
                fetch(fetchUrl, {
                method: 'get',
                mode: 'no-cors',
                });
            };

            // send signal to MDE if configured
            if(data.Config.MdeBuddyOn == true)
            {
              sendSignalToMDE(request.msg);
            }
            
            // get hostname from url of current tab
            currentHostName = (new URL(url)).hostname

            // compare current url to urls in trusted sites from config file 
            if((data.trustedUrls.filter(p => p.url == currentHostName)).length == 0)
            {
              // set waring icon if page is not a trusted site (and has a password field in HTML content)
              chrome.action.setIcon( { tabId: tabs[0].id, path: "/images/warning.png" })
            }
            else
            {
              // if site is listed in trusted sites, we show the pink thumb on specific tab
              chrome.action.setIcon( { tabId: tabs[0].id, path: "/images/trusted.png" })
            }

          })
      }
    });
  }
);

// create a listener for all tabs changes
chrome.tabs.onUpdated.addListener((tabs) => {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([
          // create a declarative content listener that matches for password fields (forms) in HTML content
          {
            conditions : [
              new chrome.declarativeContent.PageStateMatcher({
                css: ['input[type="password"]'],
              })
            ],
            // call content script
            actions    : [ new chrome.declarativeContent.RequestContentScript({js: [ "content-warning.js" ]}) ]    
          }
        ]); 
    })
});
  