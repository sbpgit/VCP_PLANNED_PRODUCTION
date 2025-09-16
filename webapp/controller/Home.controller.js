sap.ui.define([
    "./PivotControl",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
], (PivotControl, JSONModel, MessageToast) => {
    "use strict";
    var that = this;
    return PivotControl.extend("vcpapp.vcpprodordconsumptionpivot.controller.Home", {
        onInit() {
            that = this;
            that.oGModel = that.getOwnerComponent().getModel("oGModel");
            that.oModel = that.getOwnerComponent().getModel("oModel");
            that.aModel = that.getOwnerComponent().getModel("aModel");
            that.getView().byId("smartFilterBarPOP").setModel(that.aModel);
            that.dataReady = true;
            that.FilterBar = that.byId("smartFilterBarPOP");
            that.setDateRange("disable", 2);
            that.columns = ["Product", "Parent Location", "Parent", "Component"];
            that.pivotPage = that.byId("idPivotPagePOP");
            // that.FilterBar = that.getView().byId("filterbarPOP");
            that.loadFragments();
            // that.is_Go_Ready_To_Press_Again = true;
            that.oGModel.setProperty("/showPivot", false);
        },
        loadFragments() {
            if (!that._pivotSetting) {
                that._pivotSetting = sap.ui.xmlfragment(
                    "vcpapp.vcpprodordconsumptionpivot.fragments.ColumnSettings",
                    that
                );
                that.getView().addDependent(that._pivotSetting);
            }
        },
        onAfterRendering() {
            that.addScrollEvent();
            that.oModel.read("/getWeeks", {
                success: function (oData) {
                    that.calWeekData = oData.results;
                    if (!oData.results) MessageBox.show("Cal Week Date Not Avail");
                    else {
                        that.telWeek = [];
                        that.telMonth = [];
                        that.telQ = [];
                        const remain = [];
                        for (let i = 0; i < oData.results.length; i++) {
                            const item = oData.results[i];
                            if (!item.TELESCOPIC_WEEK && !item.CALENDAR_WEEK) continue;
                            if (
                                !that.telWeek.includes(item.TELESCOPIC_WEEK) &&
                                !that.telMonth.includes(item.TELESCOPIC_WEEK) &&
                                !that.telQ.includes(item.TELESCOPIC_WEEK)
                            ) {
                                const found = oData.results.filter(
                                    (o) => o.TELESCOPIC_WEEK === item.TELESCOPIC_WEEK
                                );
                                const length = found.length;
                                if (length === 1) that.telWeek.push(item.TELESCOPIC_WEEK);
                                else if (length > 2 && length <= 6)
                                    that.telMonth.push(item.TELESCOPIC_WEEK);
                                else if (length > 6) that.telQ.push(item.TELESCOPIC_WEEK);
                                else remain.push(item.TELESCOPIC_WEEK);
                            }
                        }
                    }
                },
                error: function (error) {
                    console.error(error);
                },
            });
        },
        onGo() {
            if (that.dataReady) {
                const bPressed = this.getView().byId("idTogglePOP").getPressed();
                const selectedItem = bPressed ? "Telescopic View" : "Calendar View";
                that.dataReady = false;
                that.skip = 0;
                that.topCount = 10000;
                that.allData = [];
                if (selectedItem == "Calendar View") {
                    this.loadData("CALENDAR_WEEK");
                } else {
                    this.loadData("TELESCOPIC_WEEK");
                }
            }
        },
        readModel() {
            const [entity, filter = [], urlParameters = {
                "$top": 20000
            }] = arguments;

            // Initialize variables for pagination
            let allResults = [];
            let skip = 0;
            const top = that.topCount

            // Function to recursively fetch data
            const fetchData = async () => {
                // Create a copy of urlParameters and update skip
                const currentUrlParameters = { ...urlParameters, "$top": that.topCount, "$skip": that.skip };

                try {
                    const { promise, resolve, reject } = Promise.withResolvers();
                    that.oModel.read(`/${entity}`, {
                        filters: filter,
                        urlParameters: currentUrlParameters,
                        success(oRes) {
                            resolve(oRes.results);
                        },
                        error(oError) {
                            reject(oError);
                        },
                    });
                    const results = await promise;

                    // Add results to collection
                    allResults = allResults.concat(results);

                    // Check if more data is available
                    if (results.length === top) {
                        // Update skip for next batch
                        // skip += top;
                        // Recursively fetch more data
                        that.hasMoreData = true;
                        return allResults;
                    } else {
                        // All data retrieved
                        that.hasMoreData = false;
                        return allResults;

                    }
                } catch (error) {
                    throw error;
                }
            };

            // Start fetching data
            return fetchData();
        },
        changeLabel: function (json) {
            const headers = [];
            const keys = Object.keys(json[0]);
            keys.forEach(key => {
                let label;
                switch (key) {
                    case "LOCATION_ID":
                        label = "Parent Location";
                        break;
                    case "LOCATION_DESC":
                        label = "Location Description";
                        break;
                    case "REF_PRODID":
                        label = "Product";
                        break;
                    case "PROD_DESC":
                        label = "Product Description";
                        break;
                    case "SALES_DOC":
                        label = "Sales Document";
                        break;
                    case "UNIQUE_ID":
                        label = "Unique Id";
                        break;
                    case "SALESDOC_ITEM":
                        label = "Sales Doc. Item";
                        break;
                    case "MANU_LOC":
                        label = "Component Location";
                        break;
                    case "COMPONENT":
                        label = "Component";
                        break;
                    case "ORD_TYPE":
                        label = "Order Type";
                        break;
                    case "MAT_PARENT":
                        label = "Parent";
                        break;
                    case "COMP_QTY":
                        label = "Component Qty";
                        break;
                    case "COMP_PROCURE_TYPE":
                        label = "Procurement Type";
                        break;
                    case "PROD_ORDER":
                        label = "Order #";
                        break;
                    case "WEEK_DATE":
                        label = "Weeks";
                        break;
                    case "TELESCOPIC_WEEK":
                        label = "Telescopic Week";
                        break;
                    case "CALENDAR_WEEK":
                        label = "Calendar Week";
                        break;
                    // case "MANU_LOC":
                    // label = "Man Location";
                    // break;
                    default:
                        label = key;
                        break;
                }
                headers.push(label);
            });

            const data = json.map(item => Object.values(item));
            return [headers, ...data];
        },
        loadPivotTab(data) {
            that.oGModel.setProperty("/showPivot", true);
            var newDiv = document.createElement("div");
            newDiv.id = `pivotGrid`;
            newDiv.textContent = "";
            var existingDiv = document.querySelector(`[id*='mainDivPOP']`);

            existingDiv.appendChild(newDiv);
            var pivotDiv = document.querySelector(`[id*='pivotGrid']`);
            if (data.length === 0) {
                that.oGModel.setProperty("/showPivot", false);
                pivotDiv.innerHTML = "";
                MessageToast.show("No Data");
                that.pivotPage.setBusy(false);

                return;
            }
            that.pivotPage.setBusy(true);
            if (window.jQuery && window.jQuery.fn.pivot) {
                var weekMod = "Telescopic Week";
                const bPressed = this.getView().byId("idTogglePOP").getPressed();
                const selectedItem = bPressed ? "Telescopic View" : "Calendar View";
                if (selectedItem === "Calendar View")
                    weekMod = "Calendar Week"
                const rows = that.columns,
                    cols = [weekMod],
                    val = ["Component Qty"];
                var pivotData = that.changeLabel(data);
                pivotDiv = $(pivotDiv);
                $(pivotDiv).pivot(pivotData, {
                    rows: rows,
                    cols: cols,
                    // vals: val,
                    aggregator: $.pivotUtilities.aggregators["Integer Sum"](val),
                    renderer: $.pivotUtilities.renderers["Table"],
                    sorters: {
                        [selectedItem]: () => 0
                    },
                    rendererOptions: {
                        table: {
                            colTotals: false,
                            rowTotals: false
                        },
                    },
                });
                that.loadPivotCss();
                that.pivotPage.setBusy(false);
            } else {
                console.error("Pivot.js or jQuery is not loaded yet.");
                that.pivotPage.setBusy(false);
            }
        },
        onCloseDialog() {
            that.byId("idForecastDetailsPOP").setModel(new JSONModel({
                items: []
            }))
            that._forecastDetail.close();
        },
        onCloseRest() {
            that._restriction.close();
        },
        onExportPivot: function () {
            try {
                const mainDiv = that.byId("mainDivPOP").getDomRef();
                if (!mainDiv) {
                    throw new Error("Main div element not found");
                }

                // Find the table with class 'pvtTable'
                const tableElement = mainDiv.querySelector('table.pvtTable');
                if (!tableElement) {
                    throw new Error("Table with class 'pvtTable' not found");
                }
                const clonedTable = tableElement.cloneNode(true);

                // Remove all elements with class 'popover' from the cloned table
                const popovers = clonedTable.querySelectorAll('.popover');
                popovers.forEach(popover => {
                    popover.remove();
                });

                const dataType = 'application/vnd.ms-excel';
                const tableHTML = tableElement.outerHTML;
                const encodedHTML = encodeURIComponent(tableHTML);
                // const filename = `Pivot_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xls`;
                const filename = "Production Orders.xls";

                const downloadLink = document.createElement("a");
                downloadLink.href = 'data:' + dataType + ', ' + encodedHTML;
                downloadLink.download = filename;
                downloadLink.style.display = 'none';

                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);

            } catch (error) {
                console.error("Export failed:", error);
                // You might want to show a user-friendly error message here
                // MessageToast.show("Export failed. Please try again.");
            }
        },
        onSelectColumns() {
            that._pivotSetting.open();
            const table = sap.ui.getCore().byId("idDataTablePOP"),
                columns = [
                    "Product", "Parent Location", "Parent", "Component",
                    "Component Location",
                    "Unique Id",
                    "Sales Document",
                    "Sales Doc. Item",
                    "Order Type",
                    "Procurement Type",
                    "Order #"
                ];

            if (!that.settingData) {
                that.settingData = columns.map(field => {
                    return {
                        field: field,
                        option: [],
                        select: that.columns.includes(field) ? true : false
                    }
                })
            }
            var oModel = new JSONModel({
                data: that.settingData
            });
            table.setModel(oModel);
            that.checkSelect();
        },
        onIconPress(oEvent) {
            let item = oEvent.getSource().getParent().getParent(),
                path = Number(item.getBindingContext().getPath().split("/")[2]),
                icon = oEvent.getSource().getTooltip(),
                model, oModel, newData, newIndex;
            // item.getDomRef().scrollIntoView();
            switch (icon) {
                case ("up"):
                    newIndex = path - 1;
                    break;
                case ("top"):
                    newIndex = 0;
                    break;
                case ("down"):
                    newIndex = path + 1;
                    break;
                case ("bottom"):
                    newIndex = that.settingData.length - 1;
                    break;
                default:
                    console.log("Error")

            }
            model = oEvent.getSource().getModel().getData()
            newData = that.changeIndexPosition(model.data, path, newIndex);
            that.settingData = newData;
            oModel = new JSONModel({
                data: that.settingData
            });
            sap.ui.getCore().byId("idDataTablePOP").setModel(oModel);
            that.checkSelect();
        },
        changeIndexPosition(arr, oldIndex, newIndex) {
            // Check for valid indices
            if (newIndex >= arr.length) {
                let k = newIndex - arr.length + 1;
                while (k--) {
                    arr.push(undefined); // Add undefined values for out-of-bounds
                }
            }
            // Remove the item from the old index and store it
            const [movedItem] = arr.splice(oldIndex, 1);

            // Insert the item at the new index
            arr.splice(newIndex, 0, movedItem);
            return arr;
        },
        checkSelect() {
            const table = sap.ui.getCore().byId("idDataTablePOP");
            table.getItems()
                .forEach((item, index) => {
                    const obj = item.getBindingContext().getObject();
                    if (obj.select)
                        item.addStyleClass("selectItem")
                    else
                        item.removeStyleClass("selectItem")
                    const icons = item.getCells()[2].getItems();
                    if (index === 0) {
                        icons[0].setVisible(false);
                        icons[2].setVisible(false);
                    } else {
                        icons[0].setVisible(true);
                        icons[2].setVisible(true);
                    }
                    if (index === that.settingData.length - 1) {
                        icons[1].setVisible(false);
                        icons[3].setVisible(false);
                    } else {
                        icons[1].setVisible(true);
                        icons[3].setVisible(true);
                    }
                })
        },
        onAddColumn() {
            const selectItems = sap.ui.getCore().byId("idDataTablePOP").getSelectedItems();
            that.selectItems = selectItems;
            that.columns = sap.ui.getCore().byId("idDataTablePOP").getModel().getData().data.filter(o => o.select).map(o => o.field);
            that.loadPivotTab(that.allData);
            // that.calledPivot(that.rawData);
            that._pivotSetting.close();
        },
        onCloseColumn() {
            that._pivotSetting.close();
        },
        onTogglePress: function (oEvent) {
            const oButton = oEvent.getSource();
            const $btn = oButton.$();
            const bPressed = oButton.getPressed();
            const newText = bPressed ? "Telescopic View" : "Calendar View";

            // A single duration for a consistent animation speed
            const animationDuration = 500; // ms

            // Set transform origin for a centered scale effect
            $btn.css("transform-origin", "50% 50%");

            // Animate out by shrinking horizontally
            $({ animValue: 1 }).animate(
                { animValue: 0 },
                {
                    duration: animationDuration,
                    easing: "swing", // Optional: for a more natural feel
                    step: function (now) {
                        // 'now' progresses from 1 to 0
                        // Apply this progress to both scaleX and opacity
                        $btn.css({
                            transform: `scaleX(${now})`,
                            opacity: now,
                        });
                    },
                    complete: function () {
                        // --- Animation Out Complete ---

                        // 1. Update the text while the button is invisible
                        oButton.setText(newText);

                        // 2. Animate in by expanding horizontally
                        $({ animValue: 0 }).animate(
                            { animValue: 1 },
                            {
                                duration: animationDuration,
                                easing: "swing",
                                step: function (now) {
                                    // 'now' progresses from 0 to 1
                                    $btn.css({
                                        transform: `scaleX(${now})`,
                                        opacity: now,
                                    });
                                },
                            }
                        );
                    },
                }
            );
            const selectedItem = bPressed ? "Telescopic View" : "Calendar View";
            that.skip = 0;
            if (selectedItem == "Calendar View") {
                that.setDateRange("enable", "", 3);
            } else {
                that.setDateRange("disable", 2);
            }
            that.onGo();
        },
        onClear() {
            that.oGModel.setProperty("/showPivot", false);
            that.byId("idPivotPagePOP").setBusy(false);
            var newDiv = document.createElement("div");
            that.allData = [];
            that.setDateRange("disable", 2);
            newDiv.id = `pivotGrid`;
            newDiv.textContent = "";
            var existingDiv = document.querySelector(`[id*='mainDivPOP']`);
            if (existingDiv.children.length > 0) {
                while (existingDiv.firstChild) {
                    existingDiv.removeChild(existingDiv.firstChild);
                }
            }
        },
        onNavPress: function () {
            if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
                var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                // generate the Hash to display 
                var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: "VCPDocument",
                        action: "Display"
                    }
                })) || "";
                var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
                oStorage.put("nodeId", 103);
                //Generate a  URL for the second application
                var url = window.location.href.split('#')[0] + hash;
                //Navigate to second app
                sap.m.URLHelper.redirect(url, true);
            }
        },

    });
});