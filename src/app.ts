import {Aurelia, inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {PLATFORM} from 'aurelia-pal';
import {positionEvent} from './events';
import * as pahoMqtt from 'paho-mqtt';


@inject(EventAggregator)
export class App {
    latitude: any;
    longitude: any;
    client: any;

    constructor(private ea: EventAggregator){
      console.log(pahoMqtt);
      this.client = new pahoMqtt.Client("127.0.0.1", 19001, "Mattias");
      this.client.connect();
      console.log(this.client);
    }

    callChild(){
        this.ea.publish(new positionEvent(this.latitude, this.longitude));
        console.log(this.client);
    }
}
