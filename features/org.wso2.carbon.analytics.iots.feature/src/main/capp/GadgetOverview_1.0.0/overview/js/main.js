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

var ov = ov || {};
ov.chart = null;
ov.polling_task = null;
ov.data = [];
ov.filter_context = null;
ov.filters_meta = {};
ov.filters = [];
ov.filter_prefix = "g_";
ov.selected_filter_groups = [];
ov.force_fetch = false;
ov.freeze = false;

ov.initialize = function () {
    //ov.loadFiltersFromURL();
    ov.startPolling();
};


ov.startPolling = function () {
    setTimeout(function () {
        ov.fetch();
    }, 500);
    this.polling_task = setInterval(function () {
        ov.fetch();
    }, gadgetConfig.polling_interval);
};

ov.fetch = function () {
    ov.data.length = 0;
    //ov.force_fetch = false;
    wso2.gadgets.XMLHttpRequest.get(gadgetConfig.source,
        function(response){
            if (Object.prototype.toString.call(response) === '[object Array]' && response.length === 2) {
                var data = response[0]["data"],
                    totalCount = 0,
                    activeCount = 0,
                    inactiveCount = 0,
                    removedCount = 0;

                if(data){
                    totalCount = data[0].deviceCount;
                }
                document.getElementById('deviceCount').innerHTML = totalCount;
                document.getElementById('total').setAttribute("onclick", "ov.onclick('')");

                data = response[1]["data"];
                if (data && data.length > 0) {
                    ov.filter_context = response[1]["groupingAttribute"];
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].group == "ACTIVE"){
                            activeCount = data[i].deviceCount;
                            document.getElementById('activeDevices').innerHTML = activeCount;
                            document.getElementById(data[i].group).setAttribute("onclick", "ov.onclick('"+data[i].group+"')");
                        } else if (data[i].group == "INACTIVE"){
                            inactiveCount = data[i].deviceCount;
                            document.getElementById('inactiveDevices').innerHTML = inactiveCount;
                            document.getElementById(data[i].group).setAttribute("onclick", "ov.onclick('"+data[i].group+"')");
                        } else if (data[i].group == "REMOVED"){
                            removedCount = data[i].deviceCount;
                            document.getElementById('removedDevices').innerHTML = removedCount;
                            document.getElementById(data[i].group).setAttribute("onclick", "ov.onclick('"+data[i].group+"')");
                        }
                    }

                    if(totalCount == 0){
                        document.getElementById('deviceCount').innerHTML = totalCount;
                        document.getElementById('total').removeAttribute("onclick");
                    }
                    if(activeCount == 0){
                        document.getElementById('activeDevices').innerHTML = activeCount;
                        document.getElementById('ACTIVE').removeAttribute("onclick");
                    }
                    if(inactiveCount == 0){
                        document.getElementById('inactiveDevices').innerHTML = inactiveCount;
                        document.getElementById('INACTIVE').removeAttribute("onclick");
                    }
                    if(removedCount == 0){
                        document.getElementById('removedDevices').innerHTML = removedCount;
                        document.getElementById('REMOVED').removeAttribute("onclick");
                    }

                    var activeDevices = document.getElementById('activeDevices'),
                        activeDevicesProgress = document.getElementById('activeDevicesProgress'),
                        activeDevicesPercentage = (activeCount * 100 / totalCount)+'%';
                    activeDevicesProgress.style.width = activeDevicesPercentage;

                    var inactiveDevices = document.getElementById('inactiveDevices'),
                        inactiveDevicesProgress = document.getElementById('inactiveDevicesProgress'),
                        inactiveDevicesPercentage = (inactiveCount * 100 / totalCount);
                    inactiveDevicesProgress.style.width = inactiveDevicesPercentage;

                    var removedDevices = document.getElementById('removedDevices'),
                        removedDevicesProgress = document.getElementById('removedDevicesProgress'),
                        removedDevicesPercentage = (removedCount * 100 / totalCount);
                    removedDevicesProgress.style.width = removedDevicesPercentage;

                }
            } else {
                console.error("Invalid response structure found: " + JSON.stringify(response));
            }
        }, function(){
            console.warn("Error accessing source for : " + gadgetConfig.id);
        });
};

ov.onclick = function (filterGroup) {
    var url;
    if(filterGroup != ""){
        url = getBaseURL() + "devices?g_" + ov.filter_context + "=" + filterGroup;
    } else {
        url = getBaseURL() + "devices";
    }
    window.open(url);
};

$(document).ready(function () {
    ov.initialize();
});