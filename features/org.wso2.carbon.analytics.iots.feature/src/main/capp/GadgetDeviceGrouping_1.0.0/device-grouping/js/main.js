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
bc.sum = 0;
bc.filter_contexts = [];
bc.filters_meta = {};
bc.filters = [];
bc.filter_prefix = "g_";
bc.selected_filter_groups = {};
bc.force_fetch = false;
bc.freeze = false;
bc.div = "#chart";
bc.filterContextFromURL = false; //to enable inter-gadget communication
bc.selected_filter_context_from_url = "";
bc.selected_filter_from_url = [];
bc.gadgetUrl = gadgetConfig.defaultSource;
bc.filterUrl="";
bc.API_CHANGING_PARAMETER = "non-compliant-feature-code";

bc.meta = {
    "names": ["context", "group", "name", "count"],
    "types": ["ordinal", "ordinal", "ordinal", "linear"]
};
bc.config = {
    type: "bar",
    x: "context",
    legend: false,
    legendTitleColor: "white",
    charts: [
        {
            type: "stack",
            y: "count",
            color: "name",
            xTitle: "",
            yTitle: "",
            mode: "stack"
        }
    ],
    width: $('body').width(),
    height: $('body').height(),
//    width: $(window).width() * 0.97,
//    height: 250,
    padding: {"top": 25, "left": 25, "bottom": 25, "right": 25}
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
    bc.loadFiltersFromURL();
    bc.startPolling();
};

bc.loadFiltersFromURL = function () {
    var params = getURLParams();
    if(isFilteredDashboard()){
        bc.filterContextFromURL = true;
        bc.filterUrl = getFilteringUrl();
        for (var filter in params) {
            if (params.hasOwnProperty(filter) && filter.lastIndexOf(bc.filter_prefix, 0) === 0) {
                var filter_context = filter.substring(bc.filter_prefix.length);
                if(filter_context == bc.API_CHANGING_PARAMETER){
                    bc.gadgetUrl = gadgetConfig.featureSource;
                }
            }
        }
    }
    var getUrl = bc.gadgetUrl;
    if(bc.filterUrl != ""){
        getUrl = getUrl + "?" + bc.filterUrl;
    }

    wso2.gadgets.XMLHttpRequest.get(getUrl,
        function(response){
            for (var i = 0; i < response.length; i++) {
                bc.filter_contexts.push(response[i].groupingAttribute);
                bc.selected_filter_groups[response[i].groupingAttribute] = [];
            }
            for (var filter in params) {
                if (params.hasOwnProperty(filter) && filter.lastIndexOf(bc.filter_prefix, 0) === 0) {
                    var filter_context = filter.substring(bc.filter_prefix.length);
                    bc.filterContextFromURL = true;
                    if (bc.filter_contexts.indexOf(filter_context) !== -1) {
                        bc.selected_filter_groups[filter_context] = params[filter];
                        bc.filters.push({
                            filteringContext: filter_context,
                            filteringGroups: params[filter]
                        });
                    } else {
                        bc.updateFilters({
                            filteringContext: filter_context,
                            filteringGroups: params[filter]
                        });
                    }
                }
            }
        }, function(){
            console.warn("Error accessing source for : " + gadgetConfig.id);
        });
};

bc.startPolling = function () {
    setTimeout(function () {
        bc.update();
        bc.freeze = bc.isFreeze();
    }, 500);
    this.polling_task = setInterval(function () {
        bc.update();
    }, gadgetConfig.polling_interval);
};

