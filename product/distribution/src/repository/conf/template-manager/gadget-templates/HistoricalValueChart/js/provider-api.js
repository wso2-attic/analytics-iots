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
var getConfig, validate, getMode, getSchema, getData, registerCallBackforPush;

(function () {

    var PROVIDERS_LOCATION = '/extensions/providers/';

    var PROVIDER_NAME = 'batch';
    var TYPE = "type";
    var TABLE_NAME = "tableName";
    var HTTPS_TRANSPORT = "https";
    var CONTENT_TYPE_JSON = "application/json";
    var AUTHORIZATION_HEADER = "Authorization";
    var USER_TOKEN = "user";
    var TENANT_DOMAIN = "domain";
    var CONST_AT = "@";
    var USERNAME = "username";
    var HTTP_USER_NOT_AUTHENTICATED = 403;
    var JS_MAX_VALUE = "9007199254740992";
    var JS_MIN_VALUE = "-9007199254740992";
    var MONTH = "Month";
    var DAY = "Day";
    var HOUR = "Hour";
    var MINUTE = "Miute";
    var SECOND = "Second";
    var TIME_FROM = "time-from";
    var TIME_TO = "time-to";
    var TIME_INTERVAL = 10;
    var log = new Log();
    var carbon = require('carbon');
    var configs = require('/configs/designer.json');
    var utils = require('/modules/utils.js');
    var JSUtils = Packages.org.wso2.carbon.analytics.jsservice.Utils;
    var AnalyticsCachedJSServiceConnector = Packages.org.wso2.carbon.analytics.jsservice.AnalyticsCachedJSServiceConnector;
    var AnalyticsCache = Packages.org.wso2.carbon.analytics.jsservice.AnalyticsCachedJSServiceConnector.AnalyticsCache;
    var cacheTimeoutSeconds = 5;
    var loggedInUser = null;

    if (configs.cacheTimeoutSeconds) {
        cacheTimeoutSeconds = parseInt(configs.cacheTimeoutSeconds);
    }
    var cacheSizeBytes = 1024 * 1024 * 1024; // 1GB
    if (configs.cacheSizeBytes) {
        cacheSizeBytes = parseInt(configs.cacheSizeBytes);
    }
    response.contentType = CONTENT_TYPE_JSON;

    var authParam = request.getHeader(AUTHORIZATION_HEADER);
    if (authParam != null) {
        credentials = JSUtils.authenticate(authParam);
        loggedInUser = credentials[0];
    } else {
        var token = session.get(USER_TOKEN);
        if (token != null) {
            loggedInUser = token[USERNAME] + CONST_AT + token[TENANT_DOMAIN];
        } else {
            log.error("user is not authenticated!");
            response.status = HTTP_USER_NOT_AUTHENTICATED;
            print('{ "status": "Failed", "message": "User is not authenticated." }');
            return;
        }
    }

    var cache = application.get("AnalyticsWebServiceCache");
    if (cache == null) {
        cache = new AnalyticsCache(cacheTimeoutSeconds, cacheSizeBytes);
        application.put("AnalyticsWebServiceCache", cache);
    }
    var connector = new AnalyticsCachedJSServiceConnector(cache);

    /**
     * require the existing config.json and push any dynamic fields that needs to be populated in the UI
     */
    getConfig = function () {
        var formConfig = require(PROVIDERS_LOCATION + '/' + PROVIDER_NAME + '/config.json');
        var datasourceCfg = {
            "fieldLabel": "Event Table",
            "fieldName": "tableName",
            "fieldType": "dropDown"
        };
        var tables;
        try {
            tables = connector.getTableList(loggedInUser).getMessage();
            datasourceCfg['valueSet'] = JSON.parse(tables);
        } catch (e) {
            log.error(e);
        }
        formConfig.config.push(datasourceCfg);
        return formConfig;
    }

    /**
     * validate the user input of provider configuration
     * @param providerConfig
     */
    validate = function (providerConfig) {
        return true;
    }

    /**
     * returns the data mode either push or pull
     */
    getMode = function () {
        return "PULL";
    }

    /**
     * returns an array of column names & types
     * @param providerConfig
     */
    getSchema = function (providerConfig) {
        var schema = [];
        var tableName = providerConfig["tableName"];
        var result = connector.getTableSchema(loggedInUser, tableName).getMessage();
        result = JSON.parse(result);

        var columns = result.columns;
        Object.getOwnPropertyNames(columns).forEach(function (name, idx, array) {
            schema.push({
                fieldName: name,
                fieldType: columns[name]['type']
            });
        });
        return schema;
    };

    /**
     * returns the actual data
     * @param providerConfig
     * @param limit
     */
    getData = function (providerConfig, limit) {
        var tableName = providerConfig.tableName;
        var from = JS_MIN_VALUE;
        var to = JS_MAX_VALUE;
        if (providerConfig[TIME_FROM] && providerConfig[TIME_TO]) {
            from = providerConfig[TIME_FROM];
            to = providerConfig[TIME_TO];
            var timeRange = getSutableTimeRange(parseFloat(from), parseFloat(to), TIME_INTERVAL);
            tableName = tableName.replace(SECOND, timeRange);
        }
        var result = connector.getRecordsByRange(loggedInUser, tableName, from, to, 0, 10, null).getMessage();
        result = JSON.parse(result);
        var data = [];
        for (var i = 0; i < result.length; i++) {
            var values = result[i].values;
            data.push(values);
        }
        return data;
    };

    function getSutableTimeRange(from, to, interval) {
        var fromTime = new Date(from);
        var toTime = new Date(to);
        if (monthsDiff(fromTime, toTime) >= interval) {
            return MONTH;
        } else if (daysDiff(fromTime, toTime) >= interval) {
            return DAY;
        } else if (hoursDiff(fromTime, toTime) >= interval) {
            return HOUR;
        } else if (minutesDiff(fromTime, toTime) >= interval) {
            return MINUTE;
        } else {
            return SECOND;
        }
    }

    function monthsDiff(from, to) {
        var months;
        months = Math.abs((to.getFullYear() - from.getFullYear())) * 12;
        months -= from.getMonth() + 1;
        months += to.getMonth();
        return months <= 0 ? 0 : months;
    }

    function daysDiff(from, to) {
        var oneDay = 24 * 60 * 60 * 1000;
        return Math.round(Math.abs((from.getTime() - to.getTime()) / (oneDay)));
    }

    function hoursDiff(from, to) {
        return Math.abs(to.getTime() - from.getTime());
    }

    function minutesDiff(from, to) {
        return Math.abs(parseInt(from.getHours()) - parseInt(to.getHours())) / (60 * 1000);
    }
}());
