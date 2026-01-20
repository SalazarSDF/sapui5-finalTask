sap.ui.define(["sap/ui/core/mvc/Controller"], function (BaseController) {
  "use strict";

  return BaseController.extend("sapui5finaltask.controller.BaseController", {
    onInit: function () {},

    getModel: function (sName) {
      return this.getView().getModel(sName);
    },

    setModel: function (oModel, sName) {
      return this.getView().setModel(oModel, sName);
    },

    getI18nText: function (sText, ...args) {
      return this.getOwnerComponent()
        .getModel("i18n")
        .getResourceBundle()
        .getText(sText, args);
    },

    getRouter: function () {
      return this.getOwnerComponent().getRouter();
    },
  });
});
