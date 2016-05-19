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

var bc = bc || {};
bc.chart = null;
bc.polling_task = null;
bc.data = [];
bc.filter_context = null;
bc.filters_meta = {};
bc.filters = [];
bc.filter_prefix = "g_";
bc.selected_filter_groups = [];
bc.force_fetch = false;
bc.freeze = false;
bc.div = "#chart";
bc.fromIndex = 0;
bc.count = 5;
bc.prevTotalPages = -1;
bc.globalPage = 1;
bc.filterContextFromURL = "";

bc.meta = {
    "names": ["id", "name", "count"],
    "types": ["ordinal", "ordinal", "linear"]
};
bc.config = {
    type: "bar",
    x: "id",
    charts: [
        {
            type: "bar",
            y: "count",
            color: "name",
            xTitle: "",
            yTitle: "",
            mode: "group",
            colorScale: ["#D9534F"],
            orientation: "left",
            legend: false
        }
    ],
    //textColor:"#ffffff",
    //text:"count",
    //textAlign:"right",
    //yAxisStrokeSize:0,
    //yAxisFontSize:0,
    grid: false,
    width: $('body').width(),
    height: $('body').height() - 160,
//    width: $(window).width() * 0.95,
//    height: $(window).width() * 0.65 > $(window).height() ? $(window).height() : $(window).width() * 0.65,
    padding: {"top": 15, "left": 150, "bottom": 30, "right": 50}
};

bc.initialize = function () {
    bc.chart = new vizg(
        [
            {
                "metadata": bc.meta,
                "data": bc.data
            }
        ],
        bc.config
    );
    bc.chart.draw("#chart", [
        {
            type: "click",
            callback: bc.onclick
        }
    ]);
    bc.startPolling();
};

bc.changePaginationNumber = function (count) {
    bc.count = parseInt(count);
    bc.data = [];
    bc.initialize();
};

bc.startPolling = function () {
    setTimeout(function () {
        bc.update();
        bc.freeze = bc.selected_filter_groups.length > 0;
    }, 500);
    this.polling_task = setInterval(function () {
        bc.update();
    }, gadgetConfig.polling_interval);
};

bc.update = function (force) {
    bc.force_fetch = !bc.force_fetch ? force || false : true;
    if (!bc.freeze) {
        bc.fetch(function (data) {
            bc.chart.insert(data);
        });
    }
};

bc.fetch = function (cb) {
    bc.data.length = 0;
    bc.force_fetch = false;
    wso2.gadgets.XMLHttpRequest.get(gadgetConfig.source + "?start=" + bc.fromIndex + "&length=" + bc.count,
        function(response){
            if (Object.prototype.toString.call(response) === '[object Array]' && response.length === 1) {
                bc.filter_context = response[0]["groupingAttribute"];
                var data = response[0]["data"];
                if (data && data.length > 0) {
                    for (var i = 0; i < data.length; i++) {
                        bc.data.push(
                            [data[i]["group"], data[i]["displayNameForGroup"], data[i]["deviceCount"]]
                        );
                    }
                    if (bc.force_fetch) {
                        bc.update();
                    } else {
                        cb(bc.data);
                    }
                    bc.onData(response);
                    var div = document.getElementById('noOfNonCompliancePolicies');
                    div.innerHTML = response[0]["totalRecordCount"];
                }
            } else {
                console.error("Invalid response structure found: " + JSON.stringify(response));
            }
        }, function(){
            console.warn("Error accessing source for : " + gadgetConfig.id);
        });
};

bc.onclick = function (event, item) {
    if (!bc.filterContextFromURL) {
        var filteringGroup = item.datum[bc.config.x];
        var url = getBaseURL() + "filter?g_" + bc.filter_context + "=" + filteringGroup;
        window.open(url);
    }
};

$(document).ready(function () {
    bc.initialize();
});

bc.onPaginationClicked = function (e, originalEvent, type, page) {
    bc.globalPage = page;
    bc.fromIndex = (page - 1) * bc.count;
    bc.globalPage = bc.fromIndex;
    bc.data = [];
    bc.chart = new vizg(
        [
            {
                "metadata": bc.meta,
                "data": bc.data
            }
        ],
        bc.config
    );
    bc.chart.draw("#chart", [
        {
            type: "click",
            callback: bc.onclick
        }
    ]);

    bc.update();
};

bc.onData = function (response) {
    try {
        var allDataCount = response[0]["totalRecordCount"];
        var totalPages = parseInt(allDataCount / bc.count);
        if (allDataCount % bc.count != 0) {
            totalPages += 1;
        }
        var options = {
            currentPage: bc.globalPage,
            totalPages: totalPages,
            onPageClicked: bc.onPaginationClicked
        };
        $('#idPaginate').bootstrapPaginator(options);
    } catch (e) {
        $('#canvas').html(gadgetUtil.getErrorText(e));
    }
};
