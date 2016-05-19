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
bc.polling_task = null;
bc.filter_prefix = "g_";
bc.filters_meta = {};
bc.filters = [];
bc.breadcrumbs = {};
bc.force_fetch = false;
bc.data = {
    'filteredCount': 0,
    'totalCount': 0
};
bc.filterUrl = "";
bc.gadgetUrl = gadgetConfig.defaultSource;
bc.API_CHANGING_PARAMETER = "non-compliant-feature-code";
bc.devices_template = '' +
    '<span class="deviceCount">{{filtered}}</span> ' +
    'out of <span class="totalDevices">{{total}}</span>';

bc.breadcrumb_template = '' +
'<span id="{{id}}" class="label label-primary">' +
'<span>{{label}}</span>' +
'</span>';

bc.initialize = function () {
    $("div#breadcrumbs").on('click', 'i.remove', function () {
        var filter = $(this).closest('.breadcrumb').attr('id').split('_');
        if (filter.length === 2) {
            bc.removeBreadcrumb(filter[0], filter[1]);
        }
    });
    bc.loadFiltersFromURL();
    bc.startPolling();
};

bc.loadFiltersFromURL = function () {
    var params = getURLParams();
    for (var filter in params) {
        if (params.hasOwnProperty(filter) && filter.lastIndexOf(bc.filter_prefix, 0) === 0) {
            var filter_context = filter.substring(bc.filter_prefix.length);
            if(filter_context == bc.API_CHANGING_PARAMETER){
                bc.gadgetUrl = gadgetConfig.featureSource;
            }
            bc.updateBreadcrumbs({
                filteringContext: filter_context,
                filteringGroups: params[filter]
            });
        }
    }
};

bc.startPolling = function () {
    bc.updateDeviceCount();
    this.polling_task = setInterval(function () {
        bc.updateDeviceCount();
    }, gadgetConfig.polling_interval);
};

bc.updateDeviceCount = function (force) {
    bc.force_fetch = !bc.force_fetch ? force || false : true;
    if(bc.filterUrl != null){
        bc.fetch(function (data) {
            var html = Mustache.to_html(bc.devices_template, data);
            $('#devices').html(html);
        });
    }
};

bc.fetch = function (cb) {
    bc.force_fetch = false;
    var getUrl = bc.gadgetUrl;
    bc.filterUrl = getFilteringUrl();
    if(bc.filterUrl != ""){
        getUrl = getUrl + "?" + getFilteringUrl();
    }
    wso2.gadgets.XMLHttpRequest.get(getUrl,
        function(response){
            if (Object.prototype.toString.call(response) === '[object Array]' && response.length === 1) {
                var results = response[0].data;
                for (var data = {}, i = 0; i < results.length; i++) {
                    if(results[i]["group"] != "total"){
                        data["filtered"] = results[i]["deviceCount"];
                    } else {
                        data["total"] = results[i]["deviceCount"];
                    }
                }
                if (data) {
                    bc.data.filtered = data["filtered"] ? data["filtered"] : bc.data.filtered;
                    bc.data.total = data["total"] ? data["total"] : bc.data.total;
                    if (bc.force_fetch) {
                        bc.updateDeviceCount();
                    } else {
                        cb(bc.data);
                    }
                }
            } else {
                console.error("Invalid response structure found: " + JSON.stringify(response));
            }
        }, function(){
            console.warn("Error accessing source for : " + gadgetConfig.id);
        });
};

bc.updateURL = function (filterKey, selectedFilters) {
    updateURLParam(bc.filter_prefix + filterKey, selectedFilters);
};

bc.subscribe = function (callback) {
    gadgets.HubSettings.onConnect = function () {
        gadgets.Hub.subscribe("subscriber", function (topic, data, subscriber) {
            callback(topic, data)
        });
    };
};

bc.publish = function (data) {
    console.log(data);
    gadgets.Hub.publish("publisher", data);
};

