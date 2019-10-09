// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

"use strict";
//query selectors to identify information
const COUNTQUERY_1 = "#mainContent h1.srp-controls__count-heading"
const COUNTQUERY_2 = "#CenterPanelInner #cbrt .clt h1.rsHdr span.rcnt"
const LISTQUERY_1 = "#mainContent ul.srp-results"
const LISTQUERY_2 = "#CenterPanelInner ul#ListViewInner"
const LISTQUERY_3 = "#CenterPanelInner ul#GalleryViewInner"
const CONDITIONQUERY_1 = "ul#w4"
const CONDITIONQUERY_2 = "div#LeftPanel"

//preset suggest price rates
const SUGGEST_PRICE_RATE = {
  "aggressive": [0.6, 0.68, 0.76, 0.9, 1],
  "intermediate": [0.68, 0.76, 0.9, 1, 1.2],
  "conservative": [0.76, 0.9 , 1, 1.2, 1.4]
}
//return style sheet based on current textsize
function getStyle(textsize){
  let fontSize = 1
  let height = SHOWDETAIL ? 640 : 420
  let width = 300
  switch (textsize) {
    case "medium":
      
      break;
  
    case "large":
      fontSize = 1.2
      height = SHOWDETAIL ? 750 : 500
      width = 400
      break;

    case "small":
  
      fontSize = 0.8
      height = SHOWDETAIL ? 525 : 350
      break;
    
    default:
      break;
  }
  return `<style>
  #extenstionInject{
    font-family: Calibri;
    border-radius: 5px;
    z-index: 1000;
    overflow: hidden;
    position:fixed;
    bottom:20px; 
    right: 20px; 
    width:${width}px; 
    height: ${height}px; 
    background-color: white; 
    border:1px solid #ededed; 
    box-shadow: 1px 1px 2px #ededed;
  }
  #extenstionInjectMessage{
    font-family: Calibri;
    padding: 5px 10px;
    text-align: center;
  }
  #extenstionInjectMessage h3{
    font-family: Calibri;
    font-weight: bold; 
    font-size: ${210*fontSize}%;
    border-bottom: 1px solid #ededed;
    margin-bottom: 5px;
  }
  #extenstionInjectMessage p{
    font-family: Calibri;
    font-size: ${210*fontSize}%;
    font-weight: lighter; 
    color: #555;
    margin-top: 5px;
  }
  #extenstionInjectTitle{
    font-family: Calibri;
    background-image:  linear-gradient(180deg, rgba(214, 49, 49, 0.57), rgba(103, 103, 232, 0.61));
    color: white;
    font-size: ${40*fontSize}px;
    text-align: center;
    margin: 0;
    font-weight: bold;
    padding: 7px;
  }
  #extenstionInjectDebug{
    font-family: Calibri;
    padding: 3px 10px;
    margin: 10px 10px;
    border:1px solid #ededed; 
  }
  #extenstionInjectDebug h4{
    font-family: Calibri;
    font-weight: bold; 
    font-size: ${150*fontSize}%;
    margin: 3px;
  }
  #extenstionInjectDebug p{
    font-family: Calibri;
    color: #555;
    margin: 3px;
    font-size: ${130*fontSize}%;
  }
</style>`
}

//default proproties
let RESULT = {}
let LIMIT = 0
let SHIPPING = true
let NOAUCTION = true
let BESTOFFER = true
let SHOWDETAIL = true
let CUSTOMSP = [0.68, 0.76, 0.9, 1, 1.2]
let SUGGESTTYPE = true
let TEXTSIZE = "medium"
let REMOVETOP = true
let LISTINGARRAY = []
let STATUS = []
let SOLDITEM = false


