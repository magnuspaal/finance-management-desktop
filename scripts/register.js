var $ = require("../node_modules/jquery/dist/jquery.min");
var service = require("../scripts/service");
var sha256 = require('sha256');
const {ipcRenderer} = require('electron');
var { Api } =  require('rest-api-handler');
var api = new Api('https://magnuspaal.com');

$(document).ready(function(e) {

  $('#register').click(function(e) {
    e.preventDefault();

    var password = sha256($('#password-reg').val());

    newUser($('#username-reg').val(), password, "SHA-256");
  });

  function newUser(username, hash, algo) {
    api.post("wallet/api/user/create.php", {
      userName: username,
      passwordHash: hash,
      passwordAlgo: algo
    }).then(function(response) {
      document.location.href = "login.html";
      return response.json();
    }).catch(function(err) {
      // CAN'T REGISTER
    })
  }
});
