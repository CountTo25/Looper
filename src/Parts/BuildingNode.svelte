<script lang="ts">
    import type DataProducer from "../Classes/DataProducer";
    import Decimal from "decimal.js";

    export let building: DataProducer;
    export let amount: Decimal;
</script>

<div class='row my-1 mx-0 w-100 border glass all clickable'>
    <div class='col-6 my-auto'>
        <div>{building.name}</div>
        <div>{amount}</div>
    </div>
    <div class='col-3 my-auto'>
        <div>
            {building.price(amount, new Decimal(1))} data
        </div>
    </div>
    <div class='col-3 my-auto'>
        <div>1</div>
        <div>10</div>
        <div>MAX</div>
    </div>
</div>