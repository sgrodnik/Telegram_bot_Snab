// const wrapper = 'https://script.google.com/home/projects/1_zIYkfH6I9HyUZJ3chAoKugPzVas4h8WEl1tMbr-r7BARIbm7aCI8Ooz/edit'
const token = hiPlan_SnabBot_token
const base = 'https://api.telegram.org/bot' + token + '/'
const fileBase = 'https://api.telegram.org/file/bot' + token + '/'

let update
let message

const DEBUG = 0

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
  if(message.photo){savePhotoToTable()}
  if(message.text){saveTextToTable()}
}

function savePhotoToTable() {
  if(!(String(message.chat.id) in ssIdAndSheetNameByChatIdPhoto)){
    sendMessage(message.chat.id, `Ошибка: этот чат ${message.chat.id} не зарегистрирован`)
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
  tableAppendPhoto(date, file.getUrl(), message.from.id, message.chat.id)
  botMessage = 'Фото успешно выгружено в таблицу учета 😉'
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

function tableAppendPhoto() {
  let [ssId, sheetName] = ssIdAndSheetNameByChatIdPhoto[String(message.chat.id)]
  if (sheetName) {
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

function saveTextToTable() {
  if(!(String(message.chat.id) in ssIdAndSheetNameByChatIdText)){
    // sendMessage(message.chat.id, `Ошибка: этот чат ${message.chat.id} не зарегистрирован`)
    return
  }
  // let botMessage = 'Сохраняю текст, подождите...'
  // let [chatId, messageId] = sendMessage(message.chat.id, botMessage)

  let date = toDate(message.date)
  tableAppendText(date, message.from.id, message.chat.id, message.text)
  // botMessage = 'Текст выгружен в таблицу 😉'
  // editMessage(chatId, messageId, botMessage)
}

function tableAppendText(){
  const data = [[].slice.call(arguments)]
  let [ssId, sheetName] = ssIdAndSheetNameByChatIdText[String(message.chat.id)]
  if (sheetName){
    setValuesUnderLastRow(ssId, sheetName, 1, data)
  }
}

function setValuesUnderLastRow(ssId, sheetName, column, twoDimensionalArray){
  const sheet = SpreadsheetApp.openById(ssId).getSheetByName(sheetName)
  const curRange = sheet.getRange(sheet.getMaxRows(), column)
  const row = curRange.getNextDataCell(SpreadsheetApp.Direction.UP).getLastRow() + 1
  const col = curRange.getLastColumn()
  const numRows = twoDimensionalArray.length
  const numCols = Math.max(twoDimensionalArray.map(row => row.length))
  const newRange = sheet.getRange(row, col, numRows, numCols)
  newRange.setValues(twoDimensionalArray)
}

function pass(){console.log(ssIdAndSheetNameByChatId)}
