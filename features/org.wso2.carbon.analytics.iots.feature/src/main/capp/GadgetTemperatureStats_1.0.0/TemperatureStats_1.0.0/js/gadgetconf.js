var mainHandler = new MainHandler();
var utils = new Utils();
var views = [{
    id: "chart-0",
    datasource: "",
    type: "batch",
    context: "https://192.168.120.1:9443/analyticsManger/device/stats/",
    columns: [
        {"name": "minValue", "label": "minValue", "type": "linear"},
        {"name": "maxValue", "label": "maxValue", "type": "linear"},
        {"name": "Time", "label": "Time", "type": "time"}
    ],
    domain: "carbon.super",
    params: ["owner", "deviceId"],
    schema: [{
        "metadata": {
            "names": [""],
            "types": [""]
        }
    }],
    chartConfig: {
        x: "Time",
        charts: [{type: "line", range: "true", y: "TemperatureValue", color: "Temperature"}],
        padding: {"top": 20, "left": 50, "bottom": 20, "right": 80},
        range: false,
        height: 300
    },
    callbacks: [{
        type: "click",
        callback: function () {

        }
    }],
    data: function () {
        var columns = this.columns;
        var yAxisIndexes = utils.getAxisIndexes(this.chartConfig.x, columns, 0);
        var xAxisIndexes = utils.getAxisIndexes(this.chartConfig.x, columns, 1);
        var finalResult = [];
        mainHandler.executeDataFetchForGadget(this.time_from, this.time_to, this.params,
            this.type, columns, this.context, function (dataSet) {
                for (var i = 0; i < dataSet.length; i++) {
                    var result;
                    var record = dataSet[i];
                    for (var j = 0; j < yAxisIndexes.length; j++) {
                        result =
                            [record[columns[xAxisIndexes[0]][utils.COLUMNS_NAMES_FIELD]],
                                record[columns[yAxisIndexes[j]][utils.COLUMNS_NAMES_FIELD]],
                                utils.getAxisLabel(yAxisIndexes[j], columns)];
                        finalResult.push(result);
                    }
                }
                commons.onDataReady(finalResult);
            });
    }
}];

$(function () {
    try {
        var viewIndex = 0;
        var currentView = views[viewIndex];
        currentView.schema[0].metadata.names = mainHandler.getNames(currentView.chartConfig.x,
            currentView.chartConfig.charts[0].y, currentView.chartConfig.charts[0].color);
        currentView.schema[0].metadata.types = mainHandler.getTypes(currentView.chartConfig.x, currentView.columns);
        commons.init(utils.placeholder, views, currentView.id);
    } catch (e) {
        console.log(e);
    }
});

gadgets.HubSettings.onConnect = function () {
    var columns = views[0].columns;
    gadgets.Hub.subscribe('subscriber', function (topic, data, subscriberData) {
        mainHandler.executeDataFetchForGadget(data.timeFrom, data.timeTo, views[0].params, views[0].type,
            columns, views[0].context, function (dataSet) {
                var yAxisIndexes = utils.getAxisIndexes(views[0].chartConfig.x, columns, 0);
                var xAxisIndexes = utils.getAxisIndexes(views[0].chartConfig.x, columns, 1);
                var finalResult = [];
                for (var i = 0; i < dataSet.length; i++) {
                    var result;
                    var record = dataSet[i];
                    for (var j = 0; j < yAxisIndexes.length; j++) {
                        result = [record[columns[xAxisIndexes[0]][utils.COLUMNS_NAMES_FIELD]],
                            record[columns[yAxisIndexes[j]][utils.COLUMNS_NAMES_FIELD]],
                            utils.getAxisLabel(yAxisIndexes[j], columns)];
                        finalResult.push(result);
                    }
                }
                commons.onDataReady(finalResult);
            });
    });
};