function RunExtension(){
  chrome.tabs.query({'active': true, 'currentWindow': true, 'status': "complete"}, function (tabs) {
    // var currenturl = tabs[0].url;
    if (tabs[0] && tabs[0].url && tabs[0].url.match(/www\.ebay\.com\/sch.*?\/i\.html/g)){
      STATUS = []
      LISTINGARRAY = [] 
      RESULT = {}
      chrome.storage.sync.get({
        limit: 600,
        noauction: true,
        shipping: true,
        bestoffer: true,
        suggesttype: "intermediate",
        textsize: "medium",
        showdetail: true,
        customSP:[0.68, 0.76, 0.9, 1, 1.2],
        removetop: true
      }, function(items) {
        LIMIT = items.limit;
        SHIPPING = items.shipping;
        NOAUCTION = items.noauction;
        BESTOFFER = items.bestoffer;
        SUGGESTTYPE = items.suggesttype;
        TEXTSIZE = items.textsize;
        CUSTOMSP = items.customSP;
        SHOWDETAIL = items.showdetail;
        REMOVETOP = items.removetop;
        injectTemplate()
        constructEbayUrl(items.noauction,tabs[0].url, function(URL){
          getSource(URL)
        })
      });
    }
  })
}
chrome.tabs.onActivated.addListener(function (tabId, changeInfo, tab){
  RunExtension()
});
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab){
  if (changeInfo && changeInfo.status && changeInfo.status === "complete"){
    RunExtension()
  }
});

function constructEbayUrl(noauction,currenturl, callback){
  if (currenturl.match(/\&?LH_Sold=1/g)){
    SOLDITEM = true
  }else{
    SOLDITEM = false
  }
  currenturl = currenturl
  .replace(/\&?LH_Sold=1/g,"")
  .replace(/\&?LH_Complete=1/g,"")
  // .replace(/\&?_fosrp=1/g,"")
  .replace(/\&?_pgn=\d/g,"")
  .replace(/\&?_ipg=\d+/g,"")
  // .replace(/\&?_in_kw=\d*/g,"")
  // .replace(/\&?_ex_kw=\d*/g,"")
  .replace(/\&?_dmd=\d*/g,"")
  // .replace(/\&?_salic=\d*/g,"")
  // .replace(/\&?_sop=\d*/g,"")

  const baseurl = currenturl + 
  (noauction ? "&LH_BIN=1" : "" ) + "&_ipg=200&_dmd=1"
  callback(baseurl)
}

function getSource(baseurl) {
  const pagecount = Math.ceil(LIMIT/200)
  getBasePage(baseurl)
  STATUS.push(1)
  getSoldPage(baseurl + "&LH_Sold=1&LH_Complete=1")
  STATUS.push(0)
  for (let index = 2; index <= pagecount; index++) {
    STATUS.push(index)
    getPage(baseurl + "&_pgn=" + index+ (SOLDITEM ? "&LH_Sold=1&LH_Complete=1" : ""),index )
  }
}


