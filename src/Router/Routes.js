import Route from "./Support/Route";
import Layout from "../Layout.svelte";
import Loops from "../Views/Loops.svelte";

export default Route.define([
    Route.group('', {layout: Layout}, [
        Route.path('', {view: Loops, title: 'Loops'})
    ]),
])