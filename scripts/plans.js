var $ = require("../node_modules/jquery/dist/jquery.min");
var service = require("../scripts/service");
var constants = require("../utils/constants")
var { ipcRenderer } = require('electron');
var { Api } =  require('rest-api-handler');
var api = new Api('https://magnuspaal.com');

module.exports = {
  refreshPlans: refreshPlans
}

function refreshPlans(userId) {
  $('#plans-container').empty();
  $('#plans-container').append('<div class="spinner-border mt-5" role="status">');
  $('#spinner-border').append('<span class="sr-only">Loading...</span>');
  api.get('wallet/api/planitem/read.php', {
    user: userId,
    state: 0
  })
  .then((response) => {
    return response.json();
  }).then((data) => {
    $('#plans-container').empty();
    afterPlanAmount = 0;
    $.each(data, function( index, value ) {
      $('#plans-container').append('<li id="plan-item-' + value.id + '"></li>');
      $('#plan-item-' + value.id).append('<div class="card shadow-sm plan-card" style="width: 18rem; margin-bottom: 20px;" id="plan-card-' + value.id + '" plan-id="' + value.id + '" data-toggle="modal" data-target="#planModal"></div>');
      $('#plan-card-' + value.id).append('<div class="card-body" id="plan-card-body-' + value.id + '"></div>');
      $('#plan-card-body-' + value.id).append('<h5 id="plan-name">' + value.name + '</h5>');
      $('#plan-card-body-' + value.id).append('<h6 id="plan-amount">' + (value.type == constants.EXPENSE ? "-" : "+") + value.amount + '</h6>');
      $('#plan-card-body-' + value.id).append('<a href="" id="' + value.id + '" type="add" amount="' + (value.type == constants.EXPENSE ? "-" : "+") + value.amount + '" class="card-link">Add</a>');
      $('#plan-card-body-' + value.id).append('<a href="" id="' + value.id + '" type="remove" class="card-link">Cancel</a>');

      afterPlanAmount += value.type == constants.EXPENSE ? -parseFloat(value.amount) : parseFloat(value.amount);
      
      $(".card-link").click(function(e) {
        e.preventDefault();
    
        $("#plan-card-" + $(this).attr("id")).addClass("d-none");
      
        if($(this).attr("type") == "add") {
          var amount = parseFloat($(this).attr("amount"));
          service.changePlanState(constants.CONFIRMED, $(this).attr("id"))
          .then(function() {
            refreshPlans(ipcRenderer.sendSync("get-id"));
            service.editBalance(amount);
          });
        } else {
          service.changePlanState(constants.CANCELLED, $(this).attr("id"))
          .then(function() {
            refreshPlans(ipcRenderer.sendSync("get-id"));
          });
        }
      });

      // Edit plan, when card is clicked.
      $(".plan-card").click(function(e){
        $("#save-plan").addClass("d-none");
        $("#edit-plan").removeClass("d-none");
        $("#plan-modal-title").html("Edit Plan");

        $("#add-plan-name").val($(this).find("#plan-name").html());

        amount = $(this).find("#plan-amount").html();
        
        $("#add-plan-amount").val(amount.substring(1));

        if (amount.charAt(0) === "+") {
          $("#profit").prop("checked",  true);
          $("#expense").prop("checked",  false);
        } else {
          $("#profit").prop("checked",  false);
          $("#expense").prop("checked",  true);
        }

        $("#planModal").attr("plan-id", $(this).attr("plan-id"));
      });

    });
    currentBalance = parseFloat($("#balance").html());
    $("#after-plan-amount").html((currentBalance + afterPlanAmount).toFixed(2));
  }).catch(function(err) {
    $('#alert').empty();
    $('#alert').append('<div class="alert alert-warning alert-dismissible fade show" role="alert" id="plan-alert"></div>');
    $('#plan-alert').html("No plans were found");
    $('#plan-alert').append('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
    return;
  });
};