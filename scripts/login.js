var $ = require("../node_modules/jquery/dist/jquery.min");
var service = require("../scripts/service");
var sha256 = require('sha256');
var {ipcRenderer} = require('electron');
var { Api } =  require('rest-api-handler');
var api = new Api('https://magnuspaal.com');

$(document).ready(function(e) {

  $('#login').click(function(e) {
    e.preventDefault();

    var password = sha256($('#password').val());

    authenticateUser($("#username").val(), password);
  });

  $('#register').click(function(e){
      e.preventDefault();
      document.location.href = 'register.html';
  });

  function authenticateUser(username, hash) {
    api.put("wallet/api/user/read.php?userName=" + username + "&passwordHash=" + hash)
    .then((response) => {
      return response.json();
    }).then((data) => {
      document.location.href = "index.html";
      ipcRenderer.send("logged-in", {id: data.id, userName: data.userName, passwordHash: data.passwordHash});
    }).catch((err) => {
      // CAN'T LOGIN
    })
  }
});
