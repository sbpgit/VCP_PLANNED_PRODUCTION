sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
], (BaseController, MessageToast) => {
    "use strict";

    return BaseController.extend("vcpapp.vcpprodordconsumptionpivot.controller.PivotControl", {
        async loadData() {
            const that = this;
            const bPressed = this.getView().byId("idTogglePOP").getPressed();
            const selectedItem = bPressed ? "Telescopic View" : "Calendar View";

            if (selectedItem == "Calendar View") {
                that.weekType = "CALENDAR_WEEK";
            } else {
                that.weekType = "TELESCOPIC_WEEK";
            }
            let aFilters = that.byId("smartFilterBarPOP").getFilters();


            that.byId("idPivotPagePOP").setBusy(true);
            try {
                // const urlParameters = {
                //     $apply: finalApplyQuery,
                //     // $skip: that.skip,
                //     // $top: that.top, //batch size
                // }
                const res = await that.readModel(
                    "getProdOrdConsumptionNew", aFilters, {}
                );
                const startVal = new Date(that.byId("idDaterangePOP").getDateValue()).toISOString().split('T')[0],
                    endVal = this.byId("idDaterangePOP").getSecondDateValue().toISOString().split('T')[0];

                var foundobj = that.calWeekData.find(f => f.WEEK_STARTDATE.toISOString().split('T')[0] <= startVal && f.WEEK_ENDDATE.toISOString().split('T')[0] >= startVal);
                const vFromDate = foundobj.WEEK_STARTDATE.toISOString().split('T')[0];
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
    });
});