function getBasePage(URL){
  let xhr = new XMLHttpRequest();
  console.log(URL)
  xhr.open("GET", URL, true);
  xhr.send();
  xhr.onreadystatechange = function() { // Call a function when the state changes.
    if (this.readyState === XMLHttpRequest.DONE ) {
      STATUS = STATUS.filter(function(id){return id !== 1})
      var parser = new DOMParser();
      var htmlDoc = parser.parseFromString(xhr.responseText, 'text/html');
      let message
      if (SOLDITEM){
        message = {
          count : extractCount(DOMtoString((htmlDoc.querySelector(COUNTQUERY_1)? htmlDoc.querySelector(COUNTQUERY_1) : htmlDoc.querySelector(COUNTQUERY_2)))),
        }
        RESULT.Available = message.count
        // console.log("BaseCount(Sold): " + message.count)
      }else{
        message = {
          count : extractCount(DOMtoString((htmlDoc.querySelector(COUNTQUERY_1)? htmlDoc.querySelector(COUNTQUERY_1) : htmlDoc.querySelector(COUNTQUERY_2)))),
          content :
            (htmlDoc.querySelector(LISTQUERY_1)? extractListing(DOMtoString(htmlDoc.querySelector(LISTQUERY_1)))
          : htmlDoc.querySelector(LISTQUERY_2) ? extractListing_2(DOMtoString(htmlDoc.querySelector(LISTQUERY_2)))
          : extractListing_2(DOMtoString(htmlDoc.querySelector(LISTQUERY_3)))),
          condition : extractCondition(DOMtoString((htmlDoc.querySelector(CONDITIONQUERY_1)? htmlDoc.querySelector(CONDITIONQUERY_1) : htmlDoc.querySelector(CONDITIONQUERY_2)))),
        }
        LISTINGARRAY = LISTINGARRAY.concat(message.content)
        RESULT.Available = message.count
        RESULT.New = message.condition.new
        RESULT.Used = message.condition.used
        // console.log("BaseCount: " + message.count)
        // console.log("Basenew: " + message.condition.new)
        // console.log("Baseused: " + message.condition.used)
      }
      injectMessage()
    }
  }
}
function getSoldPage(URL){
  let xhr = new XMLHttpRequest();
  console.log(URL)
  xhr.open("GET", URL, true);
  xhr.send();
  xhr.onreadystatechange = function() { // Call a function when the state changes.
    if (this.readyState === XMLHttpRequest.DONE ) {
      STATUS = STATUS.filter(function(id){return id !== 0})
      var parser = new DOMParser();
      var htmlDoc = parser.parseFromString(xhr.responseText, 'text/html');
      let message
      if (SOLDITEM){
        message = {
          count : extractCount(DOMtoString((htmlDoc.querySelector(COUNTQUERY_1)? htmlDoc.querySelector(COUNTQUERY_1) : htmlDoc.querySelector(COUNTQUERY_2)))),
          content : 
            (htmlDoc.querySelector(LISTQUERY_1)? extractListing(DOMtoString(htmlDoc.querySelector(LISTQUERY_1)))
          : htmlDoc.querySelector(LISTQUERY_2) ? extractListing_2(DOMtoString(htmlDoc.querySelector(LISTQUERY_2)))
          : extractListing_2(DOMtoString(htmlDoc.querySelector(LISTQUERY_3))))
          ,
          condition : extractCondition(DOMtoString((htmlDoc.querySelector(CONDITIONQUERY_1)? htmlDoc.querySelector(CONDITIONQUERY_1) : htmlDoc.querySelector(CONDITIONQUERY_2)))),
        }
        LISTINGARRAY = LISTINGARRAY.concat(message.content)
        RESULT.Sold = message.count
        RESULT.New = message.condition.new
        RESULT.Used = message.condition.used
        
        // console.log("SoldCount: " + message.count)
        // console.log("Soldnew: " + message.condition.new)
        // console.log("Soldused: " + message.condition.used)
      }else{
        message = {
          count : extractCount(DOMtoString((htmlDoc.querySelector(COUNTQUERY_1)? htmlDoc.querySelector(COUNTQUERY_1) : htmlDoc.querySelector(COUNTQUERY_2)))),
        }
        RESULT.Sold = message.count
        // console.log("SoldCount(Avail): " + message.count)
      }
      injectMessage()
    }
  }
}
function getPage(URL,index){
  let xhr = new XMLHttpRequest();
  console.log(URL)
  xhr.open("GET", URL, true);
  xhr.send();
  xhr.onreadystatechange = function() { // Call a function when the state changes.
    if (this.readyState === XMLHttpRequest.DONE ) {
      STATUS = STATUS.filter(function(id){return id!==index})
      var parser = new DOMParser();
      var htmlDoc = parser.parseFromString(xhr.responseText, 'text/html');
      const message = {
        content : 
          (htmlDoc.querySelector(LISTQUERY_1)? extractListing(DOMtoString(htmlDoc.querySelector(LISTQUERY_1)))
        : htmlDoc.querySelector(LISTQUERY_2) ? extractListing_2(DOMtoString(htmlDoc.querySelector(LISTQUERY_2)))
        : extractListing_2(DOMtoString(htmlDoc.querySelector(LISTQUERY_3)))),
  }
      LISTINGARRAY = LISTINGARRAY.concat(message.content)
      if (LIMIT !== 0 && LISTINGARRAY.length > LIMIT){
        LISTINGARRAY = LISTINGARRAY.slice(0,LIMIT)
      }
      injectMessage()
    }
  }
}





function extractCount(inputString) {
  if (inputString && typeof inputString === "string"){
    const outputString = inputString.replace(/[^\d]*/g,"") 
    console.log("Count: " + outputString)
    return parseFloat(outputString)
  }
  return null
}

