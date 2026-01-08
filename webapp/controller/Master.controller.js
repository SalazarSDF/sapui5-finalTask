sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/GroupHeaderListItem",
    "sap/ui/Device",
    "sap/ui/core/Fragment",
    "../model/formatter",
  ],
  function (
    BaseController,
    JSONModel,
    Filter,
    FilterOperator,
    Sorter,
    GroupHeaderListItem,
    Device,
    Fragment,
    formatter,
  ) {
    "use strict";

    return BaseController.extend("sapui5finaltask.controller.Master", {
      formatter: formatter,

      onInit: function () {
        var oList = this.byId("list"),
          oViewModel = this._createViewModel(),
          iOriginalBusyDelay = oList.getBusyIndicatorDelay();

        this._oGroupFunctions = {
          Price: function (oContext) {
            var fPrice = parseFloat(oContext.getProperty("Price"));
            var sKey, sText;

            if (fPrice < 60) {
              sKey = "Low";
              sText = "Low (< 60)";
            } else if (fPrice < 100) {
              sKey = "Medium";
              sText = "Medium (60 - 100)";
            } else {
              sKey = "High";
              sText = "High (> 100)";
            }
            return {
              key: sKey,
              text: sText,
            };
          },
          ReleaseDate: function (oContext) {
            var oDate = oContext.getProperty("ReleaseDate");
            if (!oDate) return { key: "Unknown", text: "Unknown Date" };

            var iYear = oDate.getFullYear();
            return {
              key: iYear,
              text: iYear.toString(),
            };
          },
        };

        this._oList = oList;
        this._oListFilterState = {
          aFilter: [],
          aSearch: [],
        };

        this.setModel(oViewModel, "masterView");

        oList.attachEventOnce("updateFinished", function () {
          oViewModel.setProperty("/delay", iOriginalBusyDelay);
        });

        this.getView().addEventDelegate({
          onBeforeFirstShow: function () {
            this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
          }.bind(this),
        });

        this.getRouter()
          .getRoute("master")
          .attachPatternMatched(this._onMasterMatched, this);
        this.getRouter().attachBypassed(this.onBypassed, this);
      },

      onUpdateFinished: function (oEvent) {
        this._updateListItemCount(oEvent.getParameter("total"));
      },

      onSearch: function (oEvent) {
        if (oEvent.getParameters().refreshButtonPressed) {
          this.onRefresh();
          return;
        }

        var sQuery = oEvent.getParameter("query");

        if (sQuery) {
          this._oListFilterState.aSearch = [
            new Filter("Name", FilterOperator.Contains, sQuery),
          ];
        } else {
          this._oListFilterState.aSearch = [];
        }
        this._applyFilterSearch();
      },

      onRefresh: function () {
        this._oList.getBinding("items").refresh();
      },

      onOpenViewSettings: function (oEvent) {
        var sDialogTab = "filter";
        if (oEvent.getSource().isA("sap.m.Button")) {
          var sButtonId = oEvent.getSource().getId();
          if (sButtonId.match("sort")) {
            sDialogTab = "sort";
          } else if (sButtonId.match("group")) {
            sDialogTab = "group";
          }
        }
        if (!this._pViewSettingsDialog) {
          this._pViewSettingsDialog = Fragment.load({
            id: this.getView().getId(),
            name: "sapui5finaltask.view.ViewSettingsDialog",
            controller: this,
          }).then(
            function (oDialog) {
              this.getView().addDependent(oDialog);
              oDialog.addStyleClass(
                this.getOwnerComponent().getContentDensityClass(),
              );
              return oDialog;
            }.bind(this),
          );
        }
        this._pViewSettingsDialog.then(function (oDialog) {
          oDialog.open(sDialogTab);
        });
      },

      onConfirmViewSettingsDialog: function (oEvent) {
        var aFilterItems = oEvent.getParameter("filterItems"),
          aFilters = [],
          aCaptions = [];

        aFilterItems.forEach(function (oItem) {
          switch (oItem.getKey()) {
            case "Discontinued":
              aFilters.push(
                new Filter("DiscontinuedDate", FilterOperator.NE, null),
              );
              break;
            case "Available":
              aFilters.push(
                new Filter("DiscontinuedDate", FilterOperator.EQ, null),
              );
              break;
            default:
              break;
          }
          aCaptions.push(oItem.getText());
        });

        this._oListFilterState.aFilter = aFilters;
        this._updateFilterBar(aCaptions.join(", "));
        this._applyFilterSearch();
        this._applyGrouper(oEvent);
      },

      _applyGrouper: function (oEvent) {
        var mParams = oEvent.getParameters(),
          sPath,
          bDescending,
          aSorters = [];

        if (mParams.groupItem) {
          sPath = mParams.groupItem.getKey();
          bDescending = mParams.groupDescending;
          var vGroup = this._oGroupFunctions[sPath];
          if (vGroup) {
            aSorters.push(new Sorter(sPath, bDescending, vGroup));
          }
        }
        this._oList.getBinding("items").sort(aSorters);
      },

      onSelectionChange: function (oEvent) {
        var oList = oEvent.getSource(),
          bSelected = oEvent.getParameter("selected");

        if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
          this._showDetail(
            oEvent.getParameter("listItem") || oEvent.getSource(),
          );
        }
      },

      onBypassed: function () {
        this._oList.removeSelections(true);
      },

      createGroupHeader: function (oGroup) {
        return new GroupHeaderListItem({
          title: oGroup.text,
        });
      },

      _createViewModel: function () {
        return new JSONModel({
          isFilterBarVisible: false,
          filterBarLabel: "",
          delay: 0,
          titleCount: 0,
          noDataText: this.getResourceBundle().getText("masterListNoDataText"),
        });
      },

      _onMasterMatched: function () {
        this.getModel("appView").setProperty("/layout", "OneColumn");
      },

      _showDetail: function (oItem) {
        var bReplace = !Device.system.phone;
        this.getModel("appView").setProperty(
          "/layout",
          "TwoColumnsMidExpanded",
        );
        this.getRouter().navTo(
          "object",
          {
            objectId: oItem.getBindingContext().getProperty("ID"),
          },
          bReplace,
        );
      },

      _updateListItemCount: function (iTotalItems) {
        if (this._oList.getBinding("items").isLengthFinal()) {
          this.getModel("masterView").setProperty("/titleCount", iTotalItems);
        }
      },

      _applyFilterSearch: function () {
        var aFilters = this._oListFilterState.aSearch.concat(
            this._oListFilterState.aFilter,
          ),
          oViewModel = this.getModel("masterView");
        this._oList.getBinding("items").filter(aFilters, "Application");

        if (aFilters.length !== 0) {
          oViewModel.setProperty(
            "/noDataText",
            this.getResourceBundle().getText(
              "masterListNoDataWithFilterOrSearchText",
            ),
          );
        } else if (this._oListFilterState.aSearch.length > 0) {
          oViewModel.setProperty(
            "/noDataText",
            this.getResourceBundle().getText("masterListNoDataText"),
          );
        }
      },

      _updateFilterBar: function (sFilterBarText) {
        var oViewModel = this.getModel("masterView");
        oViewModel.setProperty(
          "/isFilterBarVisible",
          this._oListFilterState.aFilter.length > 0,
        );
        oViewModel.setProperty(
          "/filterBarLabel",
          this.getResourceBundle().getText("masterFilterBarText", [
            sFilterBarText,
          ]),
        );
      },

      onCreate: function () {
        this.getModel("appView").setProperty(
          "/layout",
          "TwoColumnsMidExpanded",
        );
        this.getRouter().navTo("object", {
          objectId: "new",
        });
      },
    });
  },
);
