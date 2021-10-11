<script lang="ts">
import { userdata, update } from "./Storage/userdata";
import { fade } from "svelte/transition"

let showData: boolean = false;

let interval = setInterval(()=>{
    $userdata.tick();
    update();
}, 1000);

</script>
<div class='py-2 px-2 border bottom glass' 
    on:mouseenter = {()=>{showData = true}}
    on:mouseleave = {()=>{showData = false}}
>
    <span class='border all glass px-3 py-1 font-monospace'>
        loop #{$userdata.loop.number}
    </span>
    <span class='border all glass px-3 py-1 font-monospace'>
        {$userdata.data.amount} data
    </span>
    <!-- header here -->
</div>
{#if showData}
    <div class='header-overlay px-2 py-1' in:fade={{duration:100}}>
        <div class='border all body glass p-2'>
            AAA
        </div>
    </div>
{/if}
<div class='py-2 px-2 border bottom glass'>
    <span class='border all glass clickable px-3 py-1'>
        Loops
    </span>
</div>
<slot/>


<style>
    .header-overlay {
        position: absolute;
        width: 100vw;
        left: 0px;
    }
</style>