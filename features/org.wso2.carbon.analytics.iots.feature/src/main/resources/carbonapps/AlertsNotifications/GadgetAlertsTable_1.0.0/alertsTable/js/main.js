/*
 * Copyright (c)  2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var dt = dt || {};
dt.canvasDiv = "#canvas";
dt.REFRESH_INTERVAL = 60000;
dt.datasource = gadgetConfig.datasource;
dt.filter = gadgetConfig.filter;
dt.type = gadgetConfig.type;
dt.columns = gadgetConfig.columns;

var table;
var nanoScrollerSelector = $('.nano');

dt.initialize = function() {
	dt.startPolling();
};

dt.startPolling = function() {

	dt.update();

	setInterval(function() {
		dt.update();
	}, dt.REFRESH_INTERVAL);
};

dt.update = function() {

	dt.fetch(function(data) {

		$(dt.canvasDiv).empty();
		if ($.fn.dataTable.isDataTable('#alertsTable')) {
			table.destroy();
		}

		table = $("#alertsTable").DataTable(
				{
					data : data,
					order : [[2, "desc"]],
					columns : [{
						title : "Type"
					}, {
						title : "Message"
					}, {
						title : "Time Stamp"
					}, {
						title : "Severity"
					}],
					dom : '<"dataTablesTop"' + 'f' + '<"dataTables_toolbar">'
							+ '>' + 'rt' + '<"dataTablesBottom"' + 'lip' + '>'
				});

		nanoScrollerSelector[0].nanoscroller.reset();
		table.on('draw', function() {
			nanoScrollerSelector[0].nanoscroller.reset();
		});

	});
};

dt.fetch = function(callback) {
	var timeFrom = "undefined";
	var timeTo = "undefined";
	var count = "undefined";
	var request = {
		type : 8,
		tableName : dt.datasource,
		filter : dt.filter,
		timeFrom : timeFrom,
		timeTo : timeTo,
		start : 0,
		count : count
	};
	$.ajax({
		url : "/portal/apis/analytics",
		method : "GET",
		data : request,
		contentType : "application/json",
		success : function(data) {
			if (callback != null) {
				callback(dt.makeRows(JSON.parse(data.message)));
			}
		}
	});
};

dt.makeRows = function(data) {
	var rows = [];
	for (var i = 0; i < data.length; i++) {
		var record = data[i];
		var displayValue;
		var row = dt.columns.map(function(column) {

			if (column.name == 'time') {
				displayValue = dt.getTimeStamp(record.values[column.name])

			} else if (column.name == 'severity') {

				if (record.values[column.name] == 'high') {
					displayValue = '<span class="label label-danger">'
							+ record.values[column.name] + '</span>';
				} else if (record.values[column.name] == 'medium') {
					displayValue = '<span class="label label-warning">'
							+ record.values[column.name] + '</span>';
				} else {
					displayValue = '<span class="label label-default">'
							+ record.values[column.name] + '</span>';
				}

			} else {
				displayValue = record.values[column.name];
			}

			return displayValue;
		});
		rows.push(row);
	};
	return rows;
};

dt.getTimeStamp = function(unixTime) {

	var date = new Date(unixTime);
	var year = date.getFullYear();
	var month = ("0" + (date.getMonth() + 1)).substr(-2);
	var day = ("0" + date.getDate()).substr(-2);
	var hour = ("0" + date.getHours()).substr(-2);
	var minutes = ("0" + date.getMinutes()).substr(-2);
	var seconds = ("0" + date.getSeconds()).substr(-2);

	return year + "-" + month + "-" + day + " " + hour + ":" + minutes + ":"
			+ seconds;
}

$(document).ready(function() {
	dt.initialize();
});
