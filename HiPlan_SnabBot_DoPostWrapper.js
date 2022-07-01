// const HiPlan_SnabBot = 'https://script.google.com/home/projects/1sH3ZNB_FESzowf2ylTaIzpTrL-ZONEQSNI6qoA-inVvDuWr-r7y5y2Pn/edit'

const token = configGetToken()
const base = 'https://api.telegram.org/bot' + token + '/'

function doPost(e){
  HiPlan_SnabBot.doPost(e)
}

function setWebhook() {
  let thisAppId = 'AKfycbzL2juTQuysJ0vBWG4OUDtn7BB126W2zWbzBphhttB7nIyfhNusVMnNAFPZNyo_dXjaIQ'
  let webAppUrl = 'https://script.google.com/macros/s/' + thisAppId + '/exec'
  let response = UrlFetchApp.fetch(base + 'setWebhook?url=' + webAppUrl)
  console.log(response.getContentText())
}

function Pass(){}