import {Aurelia, inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {PLATFORM} from 'aurelia-pal';
import * as events from './events';
import * as pahoMqtt from 'paho-mqtt';


@inject(EventAggregator)
export class App{
    static eas: EventAggregator;
    static app: App;
    latitude: any;
    longitude: any;
    client: any;

    mqttbrokerClientId = "journeyguideclient3";
    // Local broker
    localhost = "127.0.0.1";
    localport = 9001;
    tobsSensorsGnssRmc = "tobs/sensors/gnss/rmc";
    tobsCurrentVehicleJourneyCallEvent = "tobs/current_vehicle_journey/call_event";
    tobsCurrentVehicleJourneyDetails = "tobs/current_vehicle_journey/details";
    tobsCurrentVehicleJourneyLinkProgress = "tobs/current_vehicle_journey/link_progress";
    tobsCurrentVehicleJourneyExpectedCall = "tobs/current_vehicle_journey/expected_call";
    tobsCurrentVehicleJourneyState = "tobs/current_vehicle_journey/state";
    
    // Vehiclereplicator
    username = "hogiacommunications";  
    pass = "Hogia6969";  
    mqttbrokerHost = "mosquittoserver.westeurope.cloudapp.azure.com";  
    mqttbrokerWebsocketPort = 9001;  
    //var topic = "/replicator/arriva/#";
    topic = "/replicator/hogiacommunications/#"; 


    //demo 
    demoState: string = "";

    mapModel: any;

    constructor(private ea: EventAggregator){ 
      App.eas = ea;
      App.app = this;
      //ea.subscribe(events.vrMessage, msg =>this.parseVehicleReplicatorMessage(msg.message));
    }

    attached(){
      console.log(this.mapModel);
      console.log(this.mapModel.addLayer);
    }

    unsubscribeAllTopics(){
      if(this.client){
        try{
          this.client.unsubscribe(this.topic);      
          this.client.unsubscribe(this.tobsSensorsGnssRmc);
          this.client.unsubscribe(this.tobsCurrentVehicleJourneyLinkProgress);
          this.client.unsubscribe(this.tobsCurrentVehicleJourneyExpectedCall);
          this.client.unsubscribe(this.tobsCurrentVehicleJourneyState);
        }catch(error){
          console.log(error);
        }
        
      }
    }

    setupLocalMQTT(){
      this.unsubscribeAllTopics();
      this.client = new pahoMqtt.Client("127.0.0.1", 19001, "Mattias");
      this.client.onConnect = this.onConnect;
      this.client.onMessageArrived = this.onMessageArrived; 
      this.client.onConnectionLost = this.onConnectionLost;

      var options = {
        onSuccess: this.onConnectLocal,     
        timeout: 3
      };

      this.client.connect(options);
      
    }

    setupVrBroker(){
      console.log("setup vr broker");
      this.unsubscribeAllTopics();
      console.log("creating client");
      this.client = new pahoMqtt.Client(this.mqttbrokerHost, this.mqttbrokerWebsocketPort, this.mqttbrokerClientId );
      this.client.app = this;
      // set callback handlers
      //this.client.onConnected = this.onConnected;
      this.client.onConnectionLost = this.onConnectionLost;
      this.client.onMessageArrived = this.onMessageArrivedVR;     

      // connect the client
      var options = {
        onSuccess: this.onConnect, 
        onFailure: this.onFailure,
        userName: this.username, 
        password: this.pass,
        invocationContext: {"app": this},
        timeout: 3
      };
      console.log("trying to connect");
      this.client.connect(options);
    }

    onFailure(response){
      console.log(response);
    }

    useLocalMQTT(){
      //infoView.clearGuideData();
      //connectLocalBroker();
      this.demoState = "";
      this.setupLocalMQTT();
    }

    useVrMQTT(){
      this.demoState = "";

      this.setupVrBroker();
    }

    onMessageArrivedVR(message){
      console.log(this);
      var destination = message.destinationName;
      if(destination.includes("/replicator/hogiacommunications/")){        
        //App.eas.publish(new events.vrMessage(message));
        App.app.parseVehicleReplicatorMessage(message);
      }else if(destination.includes("/replicator/arriva/")){        
        //App.eas.publish(new events.vrMessage(message));
        App.app.parseVehicleReplicatorMessage(message);
      }
    }

    parseVehicleReplicatorMessage(message){
      var json = JSON.parse(message.payloadString);
      console.log(json);
      /*if ( !__line || !__journey || __line != json.LineRef|| __journey != json.JourneyRef){     
        console.log("line: " + __line);
        console.log("journey: " +  __journey);
        console.log("lineRef: " + json.LineRef);
        console.log("journeyRef: " + json.JourneyRef);
        infoView.setHeader("", json.LineRef);
        // details.line.name, details.line.designation
        __line = json.LineRef;
        __journey = json.JourneyRef;
      }*/
      console.log("LineRef: " + json.LineRef);
      console.log("JourneyRef: " + json.JourneyRef);
      //map.update_map(parseFloat(json.Latitude), parseFloat(json.Longitude), parseInt(json.Heading), parseFloat(json.Speed));
      //this.ea.publish(new events.positionEvent(parseFloat(json.Latitude), parseFloat(json.Longitude), parseInt(json.Heading), parseFloat(json.Speed)))
      this.mapModel.updateMap(parseFloat(json.Latitude), parseFloat(json.Longitude), parseInt(json.Heading), parseFloat(json.Speed));

      //update_stops(json.Timestamp);
    }

    onConnect(obj){
      // Once a connection has been made, make a subscription and send a message.
      console.log("in onConnect");    
      console.log(obj);
      //console.log("Connected to: " + this.mqttbrokerHost + ":" +  this.mqttbrokerWebsocketPort.toString());  
      var options = {
          qos: 2
      }
      var res = obj.invocationContext.app.client.subscribe(obj.invocationContext.app.topic, options);
      console.log(res);
      console.log("subscribed to: " + obj.invocationContext.app.topic)  
    }

    onConnectionLost(m){
      console.log(m);
      console.log(m.errorMessage);
      console.log("Connection lost..");
    }

    onMessageArrived(message) {    
      console.log("onMessageArrived");
      if(!message.payloadString){
          console.log("No payload string: ");
          console.log(message);
      }  
      
      switch(message.destinationName){
  
          case this.tobsSensorsGnssRmc:
              this.handleRmc(JSON.parse(message.payloadString));  
              break;
  
          case this.tobsCurrentVehicleJourneyCallEvent:
              this.handleCallEvent(JSON.parse(message.payloadString));
              break;
  
          case this.tobsCurrentVehicleJourneyDetails:
              this.handleDetails(JSON.parse(message.payloadString));
              break;
  
          case this.tobsCurrentVehicleJourneyExpectedCall:
              this.handleExpectedCall(JSON.parse(message.payloadString));
              break;
  
          case this.tobsCurrentVehicleJourneyLinkProgress:
              this.handleLinkProgress(JSON.parse(message.payloadString));
              break;
  
          case this.tobsCurrentVehicleJourneyState:
              this.handleStateMessage(JSON.parse(message.payloadString));
              break;
  
          default:
              console.log("Ignored message on: " + message.destinationName);
              break;
      }
  }

    handleRmc(rmc){
      console.log(rmc);
    }

    handleCallEvent(callEvent){}

    handleDetails(details){}
    handleExpectedCall(expectedCall){}
    handleLinkProgress(linkProgress){}
    handleStateMessage(state){}


    onConnectLocal(){
      console.log("Connection success!");
      this.client.subscribe(this.tobsSensorsGnssRmc);
      //client.subscribe(tobsCurrentVehicleJourneyCallEvent);
      this.client.subscribe(this.tobsCurrentVehicleJourneyDetails);
      //client.subscribe(tobsCurrentVehicleJourneyState);
      this.client.subscribe(this.tobsCurrentVehicleJourneyLinkProgress);
      this.client.subscribe(this.tobsCurrentVehicleJourneyExpectedCall);
    }

    journeyStart(){     
      this.unsubscribeAllTopics();
      if(this.demoState != "journeyStart"){
          //clearGuideData()
          //var busCoord1 = [59.314731, 18.003361];
          //var direction1 = 335;

          //setHeaderData("2", "Sofia");
          //setStopData(null, stops[0], stops[1], stops[2]);
          //map.mapGL.setPitch(60);
          //map.update_map(busCoord1[0], busCoord1[1], direction1, 0, true);
          this.ea.publish(new events.removeAllLayersEvent());
          this.ea.publish(new events.pitchEvent(60));
          this.ea.publish(new events.positionEvent(59.314731, 18.003361, 335, 0));
          this.ea.publish(new events.setHeaderEvent("2", "Sofia"));
          
          this.ea.publish(new events.setPreviousStopEvent({
            "stopName": "",
            "time": "",
            "designation": "",
            "isRegulatedStop": "",
            "hasInterconnections": "",
            "isCancelled": "",
            "noBoarding": "",
            "noAlighting": ""
          }));
          this.ea.publish(new events.setNextStopEvent({
            "stopName": "Primusga..",
            "time": "11:00",
            "designation": "",
            "isRegulatedStop": false,
            "hasInterconnections": false,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": true
          }));
          this.ea.publish(new events.setSecondStopEvent({
            "stopName": "Sofiasko..",
            "time": "11:03",
            "designation": "Läge B",
            "isRegulatedStop": false,
            "hasInterconnections": false,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          }));
          this.ea.publish(new events.setThirdStopEvent({
            "stopName": "Mandelpa..",
            "time": "11:07",
            "designation": "Läge A",
            "isRegulatedStop": false,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          }));
          this.ea.publish(new events.atStopEvent(false));
          this.demoState = "journeyStart";
      }
    
    }

    atFirstStop(){
      this.unsubscribeAllTopics();
      if(this.demoState != "atFirstStop"){
        this.ea.publish(new events.removeAllLayersEvent());
        this.ea.publish(new events.pitchEvent(0));
        this.ea.publish(new events.positionEvent(59.325629, 18.002542, 60, 0));
        this.ea.publish(new events.setHeaderEvent("2", "Sofia"));
        this.ea.publish(new events.setHeaderInfoEvent("+01:59", "0m"));
        this.ea.publish(new events.setPreviousStopEvent({
          "stopName": "",
          "time": "",
          "designation": "",
          "isRegulatedStop": "",
          "hasInterconnections": "",
          "isCancelled": "",
          "noBoarding": "",
          "noAlighting": ""
        }));
        this.ea.publish(new events.setNextStopEvent({
          "stopName": "Primusga..",
          "time": "11:00",
          "designation": "",
          "isRegulatedStop": false,
          "hasInterconnections": false,
          "isCancelled": false,
          "noBoarding": false,
          "noAlighting": true
        }));
        this.ea.publish(new events.setSecondStopEvent({
          "stopName": "Sofiasko..",
          "time": "11:03",
          "designation": "Läge B",
          "isRegulatedStop": false,
          "hasInterconnections": false,
          "isCancelled": false,
          "noBoarding": false,
          "noAlighting": false
        }));
        this.ea.publish(new events.setThirdStopEvent({
          "stopName": "Mandelpa..",
          "time": "11:07",
          "designation": "Läge A",
          "isRegulatedStop": false,
          "hasInterconnections": true,
          "isCancelled": false,
          "noBoarding": false,
          "noAlighting": false
        }));
        this.ea.publish(new events.atStopEvent(true));
        this.ea.publish(new events.addMarkerEvent(59.325642, 18.002937));
        var primusLineCoords = [
          [18.002542, 59.325629], 
          [18.003193, 59.325821],
          [18.003719, 59.325870],
          [18.005553, 59.325585],
          [18.006119, 59.325536],
          [18.007664, 59.325665]
        ];
        var firstStopRoute = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": primusLineCoords
                }
            }]
        }
        var layer = {"id": "primus-route",
                "type": "line",
                "source": {
                    "type": "geojson",
                    "data": firstStopRoute
                },
                "layout": {
                    "line-join": "round",
                    "line-cap": "round"
                },
                "paint": {
                    "line-color": "#0000FF",
                    "line-width": 6
                }
        };
        this.ea.publish(new events.addLayerEvent(layer));

        //clearGuideData()        
        //$("#next-stop .row-circle").html('<circle cx=35px cy=50% r="20" stroke="white" stroke-width="4" fill="rgb(0, 200, 0)" />');
        
        //if(!map.mapGL.getLayer("primus-route")){
        //    map.mapGL.addLayer({
        //        "id": "primus-route",
        //        "type": "line",
        //        "source": {
        //            "type": "geojson",
        //            "data": firstStopRoute
        //        },
        //        "layout": {
        //            "line-join": "round",
        //            "line-cap": "round"
        //        },
        //        "paint": {
        //            "line-color": "#0000FF",
        //            "line-width": 6
        //        }
        //    })
        //}

        this.demoState = "atFirstStop";
    }
    }

    drivingBetweenStops(){
      this.unsubscribeAllTopics();
      if(this.demoState != "driving"){
          this.ea.publish(new events.removeAllLayersEvent());
          this.ea.publish(new events.pitchEvent(60));
          this.ea.publish(new events.positionEvent(59.325662, 18.009497, 65, 0))
          var betweenStopsLineCoords = [
              [18.009497, 59.325662],
              [18.013004, 59.326516],
              [18.014264, 59.326773],
              [18.015224, 59.326854],
              [18.016293, 59.326841],
              [18.017048, 59.326957]
          ];
          var betweenStopsRoute = {
              "type": "FeatureCollection",
              "features": [{
                  "type": "Feature",
                  "geometry": {
                      "type": "LineString",
                      "coordinates": betweenStopsLineCoords
                  }
              }]
          }
          var layer = {
              "id": "between-stops-route",
              "type": "line",
              "source": {
                  "type": "geojson",
                  "data": betweenStopsRoute
              },
              "layout": {
                  "line-join": "round",
                  "line-cap": "round"
              },
              "paint": {
                  "line-color": "#0000FF",
                  "line-width": 6
              }
          };
          this.ea.publish(new events.addLayerEvent(layer));

          this.ea.publish(new events.setPreviousStopEvent({
            "stopName": "Primusga.."
          }));

          this.ea.publish(new events.setNextStopEvent({
            "stopName": "Sofiasko..",
            "time": "11:03",
            "designation": "Läge B",
            "isRegulatedStop": false,
            "hasInterconnections": false,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          }));

          this.ea.publish(new events.setSecondStopEvent({
            "stopName": "Mandelpa..",
            "time": "11:07",
            "designation": "Läge A",
            "isRegulatedStop": false,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          }));

          this.ea.publish(new events.setThirdStopEvent({
            "stopName": "Flottbro..",
            "time": "11:16",
            "designation": "",
            "isRegulatedStop": true,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": true,
            "noAlighting": false
          }));

          this.ea.publish(new events.setHeaderEvent("2", "Sofia"));
          this.ea.publish(new events.setHeaderInfoEvent("+00:42", "1231m"));
          this.ea.publish(new events.atStopEvent(false));

          this.demoState ="driving";
      }
      /*   if(demoState != "driving"){
        clearGuideData(    */
    }

    drivingBetweenStops2(){
      this.unsubscribeAllTopics();
      if(this.demoState != "driving2"){
          this.ea.publish(new events.removeAllLayersEvent());
          this.ea.publish(new events.pitchEvent(60));
          this.ea.publish(new events.positionEvent(59.312347, 18.096730, 195, 0))
          var betweenStopsLineCoords2 = [
            [18.096730, 59.312347],
            [18.096028, 59.311058],
            [18.098200, 59.310744],
            [18.098672, 59.311550]    
          ]
        
          var betweenStopsRoute2 = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": betweenStopsLineCoords2
                }
            }]
          };
          var layer = {
            "id": "between-stops-route2",
            "type": "line",
            "source": {
                "type": "geojson",
                "data": betweenStopsRoute2
            },
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": {
                "line-color": "#0000FF",
                "line-width": 6
            }
          }
          this.ea.publish(new events.addLayerEvent(layer));

          this.ea.publish(new events.setPreviousStopEvent({
            "stopName": "Sofiasko.."
          }));

          this.ea.publish(new events.setNextStopEvent({
            "stopName": "Mandelpa..",
            "time": "11:07",
            "designation": "Läge A",
            "isRegulatedStop": false,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          }));

          this.ea.publish(new events.setSecondStopEvent({
            "stopName": "Flottbro..",
            "time": "11:16",
            "designation": "",
            "isRegulatedStop": true,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": true,
            "noAlighting": false
          }));

          this.ea.publish(new events.setThirdStopEvent({
            "stopName": "Broparke..",
            "time": "11:19",
            "designation": "",
            "isRegulatedStop": false,
            "hasInterconnections": false,
            "isCancelled": true,
            "noBoarding": false,
            "noAlighting": false
          }));

          this.ea.publish(new events.setHeaderEvent("2", "Sofia"));
          this.ea.publish(new events.setHeaderInfoEvent("-00:10", "631m"));
          this.ea.publish(new events.atStopEvent(false));

          this.demoState ="driving2";
      }
    }

    drivingBetweenStops3(){
      this.unsubscribeAllTopics();
      if(this.demoState != "driving3"){
        this.ea.publish(new events.removeAllLayersEvent());
        this.ea.publish(new events.pitchEvent(60));
        this.ea.publish(new events.positionEvent(59.310856, 18.098265, 16, 0))

        var betweenStopsLineCoords3 = [
          [18.096730, 59.312347],
          [18.096028, 59.311058],
          [18.098200, 59.310744],
          [18.098672, 59.311550],
          [18.099327, 59.312770],
          [18.101194, 59.312376],
          [18.103152, 59.313540]
        ] 
      
        var betweenStopsRoute3 = {
          "type": "FeatureCollection",
          "features": [{
              "type": "Feature",
              "geometry": {
                  "type": "LineString",
                  "coordinates": betweenStopsLineCoords3
              }
          }]
        };
        var layer = {
          "id": "between-stops-route3",
          "type": "line",
          "source": {
              "type": "geojson",
              "data": betweenStopsRoute3
          },
          "layout": {
              "line-join": "round",
              "line-cap": "round"
          },
          "paint": {
              "line-color": "#0000FF",
              "line-width": 6
          }
        };
        this.ea.publish(new events.addLayerEvent(layer));
        this.ea.publish(new events.addMarkerEvent(59.311606, 18.098841));

        this.ea.publish(new events.setPreviousStopEvent({
          "stopName": "Sofiasko.."
        }));

        this.ea.publish(new events.setNextStopEvent({
          "stopName": "Mandelpa..",
          "time": "11:07",
          "designation": "Läge A",
          "isRegulatedStop": false,
          "hasInterconnections": true,
          "isCancelled": false,
          "noBoarding": false,
          "noAlighting": false
        }));

        this.ea.publish(new events.setSecondStopEvent({
          "stopName": "Flottbro..",
          "time": "11:16",
          "designation": "",
          "isRegulatedStop": true,
          "hasInterconnections": true,
          "isCancelled": false,
          "noBoarding": true,
          "noAlighting": false
        }));

        this.ea.publish(new events.setThirdStopEvent({
          "stopName": "Broparke..",
          "time": "11:19",
          "designation": "",
          "isRegulatedStop": false,
          "hasInterconnections": false,
          "isCancelled": true,
          "noBoarding": false,
          "noAlighting": false
        }));

        this.ea.publish(new events.setHeaderEvent("2", "Sofia"));
        this.ea.publish(new events.setHeaderInfoEvent("-00:20", "85m"));
        this.ea.publish(new events.atStopEvent(false));

        this.demoState = "driving3";
      }
    }

    atSecondStop(){
      /*
        clearGuideData();
        slideDownStops();

        setStopData(stops[0], stops[1], stops[2], stops[3]);
        $("#next-stop .row-circle").html('<circle cx=35px cy=50% r="20" stroke="white" stroke-width="4" fill="rgb(0, 200, 0)" />');
      
      */
      this.unsubscribeAllTopics();
      if(this.demoState != "atSecondStop"){
          this.ea.publish(new events.removeAllLayersEvent());
          this.ea.publish(new events.pitchEvent(0));
          this.ea.publish(new events.positionEvent(59.313216, 18.094038, 105, 0));
          this.ea.publish(new events.addMarkerEvent(59.313163, 18.094006));
          var route = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [18.094038, 59.313216],
                        [18.096795, 59.312847]
                    ]
                }
            }]
          }
          var layer = {
            "id": "route",
            "type": "line",
            "source": {
                "type": "geojson",
                "data": route
            },
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": {
                "line-color": "#0000FF",
                "line-width": 6
            }
          }
          this.ea.publish(new events.addLayerEvent(layer));

          this.ea.publish(new events.setHeaderEvent("2", "Sofia"));
          this.ea.publish(new events.setHeaderInfoEvent("+00:10", "0m"));

          this.ea.publish(new events.setPreviousStopEvent({
            stopName: "Primusga.."
          }));

          this.ea.publish(new events.setNextStopEvent({
            "stopName": "Sofiasko..",
            "time": "11:03",
            "designation": "Läge B",
            "isRegulatedStop": false,
            "hasInterconnections": false,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          }));

          this.ea.publish(new events.setSecondStopEvent({
            "stopName": "Mandelpa..",
            "time": "11:07",
            "designation": "Läge A",
            "isRegulatedStop": false,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          }));

          this.ea.publish(new events.setThirdStopEvent({
            "stopName": "Flottbro..",
            "time": "11:16",
            "designation": "",
            "isRegulatedStop": true,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": true,
            "noAlighting": false
          }));
          this.ea.publish(new events.atStopEvent(true));


          this.demoState = "atSecondStop";
      }
    }

    atThirdStop(){
      this.unsubscribeAllTopics();    
      if(this.demoState != "atThirdStop"){        
          //clearGuideData();
          //slideDownStops();
          this.ea.publish(new events.removeAllLayersEvent());
          this.ea.publish(new events.pitchEvent(0));
          this.ea.publish(new events.positionEvent(59.311550, 18.098672, 15, 0))

          var route2 = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [18.098663, 59.311551],
                        [18.099355, 59.312834]
                    ]
                }
            }]
          }
          var layer = {
            "id": "route2",
            "type": "line",
            "source": {
                "type": "geojson",
                "data": route2
            },
            "layout": {
                "line-join": "round",
                "line-cap": "round"
            },
            "paint": {
                "line-color": "#0000FF",
                "line-width": 6
            }
          }
          this.ea.publish(new events.addLayerEvent(layer));
          this.ea.publish(new events.addMarkerEvent(59.311606, 18.098841));

          this.ea.publish(new events.setPreviousStopEvent({
            "stopName": "Sofiasko.."
          }));

          this.ea.publish(new events.setNextStopEvent({
            "stopName": "Mandelpa..",
            "time": "11:07",
            "designation": "Läge A",
            "isRegulatedStop": false,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          }));

          this.ea.publish(new events.setSecondStopEvent({
            "stopName": "Flottbro..",
            "time": "11:16",
            "designation": "",
            "isRegulatedStop": true,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": true,
            "noAlighting": false
          }));

          this.ea.publish(new events.setThirdStopEvent({
            "stopName": "Broparke..",
            "time": "11:19",
            "designation": "",
            "isRegulatedStop": false,
            "hasInterconnections": false,
            "isCancelled": true,
            "noBoarding": false,
            "noAlighting": false
          }));


          this.ea.publish(new events.setHeaderEvent("2", "Sofia"));
          this.ea.publish(new events.setHeaderInfoEvent("-00:59", "0m"));
          this.ea.publish(new events.atStopEvent(true));
  
          this.demoState = "atThirdStop";         
      }
    }

    atFourthStop(){
      this.unsubscribeAllTopics();
      if(this.demoState != "atFourthStop"){
        this.ea.publish(new events.removeAllLayersEvent());
        this.ea.publish(new events.pitchEvent(0));
        this.ea.publish(new events.positionEvent(59.322356, 17.990093, 37, 0))

        var route3 = {
          "type": "FeatureCollection",
          "features": [{
              "type": "Feature",
              "geometry": {
                  "type": "LineString",
                  "coordinates": [
                      [17.990093, 59.322356],
                      [17.990755, 59.322803],
                      [17.992529, 59.323576]
                  ]
              }
          }]
        }
        var layer = {
          "id": "route3",
          "type": "line",
          "source": {
              "type": "geojson",
              "data": route3
          },
          "layout": {
              "line-join": "round",
              "line-cap": "round"
          },
          "paint": {
              "line-color": "#0000FF",
              "line-width": 6
          }
        }
        this.ea.publish(new events.addLayerEvent(layer));
        this.ea.publish(new events.addMarkerEvent(59.322428, 17.990164));

        this.ea.publish(new events.setPreviousStopEvent({
          "stopName": "Mandelpa.."
        }));

        this.ea.publish(new events.setNextStopEvent({
          "stopName": "Flottbro..",
          "time": "11:16",
          "designation": "",
          "isRegulatedStop": true,
          "hasInterconnections": true,
          "isCancelled": false,
          "noBoarding": true,
          "noAlighting": false
        }));

        this.ea.publish(new events.setSecondStopEvent({
          "stopName": "Broparke..",
          "time": "11:19",
          "designation": "",
          "isRegulatedStop": false,
          "hasInterconnections": false,
          "isCancelled": true,
          "noBoarding": false,
          "noAlighting": false
        }));

        this.ea.publish(new events.setThirdStopEvent({
          "stopName": "",
          "time": "",
          "designation": "",
          "isRegulatedStop": false,
          "hasInterconnections": false,
          "isCancelled": false,
          "noBoarding": false,
          "noAlighting": false
        }));

        
        this.ea.publish(new events.setHeaderEvent("2", "Sofia"));
        this.ea.publish(new events.setHeaderInfoEvent("+00:30", "0m"));
        this.ea.publish(new events.atStopEvent(true));

        this.demoState = "atFourthStop";

      }
    }

    journeyEnd(){
      this.unsubscribeAllTopics();
      if(this.demoState != "journeyEnd"){
        this.ea.publish(new events.removeAllLayersEvent());
        this.ea.publish(new events.setHeaderEvent("", "Ej i trafik"));
        this.ea.publish(new events.setHeaderInfoEvent("", ""));
        this.ea.publish(new events.pitchEvent(60));
        this.ea.publish(new events.positionEvent(59.322497, 17.990307, 35, 0));

        var data = {
          "stopName": "",
          "time": "",
          "designation": "",
          "isRegulatedStop": false,
          "hasInterconnections": false,
          "isCancelled": false,
          "noBoarding": false,
          "noAlighting": false
        }
        this.ea.publish(new events.setPreviousStopEvent(data));

        this.ea.publish(new events.setNextStopEvent(data));

        this.ea.publish(new events.setSecondStopEvent(data));

        this.ea.publish(new events.setThirdStopEvent(data));

        this.demoState = "journeyEnd";
    }
    }
    /*
    var stops = [
        //name, time, designation, isRegulationStop, hasInterconnections, isCanceled, noBoarding, noAlighting
        ["Primusga..", "11:00", "", "", "", "", "", "true"], 
        ["Sofiasko..", "11:03", "Läge B", "", "", "", "", ""], 
        ["Mandelpa..", "11:07", "Läge A", "", "true", "", "", ""], 
        ["Flottbro..", "11:16", "", "true", "true", "", "true", ""],
        ["Broparke..", "11:19", "", "", "", "true", "", ""]
    ];
    */

}

