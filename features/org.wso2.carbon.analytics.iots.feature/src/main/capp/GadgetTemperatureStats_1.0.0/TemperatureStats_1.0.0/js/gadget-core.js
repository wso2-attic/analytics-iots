/*
 * Copyright (c)  2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

(function () {
    var commons = window.commons || {};
    window.commons = commons;
    var views = {};
    var currentView;
    var canvas;

    /* 
     * Initialise the commons object by passing the canvas element and view definitions.
     * View definitions can be an array or a single view definition object
     * Optionally default view can be passed (view that should be loaded first)
     * E.g commons.init("#canvas",views,"chart-0");
     */
    commons.init = function (el, configs, defaultView) {
        canvas = el;
        if (configs.constructor === Array) {
            configs.forEach(function (view) {
                views[view.id] = view;
            });
        } else if (typeof configs === 'object') {
            views[configs.id] = configs;
        }
        if (defaultView) {
            commons.load(defaultView);
        }
    };

    commons.load = function (id, context) {
        currentView = views[id];
        if (!currentView) {
            throw new Error("View with specified id [" + id + "] does not exist.");
        }
        //initialize inter-gadget subscriptions
        gadgets.HubSettings.onConnect = function () {
            if (currentView.subscriptions) {
                currentView.subscriptions.forEach(function (subscription) {
                    gadgets.Hub.subscribe(subscription.topic, subscription.callback);
                });
            }
        };
        //load data into current view using view's data configuration
        if (currentView.data && typeof currentView.data === "function") {
            currentView.data();
        }
        return currentView;
    };

    commons.onDataReady = function (data) {
        try {
            if (data.length == 0) {
                $(canvas).html(gadgetUtil.getEmptyRecordsText());
                return;
            }

            currentView.schema[0].data = data;
            commons.draw(currentView);
        } catch (e) {
            commons.onError(e);
        }
    };

    commons.draw = function (view) {
        try {
            if (!view.chartConfig.width) {
                view.chartConfig.width = $('body').width();
            }
            if (!view.chartConfig.height) {
                view.chartConfig.height = $('body').height();
            }
            $(canvas).empty();
            //console.log(JSON.stringify(view.schema));
            var vg = new vizg(view.schema, view.chartConfig);
            if (view.callbacks && view.callbacks.length > 0) {
                vg.draw(canvas, view.callbacks);
            } else {
                vg.draw(canvas);
            }
        } catch (e) {
            commons.onError(e);
        }
    };

    commons.onError = function (e) {
        console.error(e);
        $(canvas).html(gadgetUtil.getErrorText(e));
    };

})();