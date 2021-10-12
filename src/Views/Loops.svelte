<script lang="ts">
import type DataProducer from "../Classes/DataProducer";
import Producers from "../DB/Producers";
import BuildingNode from "../Parts/BuildingNode.svelte";
import {userdata, update} from "../Storage/userdata";

    let buildings: DataProducer[];
    let purchaseable: DataProducer[];
    $: buildings = $userdata.data.producers.map(p => Producers[p.name]);
    $: purchaseable = Object.keys(Producers).filter(
        p => Producers[p].visible($userdata)
    ).map(p => Producers[p]);

    console.log($userdata.data.producers);

</script>

<div class='glass bg loopbar text-center p-1'>
    Loop #{$userdata.loop.number}
</div>

<div class='container-fluid mt-2'>
    <div class='row'>
        <div class='col-6'>
            <div class='border glass all p-2'>
                {#each purchaseable as building}
                <BuildingNode {building} amount={$userdata.data.getBuildingAmount(building.name)}/>
                {/each}
            </div>
        </div>
        <div class='col-6'>
            <div class='border glass all p-2'>
                A
            </div>
        </div>
    </div>
</div>
