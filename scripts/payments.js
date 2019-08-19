var $ = require("../node_modules/jquery/dist/jquery.min");

var { ipcRenderer } = require('electron');
var { Api } =  require('rest-api-handler');
var api = new Api('https://magnuspaal.com');

var constants = require("../utils/constants")

module.exports = {
  refreshPayments: refreshPayments
}

function refreshPayments(userId) {
  $('#months-container').append('<div class="spinner-border mt-5" role="status">');
  $('#spinner-border').append('<span class="sr-only">Loading...</span>');
  return api.get("wallet/api/payment/read.php", {
    user: userId,
    state: 0
  })
  .then((response) => {
    var future = require("../scripts/home")
    future.refreshFuture(ipcRenderer.sendSync("get-id"));
    return response.json();
  })
  .then((data) => {
    monthArray = findMonthArray(data);
    $('#months-container').empty();
    $.each(monthArray, function( index, value ) {
      date = new Date(value);
      $('#months-container').append('<li id="month-item-' + index + '" class="month-item"></li>');
      $('#month-item-' + index).append('<h6 class="month-name">' + constants.MONTH_NAMES[date.getMonth()] + " " + date.getFullYear() + '</h6>');
      $('#month-item-' + index).append('<div id="month-payments-' + index + '"></div>');
      payments = getPaymentsOfMonth(date, data);
      $.each(payments, function( index_payment, value_payment) {
        $('#month-payments-' + index).append('<div class="card shadow-sm" style="margin-bottom: 20px;" id="payment-card-' + value_payment['id'] + '"></div>');
        $('#payment-card-' + value_payment['id']).append('<div class="card-body card-payment-body" id="payment-card-body-' + value_payment['id'] + '"></div>');
        $('#payment-card-body-' + value_payment['id']).append('<h3 class="payment-day">' + value_payment.date.day + '</h3>');
        $('#payment-card-body-' + value_payment['id']).append('<div class="payment-info" id="payment-info-' + value_payment['id'] + '"></div>')
        $('#payment-info-' + value_payment['id']).append('<h5>' + value_payment.name + '</h5>');
        $('#payment-info-' + value_payment['id']).append('<h6>' + (value_payment['type'] == constants.INCOMING ? "+" : "-") + value_payment.amount + '</h6>');
        if (value_payment['datePassed'] == 1) {
          $('#payment-info-' + value_payment['id']).append('<div id="payment-buttons-' + value_payment['id'] + '" class="payment-buttons"></div>');
          $('#payment-buttons-' + value_payment['id']).append('<a id="' + value_payment['id'] + '" type="add" class="card-link">Add</a>');
          $('#payment-buttons-' + value_payment['id']).append('<a id="' + value_payment['id'] + '" type="remove" class="card-link">Cancel</a>');
        }

        $('.card-link').unbind().click(function() {
          id = $(this).attr('id');
          type = $(this).attr('type');
          state = type === "add" ? constants.CONFIRMED : constants.CANCELLED;
          changePaymentState(id, state);
        });
      })
    });
  });
}

function findMonthArray(paymentArray) {
    monthArray = [];
    times = [];
    $.each(paymentArray, function( index, value ) {
        month = value.date.month - 1;
        year = value.date.year;
        monthYear = new Date(year, month, 1);
        if(!monthArray.includes(monthYear.getTime())) {
            monthArray.push(monthYear.getTime());
        }
    });
    monthArray.sort(function(a, b){return a-b});
    return monthArray;
}

function getPaymentsOfMonth(monthYear, data) {
  payments = [];
  $.each(data, function(index, value) {
    p_date = new Date(value.date.year, value.date.month - 1, value.date.day);
    if(monthYear.getMonth() == p_date.getMonth() && monthYear.getFullYear() == p_date.getFullYear()) {
      payments.push(value);
    }
  })
  payments.sort(function(a, b) {
    return new Date(a.date.year, a.date.month, a.date.day).getTime() - new Date(b.date.year, b.date.month, b.date.day).getTime();
  })
  return payments;
}

function changePaymentState(id, state) {
  api.put("wallet/api/payment/edit.php", {
    id: id,
    state: state
  }).then(function(response) {
    refreshPayments(ipcRenderer.sendSync("get-id"));
  }).catch(function(err) {
    // Handle error
  })
}

