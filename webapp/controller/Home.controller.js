sap.ui.define([
    "./PivotControl",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (PivotControl, JSONModel, MessageToast, Filter,
    FilterOperator) => {
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
                that.topCount = 15000;
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
                    case "COMP_QTY_SUM":
                        label = "Component Qty";
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
        getApplyQueryForFields(groupbyFields, measures) {
            // const that = this;

            // Build groupby clause
            let groupByClause = groupbyFields.join(",");

            // Build aggregate clause with proper lowercase operations
            let aggregateClause = undefined;
            if (measures)
                aggregateClause = measures
                    .map((measure) => {
                        return `${measure.field} with ${measure.operation} as ${measure.field
                            }_${measure.operation.toUpperCase()}`;
                    })
                    .join(",");

            // Build base apply query
            let applyQuery = `groupby((${groupByClause}),aggregate(${aggregateClause}))`;
            if (!aggregateClause) applyQuery = `groupby(${groupByClause})`;

            return applyQuery;
        },
        buildSingleFilterExpression(filter) {
            // const that = this;

            const operator = getODataOperator(filter.sOperator);
            function getODataOperator(op) {
                // const that = this;

                switch (op) {
                    case FilterOperator.EQ:
                        return "eq";
                    case FilterOperator.NE:
                        return "ne";
                    case FilterOperator.LT:
                        return "lt";
                    case FilterOperator.LE:
                        return "le";
                    case FilterOperator.GT:
                        return "gt";
                    case FilterOperator.GE:
                        return "ge";
                    case FilterOperator.BT:
                        return "bt";
                    case FilterOperator.Contains:
                        return "contains";
                    case FilterOperator.StartsWith:
                        return "startswith";
                    case FilterOperator.EndsWith:
                        return "endswith";
                    default:
                        return "eq";
                }
            }

            const path = filter.sPath;
            let val1, val2;
            val1 = formatValue(filter.oValue1);
            val2 = formatValue(filter.oValue2);
            function formatValue(val) {
                // const that = this;

                if (val instanceof Date) return val.toISOString().split("T")[0];
                if (typeof val === "string")
                    return that.isDateString(val) ? val : `'${val.replace(/'/g, "''")}'`;
                if (typeof val === "boolean") return val.toString();
                return val;
            }
            if (path == "UNIQUE_ID") {
                // val1 = Number(val1.trim().replace(/^['"]|['"]$/g, ""));
                // that.isUniqueID = true;
            }

            if (filter.sOperator === FilterOperator.BT) {
                if (!filter.oValue2) {
                    throw new Error(`Missing oValue2 for 'BT' filter on ${path}`);
                }
                return `(${path} ge ${val1} and ${path} le ${val2})`;
            }

            if (["contains", "startswith", "endswith"].includes(operator)) {
                return `${operator}(${path}, ${val1})`;
            }

            return `${path} ${operator} ${val1}`;
        },
        getODataOperator(op) {
            // const that = this;

            switch (op) {
                case FilterOperator.EQ:
                    return "eq";
                case FilterOperator.NE:
                    return "ne";
                case FilterOperator.LT:
                    return "lt";
                case FilterOperator.LE:
                    return "le";
                case FilterOperator.GT:
                    return "gt";
                case FilterOperator.GE:
                    return "ge";
                case FilterOperator.BT:
                    return "bt";
                case FilterOperator.Contains:
                    return "contains";
                case FilterOperator.StartsWith:
                    return "startswith";
                case FilterOperator.EndsWith:
                    return "endswith";
                default:
                    return "eq";
            }
        },
        getFilterApplyQuery(baseApplyQuery, filtersToApply) {
            // const that = this;

            if (filtersToApply?.length > 0) {
                const filterString = that.buildFilterString(filtersToApply);
                if (filterString) {
                    return `filter(${filterString})/${baseApplyQuery}`;
                }
            }
            return baseApplyQuery;
        },
        formatValue(val) {
            // const that = this;

            if (val instanceof Date) return val.toISOString().split("T")[0];
            if (typeof val === "string")
                return that.isDateString(val) ? val : `'${val.replace(/'/g, "''")}'`;
            if (typeof val === "boolean") return val.toString();
            return val;
        },
        isDateString(str) {
            return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(str);
        },
        getODataOperator(op) {
            // const that = this;

            switch (op) {
                case FilterOperator.EQ:
                    return "eq";
                case FilterOperator.NE:
                    return "ne";
                case FilterOperator.LT:
                    return "lt";
                case FilterOperator.LE:
                    return "le";
                case FilterOperator.GT:
                    return "gt";
                case FilterOperator.GE:
                    return "ge";
                case FilterOperator.BT:
                    return "bt";
                case FilterOperator.Contains:
                    return "contains";
                case FilterOperator.StartsWith:
                    return "startswith";
                case FilterOperator.EndsWith:
                    return "endswith";
                default:
                    return "eq";
            }
        },
        flattenFilters(filters) {
            const that = this;

            return filters.reduce((acc, item) => {
                if (item.aFilters) {
                    acc.push(...item.aFilters);
                } else {
                    acc.push(item);
                }
                return acc;
            }, []);
        },
        buildFilterString(filters) {
            // const that = this;

            return filters
                .map((filter) => {
                    if (filter.aFilters?.length) {
                        const group = filter.aFilters
                            .map(that.buildSingleFilterExpression)
                            .join(filter.bAnd ? " and " : " or ");
                        return `(${group})`;
                    }
                    return that.buildSingleFilterExpression(filter);
                })
                .join(" and ");
        },
        async loadData() {
            // const that = this;
            const bPressed = this.getView().byId("idTogglePOP").getPressed();
            const selectedItem = bPressed ? "Telescopic View" : "Calendar View";

            if (selectedItem == "Calendar View") {
                that.weekType = "CALENDAR_WEEK";
            } else {
                that.weekType = "TELESCOPIC_WEEK";
            }
            let aFilters = that.byId("smartFilterBarPOP").getFilters();
            that.byId("idPivotPagePOP").setBusy(true);

            const startVal = new Date(that.byId("idDaterangePOP").getDateValue()).toISOString().split('T')[0],
                endVal = this.byId("idDaterangePOP").getSecondDateValue().toISOString().split('T')[0];
            var foundobj = that.calWeekData.find(f => f.WEEK_STARTDATE.toISOString().split('T')[0] <= startVal && f.WEEK_ENDDATE.toISOString().split('T')[0] >= startVal);
            const vFromDate = foundobj.WEEK_STARTDATE.toISOString().split('T')[0];
            const weekFilter = new Filter("WEEK_DATE", FilterOperator.BT, new Date(vFromDate), new Date(endVal))
            if (aFilters) {
                aFilters.push(weekFilter);
            }



            const flatFilter = that.flattenFilters(aFilters);
            // let groupbyFields = [];

            let groupbyFields = [
                "LOCATION_ID",
                "LOCATION_DESC",
                "REF_PRODID",
                "PROD_DESC",
                "UNIQUE_ID",
                "SALES_DOC",
                "SALESDOC_ITEM",
                "MANU_LOC",
                "COMPONENT",
                "ORD_TYPE",
                "MAT_PARENT",
                "COMP_PROCURE_TYPE",
                "PROD_ORDER",
                "WEEK_DATE",
                that.weekType
            ];
            // const groupbyFields2 = [
            //     "LOCATION_ID",
            //     "LOCATION_DESC",
            //     "REF_PRODID",
            //     "PROD_DESC",
            //     "SALES_DOC",
            //     "UNIQUE_ID",
            //     "SALESDOC_ITEM",
            //     "MANU_LOC",
            //     "COMPONENT",
            //     "ORD_TYPE",
            //     "MAT_PARENT",
            //     "COMP_QTY",
            //     "COMP_PROCURE_TYPE",
            //     "PROD_ORDER",
            //     "WEEK_DATE",
            //     that.weekType
            // ];
            // if (flatFilter.find(i => i.sPath === "UNIQUE_ID")) {
            //     groupbyFields = groupbyFields2;
            // }

            const fil = (flatFilter.find(i => !["REF_PRODID", "WEEK_DATE"].includes(i.sPath))) ? aFilters[0].aFilters : aFilters;
            const
                measures = [
                    { field: "COMP_QTY", operation: "sum" }
                ],
                baseApplyQuery = that.getApplyQueryForFields(groupbyFields, measures),
                finalApplyQuery = that.getFilterApplyQuery(
                    baseApplyQuery,
                    fil
                );

            try {
                const res = await that.readModel(
                    "getProdOrdConsumptionNew", [], {
                    $apply: finalApplyQuery + '/orderby(LOCATION_ID,REF_PRODID,COMPONENT,WEEK_DATE)'
                }
                );

                const filterRes = res.filter(o => new Date(o.WEEK_DATE) >= new Date(vFromDate) && new Date(o.WEEK_DATE) <= new Date(endVal))
                that.allData.push(...filterRes);
                that.allData = that.allData.sort((a, b) => new Date(a.WEEK_DATE) - new Date(b.WEEK_DATE));
                that.loadPivotTab(that.allData)
                that.dataReady = true;
            } catch (error) {
                console.error(error);
                that.dataReady = true;
                that.byId("idPivotPagePOP").setBusy(false);
                MessageToast.show(error.message);
            }
        },
        addScrollEvent: function () {
            const that = this;
            var oPivotDiv = that.byId("mainDivPOP").getDomRef();

            // Track previous scroll position
            var lastScrollTop = 0;
            var isEventTriggered = false;

            if (oPivotDiv) {
                oPivotDiv.addEventListener("scroll", function (e) {
                    var currentScrollTop = oPivotDiv.scrollTop;
                    var scrollHeight = oPivotDiv.scrollHeight;
                    var clientHeight = oPivotDiv.clientHeight;

                    // Check if the user has scrolled vertically (ignores horizontal scroll)
                    if (currentScrollTop > lastScrollTop) {
                        // User is scrolling vertically
                        // Check if scrolled to the bottom and the event hasn't already triggered
                        if (
                            !isEventTriggered &&
                            that.hasMoreData &&
                            currentScrollTop + clientHeight >= scrollHeight - 1
                        ) {
                            // Trigger the event only once
                            that.skip += that.topCount
                            isEventTriggered = true;
                            that.loadData();
                            setTimeout(function () {
                                isEventTriggered = false;
                            }, 1000); // Adjust the timeout according to data loading time
                        }
                    }

                    // Update last scroll position
                    lastScrollTop = currentScrollTop;
                });
            }
        },
        loadPivotCss() {
            const that = this;
            $(".pvtTable").ready(function () {
                setTimeout(function () {
                    // Adjust vertical alignment for headers with large rowspan
                    $(".pvtTable")
                        .find("th[rowspan]")
                        .each(function () {
                            if (parseInt($(this).attr("rowspan")) > 7) {
                                $(this).css("vertical-align", "top");
                            }
                        });

                    const allWeek = $(".pvtTable").find("thead tr:first th");

                    $(allWeek).each(function (e) {
                        const cellText = $(this).text();

                        if (that.weekType === "TELESCOPIC_WEEK") {
                            if (that.telMonth.includes(cellText)) {
                                $(this).css("background-color", "#ced4da");
                            }

                            if (that.telQ.includes(cellText)) {
                                $(this).css("background-color", "#adb5bd");
                            }

                            // if (e === allWeek.length - 1) {
                            //     $(this).css("background-color", "#adb5bd");
                            // }
                        }

                        $(this).addClass("weekHeader");

                        const popoverHtml = `
                                <div class="popover">
                                    <div class="popover-content">
                                        <div class="date-row">
                                            <span class="date-label">From:</span>
                                            <span class="From${cellText}">28 April 2025</span>
                                        </div>
                                        <div class="date-row">
                                            <span class="date-label">To:</span>
                                            <span class="To${cellText}">05 May 2025</span>
                                        </div>
                                    </div>
                                </div>`;

                        // Add popover to header cell
                        $(this).append(popoverHtml);

                        // On hover, update date
                        $(this).hover(function () {
                            that.updateDate(cellText);
                        });
                    });

                    // Freeze columns in thead
                    function freezeHeaderColumns() {
                        // Process first row of thead
                        const firstHeadRow = $(".pvtTable").find("thead tr:first");
                        if (firstHeadRow.length) {
                            let widthsHead = [0];

                            // Calculate cumulative widths for first 3 columns (Location, Product, Assembly)
                            const columnsToFreeze = Math.min(
                                2,
                                firstHeadRow.find("th").length
                            );
                            // const columnsToFreeze = 2;
                            for (let i = 0; i < columnsToFreeze; i++) {
                                const th = firstHeadRow.find(`th:eq(${i})`);
                                if (th.length) {
                                    const borderWidth =
                                        parseFloat(th.css("border-left-width") || "0") +
                                        parseFloat(th.css("border-right-width") || "0");
                                    const paddingWidth =
                                        parseFloat(th.css("padding-left") || "0") +
                                        parseFloat(th.css("padding-right") || "0");
                                    const width =
                                        parseFloat(th.css("width") || "0") +
                                        borderWidth +
                                        paddingWidth;
                                    widthsHead.push(widthsHead[i] + width);
                                }
                            }

                            // Apply freeze positioning
                            firstHeadRow.find("th").each(function (index) {
                                if (index < columnsToFreeze) {
                                    $(this).addClass("frezzThead");
                                    $(this).css("left", `${widthsHead[index]}px`);
                                }
                            });
                        }

                        // Process second row of thead (axis labels)
                        const secondHeadRow = $(".pvtTable").find("thead tr:eq(1)");
                        if (secondHeadRow.length) {
                            let widthsHead2 = [0];
                            const thElements = secondHeadRow.find("th");
                            const columnsToFreeze = thElements.length;

                            // Calculate widths for columns to freeze
                            for (let i = 0; i < columnsToFreeze; i++) {
                                const th = thElements.eq(i);
                                const borderWidth =
                                    parseFloat(th.css("border-left-width") || "0") +
                                    parseFloat(th.css("border-right-width") || "0");
                                const paddingWidth =
                                    parseFloat(th.css("padding-left") || "0") +
                                    parseFloat(th.css("padding-right") || "0");
                                const width =
                                    parseFloat(th.css("width") || "0") +
                                    borderWidth +
                                    paddingWidth;
                                widthsHead2.push(widthsHead2[i] + width);
                            }

                            // Apply freeze positioning
                            thElements.each(function (index) {
                                if (index < columnsToFreeze) {
                                    $(this).addClass("frezzThead");
                                    $(this).css("left", `${widthsHead2[index]}px`);
                                }
                            });
                        }
                    }

                    // Freeze columns in tbody
                    function freezeBodyColumns() {
                        const tbody = $(".pvtTable").find("tbody");
                        if (!tbody.length) return;

                        // Find row with most th elements to use as reference
                        let maxThCount = 0;
                        let referenceRow = null;

                        tbody.find("tr").each(function () {
                            const thCount = $(this).find("th").length;
                            if (thCount > maxThCount) {
                                maxThCount = thCount;
                                referenceRow = $(this);
                            }
                        });

                        if (!referenceRow || maxThCount === 0) return;

                        // Calculate cumulative widths for the columns to freeze
                        let widths = [0];
                        for (let i = 0; i < maxThCount; i++) {
                            const th = referenceRow.find(`th:eq(${i})`);
                            if (th.length) {
                                const borderWidth =
                                    parseFloat(th.css("border-left-width") || "0") +
                                    parseFloat(th.css("border-right-width") || "0");
                                const paddingWidth =
                                    parseFloat(th.css("padding-left") || "0") +
                                    parseFloat(th.css("padding-right") || "0");
                                const width =
                                    parseFloat(th.css("width") || "0") +
                                    borderWidth +
                                    paddingWidth;
                                widths.push(widths[i] + width);
                            }
                        }

                        // Apply freeze positioning to each row
                        tbody.find("tr").each(function () {
                            const thElements = $(this).find("th");
                            const currentThCount = thElements.length;

                            thElements.each(function (index) {
                                // Adjust for rows with fewer th elements than the reference row
                                let positionIndex = index;
                                if (currentThCount < maxThCount) {
                                    // Calculate offset based on hierarchy level
                                    positionIndex += maxThCount - currentThCount;
                                }

                                $(this).addClass("frezz");
                                $(this).css("left", `${widths[positionIndex]}px`);
                            });
                        });
                    }

                    // Format number cells (remove decimals, replace empty cells with 0)
                    function formatCells() {
                        $(".pvtTable")
                            .find("td")
                            .each(function () {
                                let cellText = $(this).text().trim();
                                if (cellText === "") {
                                    // Fill empty cells with 0
                                    $(this).text("0");
                                }
                            });
                    }

                    // Execute all functions
                    freezeHeaderColumns();
                    freezeBodyColumns();
                    formatCells();
                }, 300); // Delay to ensure table is fully rendered
            });
        },
        updateDate(week) {
            const that = this;
            try {
                const Calendar = Array.isArray(that.calWeekData)
                    ? that.calWeekData.filter((o) => o && o[that.weekType] == week)
                    : [];

                const fromElem = document.getElementsByClassName(`From${week}`)[0];
                const toElem = document.getElementsByClassName(`To${week}`)[0];

                if (Calendar.length === 0) {
                    $(".popover").hide();
                    return;
                }
                $(".popover").show();
                const startDate =
                    Calendar[0]?.WEEK_STARTDATE instanceof Date
                        ? Calendar[0].WEEK_STARTDATE
                        : new Date(Calendar[0]?.WEEK_STARTDATE);
                const endDate =
                    Calendar[Calendar.length - 1]?.WEEK_ENDDATE instanceof Date
                        ? Calendar[Calendar.length - 1].WEEK_ENDDATE
                        : new Date(Calendar[Calendar.length - 1]?.WEEK_ENDDATE);

                const startDateStr = isNaN(startDate)
                    ? ""
                    : startDate.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    });
                const endDateStr = isNaN(endDate)
                    ? ""
                    : endDate.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    });

                if (fromElem) fromElem.innerHTML = startDateStr;
                if (toElem) toElem.innerHTML = endDateStr;
            } catch (e) {
                console.error("Error in updateDate:", e);
            }
        },
        setDateRange(mode = "disable", years = 2, months = 3) {
            const that = this;
            const oDateL = new Date();
            const oDateH = new Date();
            if (mode === "disable") {
                // Disable mode: tomorrow + specified years
                oDateH.setFullYear(oDateL.getFullYear() + years);
                that.byId("idDaterangePOP").setEnabled(false);
                that.byId("idDaterangePOP").setDateValue(oDateL);
                that.byId("idDaterangePOP").setSecondDateValue(oDateH);
            } else if (mode === "enable") {
                // Enable mode: tomorrow + specified months
                oDateH.setMonth(oDateL.getMonth() + months);
                that.byId("idDaterangePOP").setEnabled(true);
                that.byId("idDaterangePOP").setDateValue(oDateL);
                that.byId("idDaterangePOP").setSecondDateValue(oDateH);
            }
            that.byId("idDaterangePOP").setMinDate(new Date());
            // that.byId("idDaterangePOP").setMinDate(new Date(new Date().setDate(new Date().getDate() + 7)));
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