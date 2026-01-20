sap.ui.define(["sapui5finaltask/controller/BaseController"], (BaseController) => {
  "use strict";
  return BaseController.extend("sapui5finaltask.controller.Master", {
    onInit() {
      this._oRouter = this.getRouter();
      this._oRouter.getRoute("RouteMaster").attachPatternMatched(this._onMasterMatched, this);
    },

    _onMasterMatched: function () {
      const oTable = this.byId("innerTable");
      if (oTable) {
        oTable.removeSelections();
      }
    },

    onOpenObject: function (oEvent) {
      const oItem = oEvent.getParameter("listItem");
      const oContext = oItem.getBindingContext();
      const sProductId = oContext.getProperty("ID");
      this._oRouter.navTo("RouteObject", { productId: sProductId });
    },

    onCreate: function () {
      this._oRouter.navTo("RouteCreate");
    },
  });
});
