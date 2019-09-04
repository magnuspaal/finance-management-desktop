var $ = require('jquery');
require('popper.js')
require('bootstrap');

var { ipcRenderer } = require('electron');
var { Api } =  require('rest-api-handler');
var api = new Api('https://magnuspaal.com');

var constants = require("../utils/constants")

var { ipcRenderer } = require('electron');

module.exports = {
    refreshFuture: refreshFuture
}

function refreshFuture(userId) { 
    $('#future-list').empty();
    $('#future-list').append('<div class="spinner-border mt-5" role="status">');
    $('#spinner-border').append('<span class="sr-only">Loading...</span>');
    api.get("wallet/api/payment/read.php", {
        user: userId,
        state: 0,
        datePassed: 0
    }).then((response) => {
        return response.json();
    }).then((data) => {
        $("#future-list").empty();
        currentBalance = ipcRenderer.sendSync("get-balance");
        dayAmounts = findDayAmounts(data, currentBalance);
        dayChange = findDayChange(data)
        keys = Object.keys(dayAmounts);
        selected = null;
        keys.sort(function(a,b) {
            return new Date(a).getTime() - new Date(b).getTime();
        });
        var last = 0;
        $.each(keys, function(index, value) {
            date = new Date(value);
            dateString = date.getDate() + " " + constants.MONTH_NAMES[date.getMonth()] + " " + date.getFullYear();
            $("#future-list").append('<div class="card shadow-sm" id="future-card-' + index + '" style="margin-bottom: 20px;"></div>');
            $("#future-card-" + index).append('<div class="card-body future-card-body" id="future-card-body-' + index + '" amount="' + dayAmounts[date] + '" date="' + dateString + '"></div>');
            $("#future-card-body-" + index).append('<div class="future-card-text" id="future-card-text-' + index + '"></div>');
            $("#future-card-text-" + index).append('<h5>' + dateString + '</h5>')
            $("#future-card-text-" + index).append('<h5 class="' + (dayChange[date] < 0 ? "text-danger" : "text-success") + '">' + dayChange[date] + '</h5>')
            $("#future-card-text-" + index).append('<h6>' + dayAmounts[date] + '</h6>')

            $(".future-card-body").unbind().click(function() {
                amount = $(this).attr("amount");
                date = $(this).attr("date");
                if (selected === date) {
                    $("#balance-date").html("");
                    $("#balance").html(currentBalance);
                    selected = null;
                } else {
                    $("#balance-date").html(date);
                    $("#balance").html(amount);
                    selected = date;
                }
            })
        })
    })
}

function findDayAmounts(data, currentBalance) {
    data.sort(function(a, b) {
        return new Date(a.date.year, a.date.month, a.date.day).getTime() - new Date(b.date.year, b.date.month, b.date.day).getTime();
    })

    var dayAmounts = new Object();

    amount = parseFloat(currentBalance);

    $.each(data, function(index, value) {
        date = new Date(value.date.year, value.date.month - 1, value.date.day);

        if (value.type == constants.OUTGOING) {
            amount -= parseFloat(value.amount);
        } else {
            amount += parseFloat(value.amount);
        }

        dayAmounts[date] = parseFloat(amount).toFixed(2);
    })
    return dayAmounts;
}

function findDayChange(data) {
    data.sort(function(a, b) {
        return new Date(a.date.year, a.date.month, a.date.day).getTime() - new Date(b.date.year, b.date.month, b.date.day).getTime();
    })

    var dayChange = new Object();

    $.each(data, function(index, value) {
        var amount = 0;
        date = new Date(value.date.year, value.date.month - 1, value.date.day);
        if (!(date in dayChange)) {
            dayChange[date] = 0.0;
        }

        if (value.type == constants.OUTGOING) {
            amount -= parseFloat(value.amount);
        } else {
            amount += parseFloat(value.amount);
        }

        dayChange[date] += parseFloat(parseFloat(amount).toFixed(2));
    })
    return dayChange;
}
