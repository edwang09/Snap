const SUGGEST_PRICE = {
  "aggressive": [0.6, 0.68, 0.76, 0.9, 1],
  "intermediate": [0.68, 0.76, 0.9, 1, 1.2],
  "conservative": [0.76, 0.9 , 1, 1.2, 1.4]
}
// Saves options to chrome.storage
function save_options() {
  var limit = document.getElementById('limit').value;
  var noauction = document.getElementById('noauction').checked;
  var shipping = document.getElementById('shipping').checked;
  var bestoffer = document.getElementById('bestoffer').checked;
  var showdetail = document.getElementById('showdetail').checked;
  var suggesttype = document.getElementById('suggesttype').value;
  var textsize = document.getElementById('textsize').value;
  var removetop = document.getElementById('removetop').checked;
  var p0 = document.getElementById('p0').value/100;
  var p1 = document.getElementById('p1').value/100;
  var p2 = document.getElementById('p2').value/100;
  var p3 = document.getElementById('p3').value/100;
  var p4 = document.getElementById('p4').value/100;
  console.log([p0, p1, p2, p3, p4 ])
  console.log(removetop)
  if (suggesttype==='custom' && !(p0 && p1 && p2 && p3 && p4)){
    var status = document.getElementById('status');
    status.textContent = 'Options not saved. custome bruckets cant be empty.';
  }else{

    chrome.storage.sync.set({
      limit: limit,
      noauction: noauction,
      shipping: shipping,
      bestoffer: bestoffer,
      showdetail: showdetail,
      suggesttype: suggesttype,
      textsize: textsize,
      removetop: removetop,
      customSP: [p0, p1, p2, p3, p4 ]
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
  }
}
// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
      limit: 600,
      noauction: true,
      shipping: true,
      bestoffer: true,
      showdetail: true,
      suggesttype: "intermediate",
      textsize: "medium",
      customSP: [0.68, 0.76, 0.9, 1, 1.2],
      removetop: true
  }, function(items) {
    console.log(items)
    document.getElementById('limit').value = items.limit;
    document.getElementById('noauction').checked = items.noauction;
    document.getElementById('shipping').checked = items.shipping;
    document.getElementById('bestoffer').checked = items.bestoffer;
    document.getElementById('showdetail').checked = items.showdetail;
    document.getElementById('suggesttype').value = items.suggesttype;
    document.getElementById('textsize').value = items.textsize;
    document.getElementById('p0').value = items.customSP[0]*100;
    document.getElementById('p1').value = items.customSP[1]*100;
    document.getElementById('p2').value = items.customSP[2]*100;
    document.getElementById('p3').value = items.customSP[3]*100;
    document.getElementById('p4').value = items.customSP[4]*100;
    document.getElementById('removetop').checked = items.removetop;
    if (items.suggesttype==='custom'){
      document.getElementById('customSP').style.display = "block"
    }
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
    
document.getElementById('suggesttype').onchange = function(e){
  console.log(e.target.value)
  if (e.target.value==='custom'){
    document.getElementById('customSP').style.display = "block"
  }else{
    document.getElementById('customSP').style.display = "none"
  }
}
