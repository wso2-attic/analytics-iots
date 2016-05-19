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
bc.buttonUnmonitoredOnCLick = null;
bc.buttonNonCompliaintOnCLick = null;

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
            colorScale: ["#2ecc71", "#e74c3c", "#f39c12"],
            colorDomain: ["Active", "Blocked", "Inactive"]
        }
    ],
    width: $(window).width() * 0.95,
    height: $(window).width() * 0.65 > $(window).height() ? $(window).height() : $(window).width() * 0.65,
    padding: {"top": 18, "left": 30, "bottom": 22, "right": 70}
};

bc.initialize = function () {
    bc.loadFiltersFromURL();
    bc.startPolling();
};

bc.loadFiltersFromURL = function () {

    wso2.gadgets.XMLHttpRequest.get(gadgetConfig.source,
        function(response){
            //console.log(response[0]);
            bc.filter_context = response[0].groupingAttribute;
        }, function(){
            console.warn("Error accessing source for : " + gadgetConfig.id);
        });

    var params = getURLParams();
    for (var filter in params) {
        if (params.hasOwnProperty(filter)
            && filter.lastIndexOf(bc.filter_prefix, 0) === 0) {
            var filter_context = filter.substring(bc.filter_prefix.length);
            if (bc.filter_context === filter_context) {
                bc.selected_filter_groups = params[filter];
            } else {
                bc.updateFilters({
                    filteringContext: filter_context,
                    filteringGroups: params[filter]
                });
            }
        }
    }
    // TODO : update selected bars (UI)
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

    wso2.gadgets.XMLHttpRequest.get(gadgetConfig.source,
        function(response){
            if (Object.prototype.toString.call(response) === '[object Array]' && response.length === 1) {
                bc.filter_context = response[0].groupingAttribute;
                var data = response[0]["data"];
                if (data && data.length > 0) {
                    var non_complaint1 = document.getElementById('non-complaintSpan');
                    non_complaint1.innerHTML = data[0].deviceCount;
                    var non_complaint = document.getElementById('non-complaint');
                    if (data[0].deviceCount == 0) {
                        if (non_complaint.hasAttribute("onclick")){
                            non_complaint.removeAttribute("onclick");
                        }
                    } else {
                        non_complaint.setAttribute("onclick", "bc.onclick2('"+data[0].group+"')");
                    }

                    var unmonitored1 = document.getElementById('unmonitoredSpan');
                    unmonitored1.innerHTML = data[1].deviceCount;
                    var unmonitored = document.getElementById('unmonitored');
                    if (data[1].deviceCount == 0) {
                        if (unmonitored.hasAttribute("onclick")){
                            unmonitored.removeAttribute("onclick");
                        }
                    } else {
                        unmonitored.setAttribute("onclick", "bc.onclick2('"+data[1].group+"')");
                    }
                }
            } else {
                console.error("Invalid response structure found: " + JSON.stringify(response));
            }
        }, function(){
            console.warn("Error accessing source for : " + gadgetConfig.id);
        });
};

bc.onclick2 = function (filterGroup) {
    var url = getBaseURL() + "devices?g_" + bc.filter_context + "=" + filterGroup;
    window.open(url);
};

$(document).ready(function () {
    bc.initialize();
});
