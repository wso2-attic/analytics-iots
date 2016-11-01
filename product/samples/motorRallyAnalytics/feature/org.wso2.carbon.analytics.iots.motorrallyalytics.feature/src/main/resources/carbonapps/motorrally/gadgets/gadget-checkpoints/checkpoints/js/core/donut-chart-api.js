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
var getConfig, validate, isProviderRequired, draw, update;

(function() {

    var CHART_LOCATION = '/extensions/chart-templates/';

    /**
     * return the config to be populated in the chart configuration UI
     * @param schema
     */
    getConfig = function(schema) {
        var chartConf = require(CHART_LOCATION + '/donut-chart/config.json').config;
        /*
         dynamic logic goes here
         */
        return chartConf;

    };

    /**
     * validate the user inout for the chart configuration
     * @param chartConfig
     */
    validate = function(chartConfig) {
        return true;
    };

    /**
     * TO be used when provider configuration steps need to be skipped
     */
    isProviderRequired = function() {

    }


    /**
     * return the gadget content
     * @param chartConfig
     * @param data
     */
    draw = function(placeholder, chartConfig, data) {

        compltedCount = data[0][chartConfig.completedCount];
        remainingCount = data[0][chartConfig.remainingCount];
        totalCount = compltedCount + remainingCount;
        // completedPct = compltedCount * 100.0 / (compltedCount + remainingCount);
        // remainingPct = 100 - completedPct;
        $("#completedCount").html(Number(compltedCount).toLocaleString('en'));
        $("#totalCount").html(Number(totalCount).toLocaleString('en'));

        // var schema = {
        //     "metadata": {
        //         "names": ["rpm", "torque", "horsepower", "EngineType"],
        //         "types": ["linear", "linear", "ordinal", "ordinal"]
        //     }};

        var config = {
            charts: [{ type: "arc", x: "torque", color: "EngineType" }],
            innerRadius: 0.15,
            tooltip: { "enabled": false },
            padding: { top:0, right:0, bottom:0, left:0 },
            legend: false,
            percentage: true,
            colorScale: [successColor(), "#353B48"],
            width: 220,
            height: 220
        }

        // var view = {
        //     id: "chart-0",
        //     schema: schema,
        //     chartConfig: configT,
        //     data:{
        //         [0, parseFloat(completedPct), 12, "YES"],
        //         [0, parseFloat(remainingPct), 12, "NO"]
        //     }

        // };

        var data = [{
            "metadata": {
                "names": ["rpm", "torque", "horsepower", "EngineType"],
                "types": ["linear", "linear", "ordinal", "ordinal"]
            },
            "data": [
                [0, parseFloat(compltedCount), 12, "YES"],
                [0, parseFloat(remainingCount), 12, "NO"]
            ]
        }];

        

        var view = new vizg(data, config);
        // view.id = "chart-0";

        try {
            // wso2gadgets.init(placeholder, view);
            view.draw(placeholder);
            // var view = wso2gadgets.load("chart-0");
        } catch (e) {
            console.error(e);
        }

    };

    /**
     *
     * @param data
     */
    // update = function(data) {
    //     wso2gadgets.onDataReady(data,"append");
    // }

    update = function(placeholder, chartConfig, data) {
        compltedCount = data[0][chartConfig.completedCount];
        remainingCount = data[0][chartConfig.remainingCount];
        totalCount = compltedCount + remainingCount;
        // completedPct = compltedCount * 100.0 / (compltedCount + remainingCount);
        // remainingPct = 100 - completedPct;
        $("#completedCount").html(Number(compltedCount).toLocaleString('en'));
        $("#totalCount").html(Number(totalCount).toLocaleString('en'));

        // var schema = {
        //     "metadata": {
        //         "names": ["rpm", "torque", "horsepower", "EngineType"],
        //         "types": ["linear", "linear", "ordinal", "ordinal"]
        //     }};

        var config = {
            charts: [{ type: "arc", x: "torque", color: "EngineType" }],
            innerRadius: 0.15,
            tooltip: { "enabled": false },
            padding: { top:0, right:0, bottom:0, left:0 },
            legend: false,
            percentage: true,
            colorScale: [successColor(), "#353B48"],
            width: 220,
            height: 220
        }

        // var view = {
        //     id: "chart-0",
        //     schema: schema,
        //     chartConfig: configT,
        //     data:{
        //         [0, parseFloat(completedPct), 12, "YES"],
        //         [0, parseFloat(remainingPct), 12, "NO"]
        //     }

        // };

        var data = [{
            "metadata": {
                "names": ["rpm", "torque", "horsepower", "EngineType"],
                "types": ["linear", "linear", "ordinal", "ordinal"]
            },
            "data": [
                [0, parseFloat(compltedCount), 12, "YES"],
                [0, parseFloat(remainingCount), 12, "NO"]
            ]
        }];



        var view = new vizg(data, config);
        // view.id = "chart-0";

        try {
            // wso2gadgets.init(placeholder, view);
            view.draw(placeholder);
            // var view = wso2gadgets.load("chart-0");
        } catch (e) {
            console.error(e);
        }
    }

    successColor = function(){
        return parseFloat(compltedCount) > 0 ? '#5CB85C' : '#353B48';
    };

    failColor = function(){
        return parseFloat(remainingCount) > 0 ? '#D9534F' : '#353B48';
    };
    
}());
