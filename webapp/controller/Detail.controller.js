sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/library",
    "sap/m/MessageBox",
  ],
  function (BaseController, JSONModel, mobileLibrary, MessageBox) {
    "use strict";

    var URLHelper = mobileLibrary.URLHelper;

    return BaseController.extend("sapui5finaltask.controller.Detail", {
      onInit: function () {
        var oViewModel = new JSONModel({
          busy: false,
          delay: 0,
          editMode: false,
          isNew: false,
        });
        this.setModel(oViewModel, "detailView");

        this.getRouter()
          .getRoute("object")
          .attachPatternMatched(this._onObjectMatched, this);
        this.getOwnerComponent()
          .getModel()
          .metadataLoaded()
          .then(this._onMetadataLoaded.bind(this));
      },

      /* ============================================
       *  Lifecycle / Routing
       * ============================================ */

      _onMetadataLoaded: function () {
        var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
          oViewModel = this.getModel("detailView");

        oViewModel.setProperty("/delay", 0);
        oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
      },

      _onObjectMatched: function (oEvent) {
        var oArguments = oEvent.getParameter("arguments");
        this._sObjectId = oArguments.objectId;
        var oViewModel = this.getModel("detailView");

        this.getView().unbindElement();

        if (
          this.getModel("appView").getProperty("/layout") !==
          "MidColumnFullScreen"
        ) {
          this.getModel("appView").setProperty(
            "/layout",
            "TwoColumnsMidExpanded",
          );
        }

        if (this._sObjectId === "new") {
          oViewModel.setProperty("/editMode", true);
          oViewModel.setProperty("/isNew", true);

          var oContext = this.getModel().createEntry("/Products");

          this.getView().setBindingContext(oContext);
        } else {
          oViewModel.setProperty("/editMode", false);
          oViewModel.setProperty("/isNew", false);

          this.getModel()
            .metadataLoaded()
            .then(
              function () {
                var sObjectPath = this.getModel().createKey("Products", {
                  ID: this._sObjectId,
                });

                this.getView().bindElement({
                  path: "/" + sObjectPath,
                  parameters: {
                    expand: "Supplier",
                  },
                  events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                      oViewModel.setProperty("/busy", true);
                    },
                    dataReceived: function () {
                      oViewModel.setProperty("/busy", false);
                    },
                  },
                });
              }.bind(this),
            );
        }
      },

      _onBindingChange: function () {
        var oElementBinding = this.getView().getElementBinding();
        if (!oElementBinding.getBoundContext()) {
          this.getOwnerComponent().oListSelector.clearMasterListSelection();
          return;
        }
        var sPath = oElementBinding.getPath();

        if (this._sObjectId !== "new" && sPath.indexOf("/Products") === 0) {
          this.getOwnerComponent().oListSelector.selectAListItem(sPath);
        }
      },

      onEdit: function () {
        this.getModel("detailView").setProperty("/editMode", true);
      },

      onCancel: function () {
        var oViewModel = this.getModel("detailView");

        if (oViewModel.getProperty("/isNew")) {
          this.getView().unbindElement();
          this.getModel().deleteCreatedEntry(
            this.getView().getBindingContext(),
          );
          this.onCloseDetailPress();
        } else {
          this.getModel().resetChanges();
          oViewModel.setProperty("/editMode", false);
        }
      },

      onSave: function () {
        var oViewModel = this.getModel("detailView");

        this.getModel().submitChanges({
          success: function () {
            oViewModel.setProperty("/busy", false);
            oViewModel.setProperty("/editMode", false);

            if (oViewModel.getProperty("/isNew")) {
              oViewModel.setProperty("/isNew", false);
            }
          }.bind(this),
          error: function (oError) {
            oViewModel.setProperty("/busy", false);
            var sMessage = "Error saving data: " + oError.message;
            MessageBox.error(sMessage);
          }.bind(this),
        });
      },

      onDelete: function () {
        var oContext = this.getView().getBindingContext();

        MessageBox.confirm("Are you sure you want to delete this product?", {
          onClose: function (oAction) {
            if (oAction === MessageBox.Action.OK) {
              this.getModel().remove(oContext.getPath(), {
                success: function () {
                  this.onCloseDetailPress();
                }.bind(this),
                error: function (oError) {
                  MessageBox.error("Delete failed: " + oError.message);
                },
              });
            }
          }.bind(this),
        });
      },

      onSendEmailPress: function () {
        var sUrl = window.location.href;
        var sSubject = "Check out this Product";
        var sBody = "Here is link to the product: " + sUrl;

        URLHelper.triggerEmail(null, sSubject, sBody);
      },

      onCloseDetailPress: function () {
        this.getModel("appView").setProperty(
          "/actionButtonsInfo/midColumn/fullScreen",
          false,
        );
        this.getOwnerComponent().oListSelector.clearMasterListSelection();
        this.getView().unbindElement();
        this.getRouter().navTo("master");
      },

      toggleFullScreen: function () {
        var bFullScreen = this.getModel("appView").getProperty(
          "/actionButtonsInfo/midColumn/fullScreen",
        );
        this.getModel("appView").setProperty(
          "/actionButtonsInfo/midColumn/fullScreen",
          !bFullScreen,
        );
        if (!bFullScreen) {
          this.getModel("appView").setProperty(
            "/previousLayout",
            this.getModel("appView").getProperty("/layout"),
          );
          this.getModel("appView").setProperty(
            "/layout",
            "MidColumnFullScreen",
          );
        } else {
          this.getModel("appView").setProperty(
            "/layout",
            this.getModel("appView").getProperty("/previousLayout"),
          );
        }
      },
    });
  },
);
