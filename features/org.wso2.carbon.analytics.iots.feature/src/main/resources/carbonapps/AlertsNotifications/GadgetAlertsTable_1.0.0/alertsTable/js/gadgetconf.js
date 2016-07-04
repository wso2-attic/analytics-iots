
var gadgetConfig = {
	"id" : "alertsTable",
	"title" : "Alerts Table",
	"datasource" : "ORG_WSO2_IOT_ANALYTICS_STREAM_ALERTSTREAM",
	"type" : "batch",
	"columns" : [{
		"name" : "type",
		"type" : "string"
	}, {
		"name" : "message",
		"type" : "string"
	}, {
		"name" : "time",
		"type" : "long"
	}, {
		"name" : "severity",
		"type" : "string"
	}],
	"chartConfig" : {
		"x" : "count",
		"maxLength" : "",
		"padding" : {
			"top" : 30,
			"left" : 45,
			"bottom" : 38,
			"right" : 55
		},
		"charts" : [{
			"type" : "number",
			"title" : "Displays Alerts"
		}]
	},
	"domain" : "carbon.super"
};
