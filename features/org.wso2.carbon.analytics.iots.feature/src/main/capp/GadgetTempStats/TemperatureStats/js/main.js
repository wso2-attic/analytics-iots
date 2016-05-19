var MainHandler = function () {

    var api = this;
    var utils = new Utils();
    var placeholder = "#canvas";
    var errorMessageHolder = "#noChart";
    var initialConfig;
    var lineChart;
    var REFRESH_INTERVAL = 100000;
    var intervalListener;
    var COLUMNS_FIELD = "name";
    var yAxisIndexs = [];
    api.executeDataFetchForGadget = function (from, to, filerParam, graphType, columns, context, callBack) {
        var timeFrom = from;
        var timeTo = to;
        var urlQueryParams = utils.getAllQueryParamsFromURL();
        var paramsToFilterBy = filerParam;
        if (typeof paramsToFilterBy != "undefined" && paramsToFilterBy.length != 0) {
            if (urlQueryParams != null) {
                var queryParamValPair = utils.getValuesOfQueryFilter(paramsToFilterBy, urlQueryParams);
                switch (graphType) {
                    case "realtime":

                        break;
                    case "batch":
                        api.execute(timeFrom, timeTo, urlQueryParams, columns, context, callBack);
                        break;
                }
            } else {
                con
                sole.log("No Query Params were found in the URL to match the given filter-parameters.");
            }
        } else {
            //TODO needs to send an error message
        }
    }

    api.execute = function (timeFom, timeTo, urlQueryParams,  columns, context, callBack) {
        api.makeRequest(timeFom, timeTo, urlQueryParams,  columns, context, function(data){
            if(data != null){
                // api.drawBatchChart(data["message"], placeholder, errorMessageHolder);
                callBack(data);
            }else{
                callBack({message: "Error while requesting data from back-end server..."});
            }
        });
    }

    api.createRequestObject = function(timeFrom, timeTo, columns){
        var request = {};
        request.timeFrom = timeFrom;
        request.timeTo = timeTo;
        request.columns = utils.getAxisNames(columns);
        return request;
    }
    api.createEndPointURL = function(request, urlQueryParams, context){
        var url = context + urlQueryParams.deviceType + "/" +
            urlQueryParams.deviceId + "?timeFrom=" + request.timeFrom + "&timeTo=" + request.timeTo
            + "&columns=" + request.columns;
        return url;
    }

    api.makeRequest = function(timeFrom, timeTo, urlQueryParams,  columns, context, callBack){
        var request = api.createRequestObject(timeFrom, timeTo, columns);
        var url = api.createEndPointURL(request, urlQueryParams, context);
        console.log("url"+ url);

        /*wso2.gadgets.HttpRequest.get(url,
             function(data){
                callBack(data["message"]);
             },
             function(data){
                console.log(JSON.stringify(data));
                callBack(data);
             }
         );*/
        console.log("-----------------------");
        wso2.gadgets.XMLHttpRequest.get(url,
            function(data){
                callBack(data["message"]);
            },
            function(data){
                console.log(JSON.stringify(data));
                callBack(data);
            }
        );

        console.log("----------||||-------------");

        /* url = "https://localhost:9443/bb/device/register";
         var deviceInfo = {"owner":"admin","deviceId":"qe4d6rxihn3r","sensorValue":"0.0"};
         wso2.gadgets.XMLHttpRequest.post(url,deviceInfo,
         function(data){
         console.log("ok"+JSON.stringify(data));
         //callBack(data["message"]);
         },
         function(data){
         console.log("error"+JSON.stringify(data));
         // callBack(data);
         }
         );*/

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
        yAxisIndexs = utils.getYAxisIndex(utils.X, columns);
        for (var i = 0; i < yAxisIndexs.length; i++) {
            dataFiled[i] = [record[columns[utils.getAxisIndex(utils.X, columns)][COLUMNS_FIELD]],
                record[columns[yAxisIndexs[i]][COLUMNS_FIELD]], utils.getAxisLabel(yAxisIndexs[i],columns)];
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
        /*var xAxis = utils.getAxisTypes(utils.getAxisDetails(utils.X, columns));*/
        /*var yAxis = utils.getAxisTypes(utils.getAxisDetails(utils.Y, columns));*/
        var xAxis = utils.getType(XAxisName, columns, 1);
        var yAxis = utils.getType(XAxisName, columns, 0);
        if (xAxis == undefined || yAxis == undefined)
        //TODO send error message
            console.log("Please define x and y axis");
        axisTypes.push(xAxis);
        axisTypes.push(yAxis);
        axisTypes.push("ordinal");
        return axisTypes;
    }
};







