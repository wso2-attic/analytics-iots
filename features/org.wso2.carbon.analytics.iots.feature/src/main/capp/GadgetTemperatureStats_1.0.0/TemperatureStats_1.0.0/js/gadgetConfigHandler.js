var GadgetConfiguration = function () {
    var configFile;
    var api = this;
    api.setGadgetConfig = function (config) {
        configFile = config;
    }
    api.getGadgetConfig = function () {
        return configFile;
    }

    api.getDataSource = function () {
        return configFile.datasource;
    }

    api.getContext = function () {
        return configFile.context;
    }

    api.getType = function () {
        return configFile.type;
    }

    api.getColumns = function () {
        return configFile.columns;
    }

    api.getChartConfig = function () {
        return configFile.chartConfig;
    }

    api.getChartYAxisName = function () {
        return api.getChartConfig().charts[0].y;
    }

    api.getChartXAxisName = function () {
        return api.getChartConfig().x;
    }

    api.setChartConfig = function (newConfig) {
        configFile.chartConfig = newConfig;
    }

    api.getFilterParam = function () {
        return configFile.params;
    }
}