bc.addBreadcrumb = function (filterKey, selectedFilters) {
    for (var i = 0; i < selectedFilters.length; i++) {
        var breadcrumbKey = filterKey + '_' + selectedFilters[i];
        var selectedFilters2 = selectedFilters[i].toString().toLowerCase();
        var breadcrumbLable = filterKey.split(/(?=[A-Z])/).join(' ') + ':' + selectedFilters2.split(/(?=[A-Z])/).join(' ');
        breadcrumbLable = breadcrumbLable.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
        if (Object.prototype.toString.call(bc.breadcrumbs[filterKey]) !== '[object Array]') bc.breadcrumbs[filterKey] = [];
        var index = bc.breadcrumbs[filterKey].indexOf(selectedFilters[i]);
        if (index === -1) {
            bc.breadcrumbs[filterKey].push(selectedFilters[i]);
            var html = Mustache.to_html(bc.breadcrumb_template, {'id': breadcrumbKey, 'label': breadcrumbLable});
            $('#breadcrumbs').append(html);
        }
    }
};

bc.removeBreadcrumb = function (filteringContext, filteringGroups) {
    var breadcrumbId = filteringContext + '_' + filteringGroups;
    var currentFilters = bc.filters_meta[filteringContext]['filteringGroups'];
    if (currentFilters) {
        var fIndex = currentFilters.indexOf(filteringGroups);
        if (fIndex !== -1) {
            currentFilters.splice(fIndex, 1);
            if (Object.prototype.toString.call(bc.breadcrumbs[filteringContext]) === '[object Array]') {
                var bIndex = bc.breadcrumbs[filteringContext].indexOf(filteringGroups);
                if (bIndex !== -1) {
                    bc.breadcrumbs[filteringContext].splice(bIndex, 1);
                    bc.publish({
                        "filteringContext": filteringContext,
                        "filteringGroups": currentFilters
                    });
                    $("span#" + breadcrumbId).remove();
                    bc.updateURL(filteringContext, currentFilters);
                    bc.updateBreadcrumbs(null, true);
                }
            }
        }
    }
};

bc.updateBreadcrumbs = function (data, force_update) {
    var updated = false;
    if (data) {
        if (!data.filteringGroups
            || Object.prototype.toString.call(data.filteringGroups) !== '[object Array]'
            || data.filteringGroups.length === 0) {
            if (bc.filters_meta.hasOwnProperty(data.filteringContext)) {
                var cs = bc.filters_meta[data.filteringContext]['filteringGroups'];
                for (var i = 0; i < cs.length; i++) {
                    bc.removeBreadcrumb(data.filteringContext, cs[i]);
                }
                delete bc.filters_meta[data.filteringContext];
                updated = true;
            }
        } else if (data.filteringContext
            && data.filteringGroups
            && Object.prototype.toString.call(data.filteringGroups) === '[object Array]'
            && data.filteringGroups.length > 0) {
            if (!bc.filters_meta[data.filteringContext] ||
                bc.filters_meta[data.filteringContext]['filteringGroups'].length < data['filteringGroups'].length) {
                bc.filters_meta[data.filteringContext] = data;
                bc.addBreadcrumb(data.filteringContext, data.filteringGroups);
            }
            if (Object.prototype.toString.call(bc.breadcrumbs[data.filteringContext]) === '[object Array]') {
                for (var j = 0; j < bc.breadcrumbs[data.filteringContext].length; j++) {
                    var index = data.filteringGroups.indexOf(bc.breadcrumbs[data.filteringContext][j]);
                    if (index === -1) {
                        bc.removeBreadcrumb(data.filteringContext, bc.breadcrumbs[data.filteringContext][j]);
                    }
                }
            }
            updated = true;
        }
    }
    if (updated || force_update) {
        bc.filters.length = 0;
        for (var k in bc.filters_meta) {
            if (bc.filters_meta.hasOwnProperty(k)) {
                bc.filters.push(bc.filters_meta[k]);
            }
        }
        if ($('#breadcrumbs').html()) {
            $('#filterMsg').html("Filtered by : ");
        } else {
            $('#filterMsg').html("Click on charts to filter devices.");
        }
        bc.updateDeviceCount(true);
    }
};

bc.subscribe(function (topic, data) {
    bc.updateBreadcrumbs({
        filteringContext: data.filteringContext,
        filteringGroups: data.filteringGroups.slice()
    });
});

$(document).ready(function () {
    bc.initialize();
});
