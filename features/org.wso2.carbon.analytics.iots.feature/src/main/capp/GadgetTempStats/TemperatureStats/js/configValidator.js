
var configValidator = function(){
    var FILED_TYPE_STRING = "string";
    var FILED_TYPE_INTEGER = "integer";
    var api = this;
    var gadgetValidator = {
        "id":FILED_TYPE_STRING,
        "title": FILED_TYPE_STRING,
        "datasource":FILED_TYPE_STRING,
        "type":FILED_TYPE_STRING,
        "context":FILED_TYPE_STRING,
        "columns": [
            {"name": FILED_TYPE_STRING, "label": FILED_TYPE_STRING, "type": FILED_TYPE_STRING, "axis": FILED_TYPE_STRING}
        ],
        "chartConfig": {
            "x": FILED_TYPE_STRING,
            "maxLength": FILED_TYPE_INTEGER,
            "padding": {"top": FILED_TYPE_INTEGER, "left": FILED_TYPE_INTEGER, "bottom": FILED_TYPE_INTEGER, "right": FILED_TYPE_INTEGER},
            "charts": [{"type": FILED_TYPE_STRING, "y": FILED_TYPE_STRING}]
        },
        "domain":FILED_TYPE_STRING,
        "params": [FILED_TYPE_STRING, FILED_TYPE_STRING]
    };

    api.validateConfigFile = function(gadgetValidator, configFile) {

    }
}