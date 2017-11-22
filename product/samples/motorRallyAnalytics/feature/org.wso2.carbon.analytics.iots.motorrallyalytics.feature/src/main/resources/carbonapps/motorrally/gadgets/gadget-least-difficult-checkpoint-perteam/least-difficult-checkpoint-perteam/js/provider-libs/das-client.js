/*
 *
 *
 *  Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 *
 */

var CONSTANTS = {
    webAppName: 'outputui',
    urlSeperator: '/',
    urlGetParameter : '?lastUpdatedTime=',
    tenantUrlAttribute: 't',
    urlUnsecureTransportHttp : 'http://',
    urlUnsecureTransportWebsocket : 'ws://',
    urlSecureTransportWebsocket : 'wss://',
    urlSecureTransportHttp : 'https://',
    colon : ':',
    defaultIntervalTime : 10 * 1000,
    defaultUserDomain : 'carbon.super',
    defaultHostName : 'localhost',
    defaultNonsecurePortNumber : '9763',
    defaultSecurePortNumber : '9443',
    defaultMode : 'AUTO',
    processModeHTTP : 'HTTP',
    processModeWebSocket : 'WEBSOCKET',
    processModeAuto : 'AUTO',
    domain : 'carbon.super',
    numThousand : 1000,
    websocketTimeAppender : 400,
    secureMode : 'SECURED'
};


var client, tableName, query, hostname, port, providerConfig, dataRowLimit, onSuccessFunction, schema,
    timeGap = -1, orderType, orderingField;

function subscribe(_query, _tableName, onSuccessData, onErrorData, _hostname, _port, _providerConfig, _schema){
    // stopPollingProcesses();

    tableName = _tableName;
    query = _query;
    hostname = _hostname;
    port = _port;
    client = getAnalyticsClient(hostname, port);
    providerConfig = _providerConfig;
    schema = _schema;

    dataRowLimit = 100;

    onSuccessFunction = onSuccessData;
    onErrorFunction = onErrorData;
    polingInterval = 1000;

    if("Current Hour" == providerConfig.dataRange) {
        timeGap = 3600;
    } else if ("Current Day" == providerConfig.dataRange) {
        timeGap = 86400;
    } else if ("Current Week" == providerConfig.dataRange) {
        timeGap = 604800;
    } else if ("Current Month" == providerConfig.dataRange) {
        timeGap = 2592000;
    } else if ("Current Year" == providerConfig.dataRange) {
        timeGap = 31104000;
    } else if ("Retrieve all data" == providerConfig.dataRange) {
        timeGap = -1;
    }

    orderType = providerConfig.dataOrder;
    orderingField = providerConfig.orderAttribute;

    startPoll();
}


function startPoll(){
    (function poll(){
        setInterval(function(){
            var newQuery = buildDasQuery(query, tableName, 0, 1);
            client.search(
                newQuery,
                function (data2) {
                    var dataArray = JSON.parse(data2.message);
                    var endingTimestamp = 0;
                    var startingTimestamp;
                    for(var i=0; i < dataArray.length; i++) {
                        endingTimestamp = dataArray[i].values.TimestampUTC;
                    }

                    if(-1 != timeGap) {
                        startingTimestamp = endingTimestamp - timeGap;
                        if("" == query) {
                            query = query + "TimestampUTC=[" +startingTimestamp + " TO " + endingTimestamp + "]";
                        } else {
                            query = query + "&TimestampUTC=[" +startingTimestamp + " TO " + endingTimestamp + "]";
                        }
                    }
                    newQuery = buildDasQuery(query, tableName, 0, 1);
                    client.searchCount(
                        newQuery,
                        function (data) {
                            var newQuery = buildDasQuery(query, tableName, 0, data.message);
                            client.search(
                                newQuery,
                                function (data2) {
                                    var data = [];
                                    var dataArray = JSON.parse(data2.message);
                                    for(var i=0; i < dataArray.length; i++) {
                                        var timestamp = dataArray[i].values.TimestampUTC;
                                        // dataArray[i].values.TimestampUTC = timeConverter(timestamp);
                                        data.push(dataArray[i].values);
                                    }
                                    var result = [];
                                    data.forEach(function(item) {
                                        var row = [];
                                        schema[0].metadata.names.forEach(function(name) {
                                            row.push(item[name]);
                                        });
                                        result.push(row);
                                    });
                                    onSuccessFunction(result);
                                },
                                function (data) {
                                    onErrorFunction(data)
                                }
                            );
                        },
                        function (data) {
                            onErrorFunction(data)
                        }
                    );
                },
                function (data) {
                    onErrorFunction(data)
                }
            );
        }, polingInterval);
    })()
}

function buildDasQuery(queryParams, analyticsTable, start, count) {
    var queryInfo = {};
    queryInfo.tableName = analyticsTable;
    var fqai = queryParams.split('&'), query = "";
    var searchParams = {};
    for(var i=0; "" != queryParams && i < fqai.length; i++) {
        var keyValue = fqai[i].split('=');
        if("" != query) {
            keyValue[1] = keyValue[1].replace(':', '\\:');
            query = query + " AND " +  keyValue[0] + ":" + keyValue[1];
        } else {
            query = keyValue[0] + ":" + keyValue[1];
        }
    }
    searchParams.query = query;
    searchParams.start = start;
    searchParams.count = count;

    if ("None" != orderType) {
        var sortBy = [];
        var sort = {};
        sort.field = orderingField;
        sort.sortType = "DESC";
        if("Ascending Order" != orderType) {
            sort.reversed = "true";
        } else {
            sort.reversed = "false";
        }
        sortBy.push(sort);
        searchParams.sortBy = sortBy;
    }

    queryInfo.searchParams = searchParams;
    return queryInfo;
}


function getAnalyticsClient(hostname, port){
    var username = "admin";
    var password = "admin";
    var httpTransport;
    if(CONSTANTS.defaultNonsecurePortNumber == port) {
        httpTransport = "http";
    } else {
        httpTransport = "https";
    }
    var server_url = httpTransport +"://"+hostname+":"+port+"/portal/apis/analytics";
    return new AnalyticsClient().init(username, password, server_url);
}

function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['1','2','3','4','5','6','7','8','9','10','11','12'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var ss = a.getSeconds();
    return date + '/' + month + '/' + year + ' ' + hour + ':' + min;
}