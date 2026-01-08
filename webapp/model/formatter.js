sap.ui.define([], function () {
  "use strict";

  return {
    /**
     * Determines the state of the Discontinued status.
     * If DiscontinuedDate is null, it is Success (Available), otherwise Error (Discontinued).
     */
    discontinuedState: function (sDiscontinuedDate) {
      if (!sDiscontinuedDate) {
        return "Success";
      } else {
        return "Error";
      }
    },

    /**
     * Determines the text of the Discontinued status.
     */
    discontinuedText: function (sDiscontinuedDate) {
      if (!sDiscontinuedDate) {
        return "Available";
      } else {
        return "Discontinued";
      }
    },
  };
});
