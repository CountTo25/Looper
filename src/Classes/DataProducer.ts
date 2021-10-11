import Decimal from "decimal.js";
import type Upgrade from "./Upgrade"

export default class DataProducer {
    public name: string;
    public description: string;
    public income: Decimal;
    public price: (current: Decimal, amount: Decimal) => Decimal

    public calculateIncome(owned: Decimal, upgrades: Upgrade[]): Decimal
    {
        return new Decimal(0);
    }
}