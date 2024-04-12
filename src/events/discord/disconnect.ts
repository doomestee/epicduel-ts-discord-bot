import ClientEvent from "../../util/events/ClientEvent.js";

export default new ClientEvent("disconnect", function () {
    this.connectedAt = Date.now();
})