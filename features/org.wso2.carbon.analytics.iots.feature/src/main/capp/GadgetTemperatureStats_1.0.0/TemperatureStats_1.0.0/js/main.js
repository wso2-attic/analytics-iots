var MainHandler = function () {

    var api = this;
    var utils = new Utils();
    var initialConfig;
    var lineChart;
    var COLUMNS_FIELD = "name";
    var yAxisIndexes = [];
    api.executeDataFetchForGadget = function (from, to, filerParam, graphType, columns, context, callBack) {
        var timeFrom = from;
        var timeTo = to;
        var urlQueryParams = utils.getAllQueryParamsFromURL();
        var paramsToFilterBy = filerParam;
        if (typeof paramsToFilterBy != "undefined" && paramsToFilterBy.length != 0) {
            if (urlQueryParams != null) {
                switch (graphType) {
                    case "realtime":
                        //TODO need to implement this
                        break;
                    case "batch":
                        api.execute(timeFrom, timeTo, urlQueryParams, columns, context, callBack);
                        break;
                }
            } else {
                console.log("No Query Params were found in the URL to match the given filter-parameters.");
            }
        }
    }

    api.execute = function (timeFom, timeTo, urlQueryParams, columns, context, callBack) {
        api.makeRequest(timeFom, timeTo, urlQueryParams, columns, context, function (data) {
            if (data != null) {
                callBack(data);
            } else {
                callBack({message: "Error while requesting data from back-end server..."});
            }
        });
    }

    api.createRequestObject = function (timeFrom, timeTo, columns) {
        var request = {};
        request.timeFrom = timeFrom;
        request.timeTo = timeTo;
        request.columns = utils.getAxisNames(columns);
        return request;
    }

    api.createEndPointURL = function (request, urlQueryParams, context) {
        var url = context + urlQueryParams.deviceType + "/" +
            urlQueryParams.deviceId + "?timeFrom=" + request.timeFrom + "&timeTo=" + request.timeTo
            + "&columns=" + request.columns;
        return url;
    }

    api.makeRequest = function (timeFrom, timeTo, urlQueryParams, columns, context, callBack) {
        var request = api.createRequestObject(timeFrom, timeTo, columns);
        var url = api.createEndPointURL(request, urlQueryParams, context);
        wso2.gadgets.XMLHttpRequest.get(url,
            function (data) {
                if (data["message"]) {
                    callBack(data["message"]);
                }
            },
            function (data) {
                callBack(data);
            }
        );
    }

    api.drawBatchChart = function (dataSet, placeholder, errorMessageHolder, chartConfig) {
        $(placeholder).empty();
        if (lineChart == null) {
            jQuery(errorMessageHolder).html("");
            chartConfig.width = $(placeholder).width() - 110;
            chartConfig.height = $(placeholder).height() - 40;
            initialConfig = JSON.parse(JSON.stringify(chartConfig));
        } else {
            chartConfig = (initialConfig);
            initialConfig = JSON.parse(JSON.stringify(chartConfig));
        }
        if (dataSet == undefined || dataSet.length == 0) {
            $(placeholder).empty();
            $(placeholder).append('<div id="noChart"><table><tr><td style="padding:30px 20px 0px 20px">' +
                '<img src="../../portal/images/noEvents.png" align="left" style="width:24;height:24"/></td><td>' +
                '<br/><b><p><br/> Data is not available for plotting</p></b></td></tr><tr><td></td><td>' +
                '<p>The chart will be loaded once the dashboard receives events</p><td/></tr></table></div>');
            return;
        }
    }

    api.addYAxis = function (record, columns) {
        var dataFiled = [];
        yAxisIndexes = utils.getYAxisIndex(utils.X, columns);
        for (var i = 0; i < yAxisIndexes.length; i++) {
            dataFiled[i] = [record[columns[utils.getAxisIndex(utils.X, columns)][COLUMNS_FIELD]],
                record[columns[yAxisIndexes[i]][COLUMNS_FIELD]], utils.getAxisLabel(yAxisIndexes[i], columns)];
        }
        return dataFiled;
    }

    api.getNames = function (labelX, labelY, labelGroup) {
        var axisLabel = [];
        axisLabel.push(labelX);
        axisLabel.push(labelY);
        axisLabel.push(labelGroup);
        return axisLabel;
    }

    api.getTypes = function (XAxisName, columns) {
        var axisTypes = [];
        var xAxis = utils.getType(XAxisName, columns, 1);
        var yAxis = utils.getType(XAxisName, columns, 0);
        if (xAxis == undefined || yAxis == undefined)
            console.log("Please define x and y axis");
        axisTypes.push(xAxis);
        axisTypes.push(yAxis);
        axisTypes.push("ordinal");
        return axisTypes;
    }
};