function extractListing_2(inputString) {
  if (inputString && typeof inputString === "string"){
    const regexclean = /[\t\n]*/g
    const regexclean2 = /&(.+?);/g
    // const regexattr = /\s([^\s]+)\s?=\s?"(.*?)\"/g
    const regexttag = /<((\/)?)(tbody|input|img|a|b|span|script|style|br|)\s*>/g
    const regextempty = /<([^\/>]+?)>\s*<(\/)(\1+?)>/g
    const regexuls = /<ul.+?>.+?<\/ul>/g
    const regexols = /<ol.+?>.+?<\/ol>/g
    const regexitems = /<li.*?listingid=.*?>.*?<ul.*?>.*?<\/ul>.*?<ul.*?>.*?<\/ul>.*?<\/li>/g
    const regextcommments = /<!--.+?-->/g
    let findresult = inputString
      .replace(regexclean,"")
      .replace(regexclean2,"")
      .replace(regexttag,"")
      .replace(regexols,"")
      .replace(regextcommments,"")

    while(findresult.match(regextempty) && findresult.match(regextempty).length>0){
      findresult = findresult.replace(regextempty,"")
    }
    let JsonObject = []
    const properties = findresult.match(regexitems)
      properties.map(prop=>{
          const list = {}
          // if length is 1 then it is regular listing price, if 2 then first one is the listing price second one is previous price.
          if (prop.match(/>\$[\d,.]+?</g) && prop.match(/>\$[\d,.]+?</g).length && (prop.match(/>\$[\d,.]+?</g).length === 1 || prop.match(/>\$[\d,.]+?</g).length === 2) ){
            list.price = parseFloat(prop.match(/>\$[\d,.]+?</g)[0].replace(/</g,"").replace(/,/g,"").replace(/>\$/g,""))
          }else{
            console.log()
            return
          }

          if (prop.match(/Free Shipping/g) ){          
            list.shipping = "Free Shipping"
          }else if (prop.match(/Pickup only: Free/g) ){          
            list.shipping = "Pickup only: Free"
          }else if (prop.match(/Free local pickup/g) ){    
            list.shipping = "Free local pickup"
            
          }else if (prop.match(/\+\$\d+?\.\d+?.+?shipping/g) ){    
            list.shipping = parseFloat(prop.match(/\+\$\d+?\.\d+?.+?shipping/g)[0].replace(/\+/g,"").replace(/\$/g,"").replace(/shipping/g,""))
          }else{
            list.shipping = "unknown"
          }

          if (prop.match(/Best offer accepted/g) ){          
            list.bestoffer = true
          }else{
            list.bestoffer = false
          }
          JsonObject.push(list)
      })
      console.log(JsonObject.filter(function(obj){
        return obj.bestoffer===true
      }))
      console.log(JsonObject)
    return JsonObject
  }
  return []
}

