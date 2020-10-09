const SWITZERLAND_MOBILITY_DOMAINS = [
  "map.schweizmobil.ch",
  "map.veloland.ch",
  "map.wanderland.ch",
  "map.mountainbikeland.ch",
  "map.skatingland.ch",
  "map.kanuland.ch"
]

let currentTab;
let dataSource;
let routeId;

function updateIcon() {
  browser.browserAction.setIcon({
    path: (routeId && dataSource) ? {
      32: "icons/hb2-plus-32.png",
      48: "icons/hb2-plus-48.png",
      96: "icons/hb2-plus-96.png"
    } : {
      32: "icons/hb2-32.png",
      48: "icons/hb2-48.png",
      96: "icons/hb2-96.png"
    },
    tabId: currentTab.id
  });
  browser.browserAction.setTitle({
    title: (routeId && dataSource) ? `Import this route to Homebytwo!` : 'Go to Strava or Switzerland Mobility to import a route!',
    tabId: currentTab.id
  });
}

function updateActiveTab() {

  function routeCanBeImported(urlString) {
    const parsedUrl = new URL(urlString);
    return (isStravaRoute(parsedUrl)|isSwitzerlandMobilityRoute(parsedUrl))
  }

  function isStravaRoute(parsedUrl){
    if (parsedUrl.hostname !== `www.strava.com`){
      return false
    };
    const regexpStravaRoute = /^\/routes\/(\d*)$/;
    const matches = parsedUrl.pathname.match(regexpStravaRoute);
    if(matches){
      dataSource = `strava`;
      routeId = matches[1];
      return true;
    }
  }

  function isSwitzerlandMobilityRoute(parsedUrl){
    if (!(SWITZERLAND_MOBILITY_DOMAINS.includes(parsedUrl.hostname))){
      return false;
    }
    if (parsedUrl.searchParams.get("trackId")){
      dataSource = `switzerland_mobility`;
      routeId = parsedUrl.searchParams.get("trackId");
      return true;
    }
  }

  function clearRouteVariable(){
    dataSource = null;
    routeId = null;
  }

  function updateTab(tabs) {
    if (tabs[0]) {
      currentTab = tabs[0];
      if (routeCanBeImported(currentTab.url)) {
        browser.browserAction.enable();
      } else {
        browser.browserAction.disable();
        clearRouteVariable();
      }
      updateIcon();
    }
  }
  let gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  gettingActiveTab.then(updateTab);
}

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);

// update when the extension loads initially
updateActiveTab();

// open route import page at homebytwo.ch
function openRouteImportTab(dataSource, routeId){
  browser.tabs.create({url: `https://www.homebytwo.ch/import/${dataSource}/${routeId}`});
}
browser.browserAction.onClicked.addListener((tab) => {
  openRouteImportTab(dataSource, routeId);
});
