/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var fromDate, toDate, currentDay = new Date();
var startDate = new Date(currentDay.getTime() - (60 * 60 * 24 * 100));
var endDate = new Date(currentDay.getTime());

function initDate() {
    currentDay = new Date();
}

var DateRange = convertDate(startDate) + " to " + convertDate(endDate);

$(document).ready(function () {
    initDate();

    $(".nano").nanoScroller({
        alwaysVisible: true,
        scroll: "top"
    });

    $('.nano-pane').attr('style', ' ');

    setDateTime(currentDay.getTime() - 3600000, currentDay.getTime());

});

function setDateTime(from, to) {
    fromDate = from;
    toDate = to;
    startDate = new Date(from);
    endDate = new Date(to);

    DateRange = convertDate(startDate) + " to " + convertDate(endDate);

    var tzOffset = new Date().getTimezoneOffset() * 60 / 1000;

    from += tzOffset;
    to += tzOffset;

    // the relevant import units needs to implement this.

    drawGraph_connectedcup(parseInt(from / 1000), parseInt(to / 1000));

}

function convertDate(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    return date.getFullYear() + '-' + (('' + month).length < 2 ? '0' : '') + month + '-' +
        (('' + day).length < 2 ? '0' : '') + day + " " + (('' + hour).length < 2 ? '0' : '') +
        hour + ":" + (('' + minute).length < 2 ? '0' : '') + minute;
}
