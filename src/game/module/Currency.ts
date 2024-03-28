import type Client from "../Proximus.js";
import BaseModule from "./Base.js";

export default class Currency extends BaseModule {
    static FREE_ID = 0;
    static CREDITS_ID = 1;
    static CREDITS_NAME = "Credits";
    static VARIUM_ID = 2;
    static VARIUM_NAME = "Varium";
    static CLASS_COUPON_ITEM_ID = 5090;
    static CLASS_COUPON_ID = 3;
    static CLASS_COUPON_NAME = "Class Change Coupon";
    static SKILL_COUPON_ITEM_ID = 5091;
    static SKILL_COUPON_ID = 4;
    static SKILL_COUPON_NAME = "Skill Retrain Coupon";
    static GEAR_COUPON_ITEM_ID = 5092;
    static GEAR_COUPON_ID = 5;
    static GEAR_COUPON_NAME = "Gear Retrain Coupon";

    constructor(public client: Client) {
        super();
    }

    protected _credits = 0;
    protected _varium = 0;
    protected _points = 0;

    get class_coupons() {
        return this.client.modules.Inventory.getInventoryItemCount(Currency.CLASS_COUPON_ITEM_ID, true, false);
    }

    get skill_coupons() {
        return this.client.modules.Inventory.getInventoryItemCount(Currency.SKILL_COUPON_ITEM_ID, true, false);
    }

    get gear_coupons() {
        return this.client.modules.Inventory.getInventoryItemCount(Currency.GEAR_COUPON_ITEM_ID, true, false);
    }

    get points() { return this._points; }
    set points(val) { this._points = val < 0 ? 0 : val; }

    // static get points() { return points; }
    // static set points(val) { points = val < 0 ? 0 : val; }

    get varium() { return this._varium; }
    set varium(val) { this._varium = val < 0 ? 0 : val; }

    // static get varium() { return varium; }
    // static set varium(val) { varium = val; }

    get credits() { return this._credits; }
    set credits(val) { this._credits = val < 0 ? 0 : val; }

    // static get credits() { return credits; }
    // static set credits(val) { credits = val; }

}