<script lang="ts">
    import type DataProducer from "../Classes/DataProducer";
    import Decimal from "decimal.js";

    export let building: DataProducer;
    export let amount: Decimal;

    let options: PurchaseOption[] = [
        {label: '1', amount: new Decimal(1), selected: true},
        {label: '10', amount: new Decimal(10), selected: false},
        {label: 'MAX', amount: new Decimal(10), selected: false},
    ]

    function changeActive(target: PurchaseOption) {
        options.forEach(o => o.selected = false);
        target.selected = true;
        options = options; //svelte
    }

    type PurchaseOption = {
        label: string,
        amount: Decimal,
        selected: boolean,
    }
</script>

<div class='row my-1 mx-0 w-100 border glass all clickable'>
    <div class='col-6 my-auto'>
        <div>{building.name}</div>
        <div>x{amount}</div>
    </div>
    <div class='col-3 font-monospace my-auto'>
        <div class='text-center'>
            {building.price(amount, new Decimal(1))} data
        </div>
        <div class='text-center pt-2'>
            <span class='p-1 px-3 clickable cursor glass border all'>
                buy
            </span>
        </div>
    </div>
    <div class='col-3 my-auto text-center border glass left'>
        {#each options as option}
            <div
                class='glass clickable cursor border all my-1'
                on:click={()=>{changeActive(option)}}
                class:active={option.selected}
            >
                {option.label}
            </div>
        {/each}
    </div>
</div>