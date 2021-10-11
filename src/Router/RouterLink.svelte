<script>
    export let href = '/';
    export let style = '';
    import Routing from "./Support/Routing"
    console.log(href);
</script>

<span {style} on:click={() => {Routing.go(href)}}>
    <slot></slot>
</span>

<style>
    span {
        cursor: pointer;
    }
</style>