function extractListing(inputString) {
  if (inputString && typeof inputString === "string"){
    const regexclean = /[\t\n]*/g
    const regexclean2 = /&(.+?);/g
    // const regexattr = /\s([^\s]+)\s?=\s?"(.*?)\"/g
    const regexttag = /<((\/)?)(tbody|input|img|a|b|span|script|style|br|)\s*>/g
    const regextempty = /<([^\/>]+?)>\s*<(\/)(\1+?)>/g
    const regexuls = /<ul.+?>.+?<\/ul>/g
    const regexols = /<ol.+?>.+?<\/ol>/g
    const regexitems = /<li.+?>.+?<\/li>/g
    const regextcommments = /<!--.+?-->/g
    let findresult = inputString
      .replace(regexclean,"")
      .replace(regexclean2,"")
      .replace(regexttag,"")
      .replace(regexuls,"")
      .replace(regexols,"")
      .replace(regextcommments,"")

    while(findresult.match(regextempty) && findresult.match(regextempty).length>0){
      findresult = findresult.replace(regextempty,"")
    }
    let JsonObject = []
    const properties = findresult.match(regexitems)
    if (properties){
      properties.map(prop=>{
        const list = {}
        // if length is 1 then it is regular listing price, if 2 then first one is the listing price second one is previous price.
        if (prop.match(/>\$[\d,.]+?</g) && prop.match(/>\$[\d,.]+?</g).length && (prop.match(/>\$[\d,.]+?</g).length === 1 || prop.match(/>\$[\d,.]+?</g).length === 2) ){
          list.price = parseFloat(prop.match(/>\$[\d,.]+?</g)[0].replace(/</g,"").replace(/,/g,"").replace(/>\$/g,""))
        }else{
          return
        }

        if (prop.match(/Free Shipping/g) ){          
          list.shipping = "Free Shipping"
        }else if (prop.match(/Pickup only: Free/g) ){          
          list.shipping = "Pickup only: Free"
        }else if (prop.match(/Free local pickup/g) ){    
          list.shipping = "Free local pickup"
        }else if (prop.match(/\+\$\d+?\.\d+?.+?shipping/g) ){    
          list.shipping = parseFloat(prop.match(/\+\$\d+?\.\d+?.+?shipping/g)[0].replace(/\+/g,"").replace(/\$/g,"").replace(/shipping/g,""))
        }else{
          console.log(prop)
          list.shipping = "unknown"
        }

        if (prop.match(/Best offer accepted/g) ){          
          list.bestoffer = true
        }else{
          list.bestoffer = false
        }
        JsonObject.push(list)
    })
    }
 
      
      // console.log(JsonObject.filter(function(obj){
      //   return obj.bestoffer===true
      // }))
    return JsonObject
  }
  return []
}
function extractCondition(inputString){
  if (inputString && typeof inputString === "string"){
    console.log(inputString)
    const regexclean = /[\t\n]*/g
    const regexclean2 = /&(.+?);/g
    const regexattr = /\s([^\s]+)\s?=\s?"(.*?)\"/g
    const regexttag = /<((\/)?)(tbody|input|img|a|b|span|script|style|br|)\s*>/g
    const regextempty = /<([^\/>]+?)>\s*<(\/)(\1+?)>/g
    const regexitems = /<li.+?>.+?<\/li>/g
    const regextcommments = /<!--.+?-->/g
    let findresult = inputString
      .replace(regexclean,"")
      .replace(regexclean2,"")
      .replace(regexattr,"")
      .replace(regexttag,"")
      .replace(regexttag,"")
      .replace(regextcommments,"")
    let result = {}
    if (findresult.match(/New[\w\s]*?\([\d,]+\)/g)){
      result.new = findresult.match(/New[\w\s]*?\([\d,]+\)/g).reduce(
        function(cum, curr){
        if (curr.match(/\([\d,]+\)/g)){
          return cum + parseFloat(curr.match(/\([\d,]+\)/g)[0].replace(/\(/g,"").replace(/\)/g,"").replace(/,/g,""))
        }
        return cum
      },0)
    }
    if (findresult.match(/Used *?\([\d,]+\)/g)){
      result.used = parseFloat(findresult.match(/Used *?\([\d,]+\)/g)[0].match(/\([\d,]+\)/g)[0].replace(/\(/g,"").replace(/\)/g,"").replace(/,/g,""))
    }else if (findresult.match(/Pre\-owned *?\([\d,]+\)/g)){
      result.used = parseFloat(findresult.match(/Pre\-owned *?\([\d,]+\)/g)[0].match(/\([\d,]+\)/g)[0].replace(/\(/g,"").replace(/\)/g,"").replace(/,/g,""))
    }
    console.log(result)
    return result
  }
  return null
}


// Calculate Average Price
function getAverage(pricelist){
  let total = 0
  let pricelength = 0
  const reallist = pricelist.filter(function(item){
    return typeof item.price === "number"
  })
  console.log(reallist)
  if(reallist && reallist.length){
    if (SOLDITEM && !BESTOFFER){
      total = reallist.reduce(function(cum, cur){
        if (cur.bestoffer){
          return cum
        }
        pricelength += 1
        return (cum + cur.price)
      },0)
    }else{
      total = reallist.reduce(function(cum, cur){
        pricelength += 1
        return (cum + cur.price)
      },0)
    }
    total = total/pricelength
  }
  return total
}

