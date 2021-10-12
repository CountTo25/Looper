import type DataProducer from "../Classes/DataProducer";
import Observer from "../Classes/DataProducers.ts/Observer";

const all: {[key: string]: DataProducer} = {
    observer: new Observer(),
}

export default all;