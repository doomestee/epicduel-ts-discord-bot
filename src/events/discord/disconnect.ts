import ClientEvent from "../../util/ClientEvent.js";

export default new ClientEvent("disconnect", function () {
    this.connectedAt = Date.now();
})