// Calculate Average Price Ship Included
function getShipAverage(pricelist){
  let total = 0
  let pricelength = 0
  const reallist = pricelist.filter(function(item){
    return typeof item.price === "number"
  })
    if(reallist && reallist.length){
      // console.log(SOLDITEM)
      // console.log(BESTOFFER)
      if (SOLDITEM && !BESTOFFER){
        total = reallist.reduce(function(cum, cur){
          if (cur.bestoffer){
            return cum
          }else{
            let sum = cum
            if (typeof cur.shipping === "number"){
              sum = sum + cur.shipping 
            }
            sum = sum + cur.price 
            pricelength += 1
            return sum
          }
        },0)
      }else{
        total = reallist.reduce(function(cum, cur){
          let sum = cum
          if (typeof cur.shipping === "number"){
            sum = sum + cur.shipping 
          }
          sum = sum + cur.price 
          pricelength += 1
          return sum
        },0)
      }
    total = total/pricelength
  }
  return total
}

function calculateSuggestPrice(str, asp){
  let strBuckets
  if ( str <= 20 ){
    strBuckets = 0
  }else if ( str <= 33 ){
    strBuckets = 1
  }else if ( str <= 66 ){
    strBuckets = 2
  }else if ( str <= 100 ){
    strBuckets = 3
  }else{
    strBuckets = 4
  }
  if (SUGGESTTYPE==='custom'){
    return asp * CUSTOMSP[strBuckets]
  }else{
    return asp * SUGGEST_PRICE_RATE[SUGGESTTYPE][strBuckets]
  }
}


function processList(listingarray){
  //remove item matches with few keywords
  let pricelist
  pricelist = (listingarray.length > LIMIT) ? listingarray.slice(0,LIMIT) : listingarray
  if (SOLDITEM){
    pricelist = (pricelist.length > RESULT.Sold) ? listingarray.slice(0,RESULT.Sold) : listingarray
  }else{
    pricelist = (pricelist.length > RESULT.Available) ? listingarray.slice(0,RESULT.Available) : listingarray
  }
  if (REMOVETOP){
    //remove top 5% prices
    const TopCount = Math.floor(pricelist.length * 0.05)
    pricelist = pricelist.sort(function(a,b){
      return ((a.price > b.price) ? 1 : -1)
    })
    return pricelist.slice(0,(pricelist.length-TopCount))
  }
  return pricelist
}


