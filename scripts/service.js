var $ = require("../node_modules/jquery/dist/jquery.min");

var { Api } =  require('rest-api-handler');
var api = new Api('https://magnuspaal.com');
var {ipcRenderer} = require('electron');

var constants = require("../utils/constants");

module.exports = {
  refreshBalance: function() {
    $("#balance-spinner").addClass("d-block");
    $("#balance-spinner").removeClass("d-none");
    $("#balance").addClass("d-none");
    $("#balance").removeClass("d-block");
    userdata = ipcRenderer.sendSync("get-userdata");
    api.get('wallet/api/user/read.php?userName=' + userdata['userName'] +
    '&passwordHash=' + userdata['passwordHash'])
    .then((response) => {
        return response.json();
    }).then(function(data) {
      $("#balance-spinner").addClass("d-none");
      $("#balance-spinner").removeClass("d-block");
      $("#balance").addClass("d-block");
      $("#balance").removeClass("d-none");
      $('#balance').html(data.balance);
      if (ipcRenderer.sendSync("set-balance", data.balance)) {
        future = require("../scripts/home");
        future.refreshFuture(ipcRenderer.sendSync("get-id"));
        plans = require("../scripts/plans");
        plans.refreshPlans(ipcRenderer.sendSync("get-id"));
      };
    })
  },

  editBalance: function(added) {
    userdata = ipcRenderer.sendSync("get-userdata");
    api.put('wallet/api/user/edit.php', {
      id: userdata['id'],
      userName: userdata['userName'],
      passwordHash: userdata['passwordHash'],
      balance: added
    })
    .then((value) => {
      this.refreshBalance();
    });
  },

  changePlanState: function(state, id) {
    return api.put("wallet/api/planitem/edit.php", {
      id: id,
      state: state
    });
  },
};
