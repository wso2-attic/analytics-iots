/*
* Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

var gadgetCore = function(){

var gadgetLocation = '/portal/store/carbon.super/fs/gadget/motor-rally';
var conf;
var schema;
var pref = new gadgets.Prefs();

var refreshInterval;
var providerData;

var CHART_CONF = 'chart-conf';
var PROVIDER_CONF = 'provider-conf';

var REFRESH_INTERVAL = 'refreshInterval';

this.init = function () {
    $.ajax({
        url: gadgetLocation + '/conf.json',
        method: "GET",
        contentType: "application/json",
        async: false,
        success: function (data) {
            conf = JSON.parse(data);
        }
    });
    console.log(conf);
};

this.getProviderData = function (){

    console.log(gadgetLocation + '/gadget-controller.jag?action=getData');
    console.log(JSON.stringify(conf));
    var config = {};
    config["provider-conf"]=conf["provider-confs"][0];
    console.log(config);

    $.ajax({
        url: gadgetLocation + '/gadget-controller.jag?action=getData',
        method: "POST",
        data: JSON.stringify(config),
        contentType: "application/json",
        async: false,
        success: function (data) {
            providerData = data;
        }
    });
    return providerData;
};

    this.getSummarizedData = function (query){
        var config = {};
        config["provider-conf"]=conf["provider-confs"][1];
        config["provider-conf"].query = query;
       $.ajax({
            url: gadgetLocation + '/gadget-controller.jag?action=getData',
            method: "POST",
            data: JSON.stringify(config),
            contentType: "application/json",
            async: false,
            success: function (data) {
                providerData = data;
            }
        });
        return providerData;
    };
}

