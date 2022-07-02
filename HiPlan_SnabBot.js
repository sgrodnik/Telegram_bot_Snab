// const wrapper = 'https://script.google.com/home/projects/1_zIYkfH6I9HyUZJ3chAoKugPzVas4h8WEl1tMbr-r7BARIbm7aCI8Ooz/edit'
const token = hiPlan_SnabBot_token
const base = 'https://api.telegram.org/bot' + token + '/'
const fileBase = 'https://api.telegram.org/file/bot' + token + '/'

const INVENTAR_SKP_ssId = '1X0xd2nVQLl2dWvtFvBRjKgQAAzOISa3RO5NsivLlGoc'
const INVENTAR_LOGOS_ssId = '1dmAlXMdiQN82IPQvpQqN409_9vnv9z9U0jYddjsiUCY'
const ssIdAndSheetNameByChatId = {
// chatId:       spreadSheetId         SheetName
  '326258443':  [INVENTAR_SKP_ssId,   'debug'    ],  // SGrodnik
  '235365345':  [INVENTAR_SKP_ssId,   'ТЕЛЕГРАМ_'],  // HiPlan
  '-789889865': [INVENTAR_SKP_ssId,   'ТЕЛЕГРАМ_'],  // *ИНВЕНТАРЬ_ТЕСТ_СЕМА
  '-716736316': [INVENTAR_SKP_ssId,   'ТЕЛЕГРАМ' ],  // *ИНВЕНТАРЬ СКП
  '-789889865': [INVENTAR_LOGOS_ssId, 'ТЕЛЕГРАМ' ],  // *ИНВЕНТАРЬ ЛОГОС
}

let contents
let message
let caption

function doPost(e){
  try{
    contents = JSON.parse(e.postData.contents)
    if(!contents){
      throw Error('No contents')
    }
    processMessage()
  }
  catch(e){
    const SGrodnikChatId = 326258443
    sendMessage(SGrodnikChatId, e)
    tableAppend(now(), 'Ошибка', e)
  }
}

function processMessage(){
  message = contents.message
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
  botMessage = 'Фото выгружено в таблицу, Кристина Кристиновна приступает к обработке🧑'
  editMessage(chatId, messageId, botMessage)
  tableAppend(date, file.getUrl(), message.from.id)
}

function sendMessage(chatId, text){
  let data = {
    method: 'post',
    payload: {
      method: 'sendMessage',
      chat_id: String(chatId),
      text: text,
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