bc.isFreeze = function () {
    for (var i in bc.selected_filter_groups) {
        if (bc.selected_filter_groups.hasOwnProperty(i)) {
            if (bc.selected_filter_groups[i].length > 0) {
                return true;
                //if(bc.selected_filter_context_from_url != i || bc.selected_filter_from_url != bc.selected_filter_groups[i]){
                //    return true;
                //}
            }
        }
    }
    return false;
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
    var getUrl = bc.gadgetUrl;
    if(bc.filterUrl != ""){
        getUrl = getUrl + "?" + bc.filterUrl;
    }
    wso2.gadgets.XMLHttpRequest.get(getUrl,
        function(response){
            if (Object.prototype.toString.call(response) === '[object Array]') {
                for (var i = 0; i < response.length; i++) {
                    bc.sum = 0;
                    var context = response[i]["groupingAttribute"];
                    var data = response[i]["data"];
                    if (context && data) {
                        if (bc.filter_contexts.indexOf(context) === -1) {
                            bc.filter_contexts.push(context);
                            bc.selected_filter_groups[context] = [];
                        }
                        if (data.length > 0) {
                            for (var j = 0; j < data.length; j++){
                                bc.sum += data[j]["deviceCount"];
                                //console.log("group: " + data[j]["group"] + ", count: " + data[j]["count"]);
                            }

                            for (j = 0; j < data.length; j++) {
                                bc.data.push(
                                    [context, data[j]["group"], data[j]["displayNameForGroup"] + " Count: " + data[j]["deviceCount"], (data[j]["deviceCount"] / bc.sum) * 100]
                                );
                            }
                        }
                    }
                }
                if (bc.force_fetch) {
                    bc.update();
                } else {
                    cb(bc.data);
                }
            } else {
                console.error("Invalid response structure found: " + JSON.stringify(response));
            }
        }, function(){
            console.warn("Error accessing source for : " + gadgetConfig.id);
        });
};

bc.updateURL = function () {
        for (var i in bc.selected_filter_groups) {
            if (bc.selected_filter_groups.hasOwnProperty(i)) {
                //console.log(i + bc.selected_filter_groups[i].length);
                if (bc.selected_filter_groups[i].length > 0) {
                    updateURLParam(bc.filter_prefix + i, bc.selected_filter_groups[i]);
                }
            }
        }

};

bc.subscribe = function (callback) {
        gadgets.HubSettings.onConnect = function () {
            gadgets.Hub.subscribe("subscriber", function (topic, data, subscriber) {
                callback(topic, data)
            });
        };
};

bc.publish = function (data) {
        //console.log("publishing from filter-groups: " + data);
        gadgets.Hub.publish("publisher", data);

};

bc.onclick = function (event, item) {
    var filteringContext = item.datum.context;
    var filteringGroup = item.datum.group;
    if(!bc.filterContextFromURL){
        var url = getBaseURL() + "devices?g_"+filteringContext+"="+filteringGroup;
        window.open(url);
    } else {
        if (item != null) {
            var index = bc.selected_filter_groups[filteringContext].indexOf(filteringGroup);
            if (index !== -1) {
                bc.selected_filter_groups[filteringContext].splice(index, 1);
            } else {
                bc.selected_filter_groups[filteringContext].push(filteringGroup);
            }
            bc.publish({
                "filteringContext": filteringContext,
                "filteringGroups": bc.selected_filter_groups[filteringContext]
            });
            bc.freeze = bc.isFreeze();
            bc.updateURL();
            bc.update(true);
        }
    }
};

bc.updateFilters = function (data) {
    var reload = false;
    var update = false;
    if (data) {
        if (data.filteringContext
            && data.filteringGroups
            && Object.prototype.toString.call(data.filteringGroups) === '[object Array]'
            && bc.filter_contexts.indexOf(data.filteringContext) !== -1) {
            bc.selected_filter_groups[data.filteringContext] = data.filteringGroups.slice();
            bc.freeze = bc.isFreeze();
            // TODO : update selected bars (UI)
            reload = true;
        } else if (!data.filteringGroups
            || Object.prototype.toString.call(data.filteringGroups) !== '[object Array]'
            || data.filteringGroups.length === 0) {
            if (bc.filters_meta.hasOwnProperty(data.filteringContext)) {
                delete bc.filters_meta[data.filteringContext];
                reload = true;
                update = true;
            }
        } else if (data.filteringContext
            && data.filteringGroups
            && Object.prototype.toString.call(data.filteringGroups) === '[object Array]'
            && data.filteringGroups.length > 0) {
            bc.filters_meta[data.filteringContext] = data;
            reload = true;
            update = true;
        }
    }
    if (update) {
        bc.filters.length = 0;
        for (var i in bc.filters_meta) {
            if (bc.filters_meta.hasOwnProperty(i)) {
                bc.filters.push(bc.filters_meta[i]);
            }
        }
    }
    if (reload) bc.update(true);
};

bc.subscribe(function (topic, data) {
    bc.updateFilters(data);
    bc.filterUrl = getFilteringUrl();
});

$(document).ready(function () {
    bc.initialize();
});
