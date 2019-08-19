var $ = require("../node_modules/jquery/dist/jquery.min");
var {ipcRenderer} = require('electron');

$(document).ready(function(e) {
    $('#log-out').click(function(e) {
        console.log("clicked");
        ipcRenderer.send('logged-out');
        document.location.href = "login.html";
    })
});

