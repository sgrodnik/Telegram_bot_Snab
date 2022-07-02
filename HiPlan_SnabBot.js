// const wrapper = 'https://script.google.com/home/projects/1_zIYkfH6I9HyUZJ3chAoKugPzVas4h8WEl1tMbr-r7BARIbm7aCI8Ooz/edit'
const token = hiPlan_SnabBot_token
const base = 'https://api.telegram.org/bot' + token + '/'
const fileBase = 'https://api.telegram.org/file/bot' + token + '/'

let update
let message

const DEBUG = false

function doPost(e){
  try{
    update = JSON.parse(e.postData.contents)
    if(!update){
      throw Error('No contents')
    }

    if (DEBUG){
      debug()
    }
    else{
      processMessage()
    }

  }
  catch(e){
    const SGrodnikChatId = 326258443
    sendMessage(SGrodnikChatId, e)
    tableAppend(now(), 'Ошибка', e)
  }
}

function debug(){
  const SGrodnikChatId = 326258443
  if(update.message && update.message.from.id === SGrodnikChatId){
    sendMessage(SGrodnikChatId, JSON.stringify(update, null, 8))
  }
}

function processMessage(){
  message = update.message
  if(!message){return}
  if(message.photo){getPhotoToTable()}
}

function getPhotoToTable() {
  if(!(String(message.chat.id) in ssIdAndSheetNameByChatId)){
    sendMessage(message.chat.id, `Ошибка: этот чат <${message.chat.id}> не зарегистрирован`)
    return
  }
  let photoSizeArray = message.photo
  let photo = photoSizeArray[photoSizeArray.length - 1]
  let botMessage = 'Сохраняю картинку ' + Math.round(photo.file_size/1024) + ' Кбайт, подождите...'
  let [chatId, messageId] = sendMessage(message.chat.id, botMessage)
  let response = UrlFetchApp.fetch(base + 'getFile?file_id=' + photo.file_id)
  let filePath = JSON.parse(response.getContentText()).result.file_path
  let blob = UrlFetchApp.fetch(fileBase + filePath).getBlob().setContentTypeFromExtension()

  let aktyFolderId = '1fwqDvzKrGpzAju_VeFcPPicYJQG6VkFm'
  let folder = DriveApp.getFolderById(aktyFolderId)
  let file = folder.createFile(blob)

  let date = toDate(message.date)
  let fileName = `photo_${date.replaceAll('.', '-').replaceAll(':', '-').replaceAll(' ', '_')}_${message.from.id}.jpg`
  file.setName(fileName)
  tableAppend(date, file.getUrl(), message.from.id, message.chat.id)
  botMessage = 'Фото выгружено в таблицу, сейчас привяжем его к инвентарю 😉'
  editMessage(chatId, messageId, botMessage)
}

function sendMessage(chatId, text){
  let data = {
    method: 'post',
    payload: {
      method: 'sendMessage',
      chat_id: String(chatId),
      text: text,
      disable_notification: true,
      parse_mode: 'HTML'
    }
  }
  let response = UrlFetchApp.fetch(base, data)
  let chatId_ = JSON.parse(response.getContentText()).result.chat.id
  let messageId = JSON.parse(response.getContentText()).result.message_id
  return [chatId_, messageId]
}

function editMessage(chatId, messageId, text){
  let data = {
    method: 'post',
    payload: {
      method: 'editMessageText',
      chat_id: String(chatId),
      message_id: Number(messageId),
      text: text,
      parse_mode: 'HTML'
    }
  }
  let response = UrlFetchApp.fetch(base, data)
}

function toDate(unixTimestamp){
  const milliseconds = unixTimestamp * 1000
  const dateObject = new Date(milliseconds)
  return now(date=dateObject)
}

function tableAppend(){
  let [ssId, sheetName] = ssIdAndSheetNameByChatId[String(message.chat.id)]
  if(sheetName){
    const ssApp = SpreadsheetApp.openById(ssId)
    ssApp.getSheetByName(sheetName).appendRow([].slice.call(arguments))
  }
}

function now(date=0){
  if(!date){
    date = new Date()
  }
  let y = date.getFullYear()
  let m = date.getMonth() + 1
  let d = date.getDate()
  let hh = date.getHours()
  let mm = date.getMinutes()
  let ss = date.getSeconds()
  return `${y}.${m}.${d} ${hh}:${mm}:${ss}`
}

function pass(){console.log(hiPlan_SnabBot_token)}
