var $ = require('jquery');
require('popper.js')
require('bootstrap');

var sha256 = require('sha256');
var crs = require('crypto-random-string');
var { ipcRenderer } = require('electron');

var service = require("../scripts/service");
var constants = require("../utils/constants");

module.exports = {
  setDatePickerDate: function(dateBegin, dateEnd) {
    var drp = $('.datepicker').data('daterangepicker');
    drp.setStartDate(dateBegin);
    drp.setEndDate(dateEnd);
  }
}

$(document).ready(function(e) {

  service.refreshBalance();

  setSingleDatePicker();

  //// NAV ///////////////////////////////////////////
  $('nav li').unbind('click');
  $('nav li').click(function(e) {
    e.preventDefault();
    var pageToLoad = $(this).children('a').attr('href');
    $('nav li').removeClass('active');
    $(this).addClass('active');

    $("#home").removeClass("d-flex");
    $("#home").addClass("d-none");
    $("#plans").removeClass("d-flex");
    $("#plans").addClass("d-none");
    $("#payments").removeClass("d-flex");
    $("#payments").addClass("d-none");
    $("#settings").removeClass("d-flex");
    $("#settings").addClass("d-none");

    $("#" + pageToLoad).addClass("d-flex");
    $("#" + pageToLoad).removeClass("d-none");

    if(pageToLoad == "home") {
      home = require("../scripts/home");
      home.refreshFuture(ipcRenderer.sendSync("get-id"));
    } else if (pageToLoad == "plans") {
      plans = require("../scripts/plans");
      plans.refreshPlans(ipcRenderer.sendSync("get-id"));
    } else if (pageToLoad == "payments") {
      payments = require("../scripts/payments");
      payments.refreshPayments(ipcRenderer.sendSync("get-id"));
    }
  });

  $('#balance-input').keyup(function() {
    if($(this).val() === "" || parseFloat($(this).val()) < 0) {
      $(".btn-balance-change").prop('disabled', true);
    } else {
      $(".btn-balance-change").removeAttr('disabled');
    }
  })

  $('#add-balance').click(function(e) {
    const added = $('#balance-input').val();
    service.editBalance(added);
    $('#balance-input').val('');
  });

  $('#remove-balance').click(function(e) {
    const added = $('#balance-input').val();
    service.editBalance(-added);
    $('#balance-input').val('');
  });
  /////////////////////////////////////////////////////////

  //// ADD PLAN ///////////////////////////////////////////
  $("#add-plan-button").unbind('click');
  $("#add-plan-button").click(function(e) {
    $("#add-plan-name").val("");
    $("#add-plan-amount").val("");
    $("#plan-modal-title").html("New Plan");
    $("#profit").prop("checked",  true);
    $("#expense").prop("checked",  false);
    $("#edit-plan").addClass("d-none");
    $("#save-plan").removeClass("d-none");
    $('#delete-plan').addClass('d-none');
  })

  $("#save-plan").unbind('click');
  $("#save-plan").click(function(e) {
    var name = $("#add-plan-name").val();
    var amount = $("#add-plan-amount").val();
    var type = 0;
    if ($("#profit").prop("checked")) {
      type = constants.PROFIT;
    } else {
      type = constants.EXPENSE;
    }
    addPlan(ipcRenderer.sendSync("get-id"), name, amount, type)
    .then(function(e) {
      plans = require("../scripts/plans");
      plans.refreshPlans(ipcRenderer.sendSync("get-id"));
    });
  })

  function addPlan(id, name, amount, type) {
    return (api.post("wallet/api/planitem/create.php", {
      user: id,
      name: name,
      amount: amount, 
      type: type,
      state: constants.PENDING
    }));
  };
  ////////////////////////////////////////////////////////////

  //// ADD PAYMENT ///////////////////////////////////////////
  $("#add-payment-button").unbind('click');
  $('#add-payment-button').click(function(e) {
    $('#payment-regularity').addClass('d-block');
    $('#payment-regularity').removeClass('d-none');

    $("#add-payment-name").val("");
    $("#add-payment-amount").val("");
    $("#payment-modal-title").html("New Payment");

    $("#edit-payment").addClass("d-none");
    $("#save-payment").removeClass("d-none");

    $('#delete-payment').addClass('d-none');

    $('.datepicker').removeClass('d-none');
  })

  $('#paymentModal').on('hidden.bs.modal', function(e) {
    $('#payment-regularity').val("Single");
    setSingleDatePicker();
  })
  
  $("#payment-regularity").change(function() {
    regularity = $('#payment-regularity').val();
    if(regularity == constants.SINGLE) {
      setSingleDatePicker();
    } else {
      $('.datepicker').daterangepicker();
    }
  })

  $("#save-payment").unbind('click');
  $("#save-payment").click(function() {
    userId = ipcRenderer.sendSync('get-id');

    dates = getDateFromPicker();
    firstDate = dates[0];
    lastDate = dates[1];

    name = $("#add-payment-name").val();
    amount = $("#add-payment-amount").val();
    type = $('input[id=\'incoming\']:checked').val() ? constants.INCOMING : constants.OUTGOING;
    regularity = $("#payment-regularity").children("option:selected").val();
    hash = regularity == constants.SINGLE ? null : sha256(name + crs({length: 16, type: 'base64'}))
    addPayments(userId, firstDate, lastDate, name, amount, type, regularity, hash).then(function(response) {
      payments = require("../scripts/payments");
      payments.refreshPayments(ipcRenderer.sendSync("get-id"));

    })
    .catch(function(err) {

    });
  })

  function setSingleDatePicker() {
    $('.datepicker').daterangepicker({
      singleDatePicker: true,
      showDropdowns: true,
      minYear: 1901,
      maxYear: parseInt(moment().format('YYYY'),10)
    });
  }
  
  function getDateFromPicker() {
    dates = $('#payment-date').val().split(" - ");
    datesLen = dates.length;
    firstDate = null;
    lastDate = null;
    values = [];
    if (datesLen == 1) {
      date = dates[0].split("/");
      firstDate = {month: parseInt(date[0], 10), day: parseInt(date[1], 10), year: parseInt(date[2])}
    } else if (datesLen == 2) {
        first = dates[0].split("/");
        firstDate = {month: parseInt(first[0], 10), day: parseInt(first[1], 10), year: parseInt(first[2])}
  
        last = dates[1].split("/");
        lastDate = {month: parseInt(last[0], 10), day: parseInt(last[1], 10), year: parseInt(last[2])}
    }
    values.push(firstDate);
    values.push(lastDate);
    return values;
  }
  
  function addPayments(userId, firstDate, lastDate, name, amount, type, regularity, hash) {
    return api.post("wallet/api/payment/create.php", {
      user: userId,
      firstDate: firstDate,
      lastDate: lastDate,
      name: name,
      amount: amount,
      type: type,
      regularity: regularity,
      hash: hash
    })
  }
  ////////////////////////////////////////////////////////////

  $("#edit-plan").unbind('click');
  $("#edit-plan").click(function(e) {
    api.put('wallet/api/planitem/edit.php', {
      id: id,
      name: $("#add-plan-name").val(),
      amount: $("#add-plan-amount").val(),
      type: $("#profit").prop("checked") ? constants.PROFIT : constants.EXPENSE
    }).then(function(response) {
      $("#add-plan-name").val("");
      $("#add-plan-amount").val("");
      $("#profit").prop("checked",  true);
      $("#expense").prop("checked",  false);
      $("#save-plan").removeClass("d-none");
      $("#edit-plan").addClass("d-none");
      refreshPlans(ipcRenderer.sendSync("get-id"));
    })
  })

  $("#edit-payment").unbind('click');
  $("#edit-payment").click(function(e) {

    date = $('.datepicker').val().split("/");
    date = {month: parseInt(date[0], 10), day: parseInt(date[1], 10), year: parseInt(date[2])}

    hash = $('#paymentModal').attr("hash");

    id = hash != "" ? null : $('#paymentModal').attr("payment-id");
    
    api.put('wallet/api/payment/edit.php', {
      id: id,
      hash: hash,
      date: date,
      name: $("#add-payment-name").val(),
      amount: $("#add-payment-amount").val(),
      type: $("#incoming").prop("checked") ? constants.INCOMING : constants.OUTGOING
    }).then(function(response) {
      $("#add-payment-name").val("");
      $("#add-payment-amount").val("");
      $("#incoming").prop("checked",  true);
      $("#outgoing").prop("checked",  false);
      refreshPayments(ipcRenderer.sendSync("get-id"));
      service.refreshBalance();
    })
  })
});


