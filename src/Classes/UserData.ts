import Decimal from "decimal.js";
import { update } from "../Storage/userdata";

export default class UserData {
    public loop: Loop = new Loop();
    public data: DataRecord = new DataRecord();
    public records: {};

    public tick() {
        this.loop.progress = this.loop.progress.add(new Decimal(1));
        this.data.amount = this.data.amount.add(new Decimal(1));

        if (this.loop.progress.gte(this.loop.duration)) {
            this.data.amount = new Decimal(0);
            this.loop.progress = new Decimal(0);
            this.loop.number = this.loop.number.add(new Decimal(1));
        }
        
        update();
    }
}

class DataRecord {
    public amount: Decimal = new Decimal(0);
}

class Loop {
    public number: Decimal = new Decimal(1);
    public duration: Decimal = new Decimal(10);
    public progress: Decimal = new Decimal(0);
}