//Display Results and Debugs on to Screen
function injectMessage(values){
  let Result =''
  let Debug =''
  let ASP =null
  let STR =null
  let SP =null
  // console.log(STATUS)
  // console.log(RESULT)
  // console.log(LISTINGARRAY)

  if (STATUS.length===0){
    //preprocess price list
    const pricelist = processList(LISTINGARRAY)

    const MovingAveragePrice = getAverage(pricelist).toFixed(2)
    const MovingAveragePriceShipping = getShipAverage(pricelist).toFixed(2)
    STR = (RESULT.Sold/RESULT.Available * 100).toFixed(0)
    ASP = SHIPPING ? MovingAveragePriceShipping : MovingAveragePrice
    SP = calculateSuggestPrice(STR, ASP).toFixed(2)
    console.log(RESULT)
    console.log(ASP)
    console.log(SP)
    
    // <li id="IncludeShipping">Include Shipping: ${SHIPPING.toString()}</li>
    // <li id="ExcludeAuction">Exclude Auction: ${NOAUCTION.toString()}</li>
    if (SHOWDETAIL){
      Debug = `
      <div id='extenstionInjectDebug'>
        <h4>DETAILS</h4>
        <p id="Limit">Limit: ${numberWithCommas(LIMIT)}</p>
        <p id="Available">Available: ${( RESULT.Available ? numberWithCommas(RESULT.Available):"")}</p>
        <p id="New">New: ${RESULT.New ? numberWithCommas(RESULT.New) :""}</p>
        <p id="Used">Used: ${RESULT.Used ? numberWithCommas(RESULT.Used): ""}</p>
        <p id="Sold">Sold: ${( RESULT.Sold ? numberWithCommas(RESULT.Sold):"")}</p>
        <p id = "Preset">Preset: ${( SUGGESTTYPE ? SUGGESTTYPE : "")}</p>
      </div>`
    }
    let STRcolor
    if (STR){
      if (STR>=100){
        STRcolor="green"
      }else if (STR>=67){
        STRcolor="blue"
      }else if (STR >= 34){
        STRcolor="orange"
      }else{
        STRcolor="red"
      }
    }
    Result = `<h2 id="extenstionInjectTitle" >RESULTS</h2><div id="extenstionInjectMessage" >
        <h3>Average Sale Price:</h3>
        <p id="ASP">$ ${ASP ? numberWithCommas(ASP):"Loading"}</p>
        <h3>Sell Through Rate:</h3>
        <p style="color:${STRcolor};" id="STR">${STR ? (STR.toString() + " %"):"Loading"}</p>
        <h3>Suggested Price:</h3>
        <p id="SP">$ ${SP ? numberWithCommas(SP):"Loading"}</p>
      </div>`
    let Window  = `<div id="extenstionInject">${Result}${Debug}</div>`
    

    // document.getElementById("extenstionInject").innerHTML = \`${Result}${Debug}\`
    const code = `
      function Extiontioninject(){
      if(document.getElementById("extenstionInject")){
        document.getElementById("extenstionInject").parentNode.removeChild(document.getElementById("extenstionInject"));
      }
      let ExtenstionNode
      ExtenstionNode = document.createElement("div")
      ExtenstionNode.innerHTML = \`${Window}${getStyle(TEXTSIZE)}\`
      document.getElementById("mainContent").appendChild(ExtenstionNode)
    }
    Extiontioninject()
    `;
    chrome.tabs.executeScript(null, {
      code: code
    }, function() {
      if (chrome.runtime.lastError) {
        console.log('There was an error injecting getLoading script : \n' + chrome.runtime.lastError.message);
      }
    });
    
  }
}


// window.onload = 

function DOMtoString(document_root) {
  if (!document_root){
      return null
  }
  var html = '',
      node = document_root.firstChild;
  while (node) {
      switch (node.nodeType) {
      case Node.ELEMENT_NODE:
          html += node.outerHTML;
          break;
      case Node.TEXT_NODE:
          html += node.nodeValue;
          break;
      }
      node = node.nextSibling;
  }
  return html;
}

{/* <li id="IncludeShipping">Include Shipping: </li>
<li id="ExcludeAuction">Exclude Auction: </li> */}
function injectTemplate(){
  let Debug = ''
  if (SHOWDETAIL){
    Debug = `
    <div id='extenstionInjectDebug'>
      <h4>DETAILS</h4>
      <p id = "Limit">Limit: </p>
      <p id = "Available">Available: </p>
      <p id = "New">New: </p>
      <p id = "Used">Used: </p>
      <p id = "Sold">Sold: </p>
      <p id = "Preset">Preset: </p>
    </div>`
  }
  let Result = `<h2 id="extenstionInjectTitle" >RESULTS</h2>
    <div id="extenstionInjectMessage">
      <h3>Average Sale Price:</h3>
      <p id="ASP">Loading</p>
      <h3>Sell Through Rate:</h3>
      <p id="STR">Loading</p>
      <h3>Suggested Price:</h3>
      <p id="SP">Loading</p>
    </div>`
    let Window  = `<div id="extenstionInject" >${Result}${Debug}</div>`
  const code = `function runextension(){
    if(document.getElementById("extenstionInject")){
      document.getElementById("extenstionInject").parentNode.removeChild(document.getElementById("extenstionInject"));
    }
    const node = document.createElement("div")
    node.innerHTML = \`${Window}${getStyle(TEXTSIZE)}\`
    document.getElementById("mainContent").appendChild(node)
  };runextension()`;
    chrome.tabs.executeScript(null, {
      code: code
    }, function() {
      if (chrome.runtime.lastError) {
        console.log('There was an error injecting getLoading script : \n' + chrome.runtime.lastError.message);
      }
    });
}

function numberWithCommas(x) {
  
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}