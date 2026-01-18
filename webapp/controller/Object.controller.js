sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
  ],
  (Controller, JSONModel, MessageToast) => {
    "use strict";
    return Controller.extend("sapui5finaltask.controller.Object", {
      onInit() {
        this._oRouter = this.getOwnerComponent().getRouter();
        this._oRouter
          .getRoute("RouteObject")
          .attachPatternMatched(this._onObjectMatched, this);
        this._oRouter
          .getRoute("RouteCreate")
          .attachPatternMatched(this._onCreateMatched, this);

        this.getView().setModel(new JSONModel({ editMode: false }), "view");
        this._oModel = this.getOwnerComponent().getModel();

      this._oResourceBundle = this.getOwnerComponent()
        .getModel("i18n")
        .getResourceBundle();
      },

      _onObjectMatched: function (oEvent) {
        const sProductId = oEvent.getParameter("arguments").productId;
        this.getView().bindElement(`/Products(${sProductId})`);
        this.getView().getModel("view").setProperty("/editMode", false);
      },

      _onCreateMatched: function () {
        this.getView().unbindElement();
        this._oNewContext = this._oModel.createEntry("/Products", {
          properties: {
            Name: "",
            Description: "",
            ReleaseDate: "",
            DiscontinuedDate: null,
            Rating: 2,
            Price: 0,
          },
        });
        this.getView().setBindingContext(this._oNewContext);
        this.getView().getModel("view").setProperty("/editMode", true);
        this._bIsCreate = true;
      },

      onEdit: function () {
        this.getView().getModel("view").setProperty("/editMode", true);
      },

      simpleValidation: function () {
        const oNameInput = this.byId("nameInput");
        const oDescriptionInput = this.byId("descriptionInput");

        let bValid = true;

        if (!oNameInput.getValue().trim()) {
          oNameInput.setValueState("Error");
          oNameInput.setValueStateText(this._oResourceBundle.getText("nameRequired"));
          bValid = false;
        } else {
          oNameInput.setValueState("None");
        }

        if (!oDescriptionInput.getValue().trim()) {
          oDescriptionInput.setValueState("Error");
          oDescriptionInput.setValueStateText(this._oResourceBundle.getText("descriptionRequired"));
          bValid = false;
        } else {
          oDescriptionInput.setValueState("None");
        }

        return bValid;
      },

      onSave: function () {
        if (!this.simpleValidation()) {
          return;
        }

        this._oModel.submitChanges({
          success: () => {
            MessageToast.show("Saved successfully");
            this.getView().getModel("view").setProperty("/editMode", false);
            if (this._bIsCreate) {
              this._bIsCreate = false;
            }
            this._oRouter.navTo("RouteMaster");
          },
          error: () => MessageToast.show("Save failed"),
        });
      },

      onCancel: function () {
        if (this._bIsCreate) {
          this._oModel.deleteCreatedEntry(this._oNewContext);
          this._bIsCreate = false;
        } else {
          this._oModel.resetChanges();
        }
        this.getView().getModel("view").setProperty("/editMode", false);
        this._oRouter.navTo("RouteMaster");
      },

      onDelete: function () {
        const oContext = this.getView().getBindingContext();
        this._oModel.remove(oContext.getPath(), {
          success: () => {
            MessageToast.show("Deleted successfully");
            this._oRouter.navTo("RouteMaster");
          },
          error: () => MessageToast.show("Delete failed"),
        });
      },
    });
  },
);
