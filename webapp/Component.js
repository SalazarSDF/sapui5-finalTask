sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sapui5finaltask/model/models",
    "./controller/ListSelector",
  ],
  (UIComponent, models, ListSelector) => {
    "use strict";

    return UIComponent.extend("sapui5finaltask.Component", {
      metadata: {
        manifest: "json",
        interfaces: ["sap.ui.core.IAsyncContentCreation"],
      },

      init: function() {
        UIComponent.prototype.init.apply(this, arguments);

        this.oListSelector = new ListSelector();
        // call the base component's init function

        // set the device model
        this.setModel(models.createDeviceModel(), "device");

        // enable routing
        this.getRouter().initialize();
      },

      /**
       * The component is destroyed by UI5 automatically.
       * In this method, the ListSelector and ErrorHandler are destroyed.
       * @public
       * @override
       */
      destroy: function () {
        this.oListSelector.destroy();
        // call the base component's destroy function
        UIComponent.prototype.destroy.apply(this, arguments);
      },

      /**
       * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
       * design mode class should be set, which influences the size appearance of some controls.
       * @public
       * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
       */
      getContentDensityClass: function () {
        if (this._sContentDensityClass === undefined) {
          // check whether FLP has already set the content density class; do nothing in this case
          if (
            document.body.classList.contains("sapUiSizeCozy") ||
            document.body.classList.contains("sapUiSizeCompact")
          ) {
            this._sContentDensityClass = "";
          } else if (!Device.support.touch) {
            // apply "compact" mode if touch is not supported
            this._sContentDensityClass = "sapUiSizeCompact";
          } else {
            // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
            this._sContentDensityClass = "sapUiSizeCozy";
          }
        }
        return this._sContentDensityClass;
      },
    });
  },
);
