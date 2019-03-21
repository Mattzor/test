import {Aurelia, inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {PLATFORM} from 'aurelia-pal';
import * as events from './events';
import * as pahoMqtt from 'paho-mqtt';

declare var $;

@inject(EventAggregator)
export class App{
    static eas: EventAggregator;
    static app: App;
    latitude: any;
    longitude: any;
    client: any;

    //
    atStop;
    details;
    expectedCall;
    expectedCallNotHandeled;
    vehicleJourneyRef;
    journeyState;
    lineNumber;
    journey;
    callSequenceNumber;


    mqttbrokerClientId = "journeyguideclient3";
    // Local broker
    localhost = "127.0.0.1";
    localport = 9001;
    static tobsSensorsGnssRmc = "tobs/sensors/gnss/rmc";
    static tobsCurrentVehicleJourneyCallEvent = "tobs/current_vehicle_journey/call_event";
    static tobsCurrentVehicleJourneyDetails = "tobs/current_vehicle_journey/details";
    static tobsCurrentVehicleJourneyLinkProgress = "tobs/current_vehicle_journey/link_progress";
    static tobsCurrentVehicleJourneyExpectedCall = "tobs/current_vehicle_journey/expected_call";
    static tobsCurrentVehicleJourneyState = "tobs/current_vehicle_journey/state";
    
    // Vehiclereplicator
    username = "hogiacommunications";  
    pass = "Hogia6969";  
    mqttbrokerHost = "mosquittoserver.westeurope.cloudapp.azure.com";  
    mqttbrokerWebsocketPort = 9001;  
    //topic = "/replicator/arriva/#";
    topic = "/replicator/hogiacommunications/#"; 


    //demo 
    demoState: string = "";
    countDown;

    mapModel: any;
    infoView: any;

    constructor(private ea: EventAggregator){ 
      App.eas = ea;
      App.app = this;
    }

    attached(){
      console.log(this.mapModel);
      console.log(this.mapModel.addLayer);
    }

    unsubscribeAllTopics(){
      if(this.client){
        try{
          this.client.unsubscribe(this.topic);      
          this.client.unsubscribe(App.tobsSensorsGnssRmc);
          this.client.unsubscribe(App.tobsCurrentVehicleJourneyLinkProgress);
          this.client.unsubscribe(App.tobsCurrentVehicleJourneyExpectedCall);
          this.client.unsubscribe(App.tobsCurrentVehicleJourneyState);
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
  
          case App.tobsSensorsGnssRmc:
              App.app.handleRmc(JSON.parse(message.payloadString));  
              break;
  
          case App.tobsCurrentVehicleJourneyCallEvent:
              App.app.handleCallEvent(JSON.parse(message.payloadString));
              break;
  
          case App.tobsCurrentVehicleJourneyDetails:
              App.app.handleDetails(JSON.parse(message.payloadString));
              break;
  
          case App.tobsCurrentVehicleJourneyExpectedCall:
              App.app.handleExpectedCall(JSON.parse(message.payloadString), false);
              break;
  
          case App.tobsCurrentVehicleJourneyLinkProgress:
              App.app.handleLinkProgress(JSON.parse(message.payloadString));
              break;
  
          case App.tobsCurrentVehicleJourneyState:
              App.app.handleStateMessage(JSON.parse(message.payloadString));
              break;
  
          default:
              console.log("Ignored message on: " + message.destinationName);
              break;
      }
    }

    handleRmc(rmcJson){
      console.log(rmcJson);
      var rmcStr = rmcJson.rmc;  
      var rmcParts = rmcStr.split(",");  
  
      if(rmcParts[3]){
        var lat = this.convertLatitude(rmcParts[3]);
      }
      if(rmcParts[5]){
        var lng = this.convertLongitude(rmcParts[5]);
      }
      if(rmcParts[7]){
        var speed = parseFloat(rmcParts[7]);
      }
      if(rmcParts[8]){
        var direction = parseFloat(rmcParts[8]);  
      }    
      this.mapModel.updateMap(lat, lng, direction, speed);  
    }

    handleCallEvent(callEvent){}

    handleDetails(details){
      console.log(details);
         
      if(JSON.stringify(details) === JSON.stringify(this.details)){
          return;
      }

      this.details = details;

      this.infoView.updateServiceJourney(this.details);

      if(details.vehicleJourneyRef != this.details.vehicleJourneyRef){
          this.mapModel.clearMap();
      }    
      this.mapModel.drawJourneyPath(this.details.calls);
      this.mapModel.addStopMarkers(this.details.calls);

      if(this.expectedCall && this.expectedCallNotHandeled && this.expectedCall.vehicleJourneyRef === details.vehicleJourneyRef){
          this.handleExpectedCall(this.expectedCall, true);
      }
    }

    handleExpectedCall(expectedCall, forceUpdate){
      console.log(expectedCall);
      if(forceUpdate){
          console.log("Force update expected call");
      }

      if(JSON.stringify(expectedCall) === JSON.stringify(this.expectedCall) && !forceUpdate){
          console.log("No changes in expected call");
          return;
      }

      this.expectedCall = expectedCall;
      this.vehicleJourneyRef = expectedCall.vehicleJourneyRef;
      this.journeyState = expectedCall.state;
      this.lineNumber = this.vehicleJourneyRef.substring(7,11);
      this.journey = this.vehicleJourneyRef.substring(11);
      
      if(!this.details || this.details.vehicleJourneyRef !== expectedCall.vehicleJourneyRef){
          console.log("Unhandled expected call");
          this.expectedCallNotHandeled = true;
          return;
      }

      this.expectedCallNotHandeled = false;
      
      
      if(expectedCall.callSequenceNumber != this.callSequenceNumber || forceUpdate){        
          if(forceUpdate){
              console.log("Force update stops");
          }
          this.callSequenceNumber = expectedCall.callSequenceNumber;
          this.updateStops(expectedCall);
      }
      
      if(expectedCall.atStop != this.atStop){
          if(expectedCall.atStop){
              this.atStop = expectedCall.atStop;
              this.infoView.arrivedAtStop();
          }else{
              this.atStop = expectedCall.atStop;
              this.infoView.departuredFromStop();
          }
      }       

      if(expectedCall.holdReason){

          switch(expectedCall.holdReason){

              case "CONNECTION_PROTECTION":
                  var interConnections = this.getInterConnections(expectedCall.callSequenceNumber);
                  this.infoView.setInfoWindowStop(expectedCall.holdReason, expectedCall.holdUntil, interConnections);
                  break;
              /*case "DRIVER_CHANGE":
                  infoView.setInfoWindowStop(expectedCall.holdReason, expectedCall.holdUntil, null);
                  break;
              case "TIMINGPOINT":
                  infoView.setInfoWindowStop(expectedCall.holdReason, expectedCall.holdUntil, null);
                  break;
            */
              default:
                  this.infoView.setInfoWindowStop(expectedCall.holdReason, expectedCall.holdUntil, null);
                  break;
          }

          this.infoView.addHold(expectedCall.callSequenceNumber, expectedCall.holdReason, expectedCall.holdUntil);
      }

      if(expectedCall.restriction){
          
      }
      
      this.infoView.setTimeSchedule(expectedCall.serviceDeviation);

    }

    getInterConnections(callSequenceNumber){
      for(var i = 0; i < this.details.calls.length; i++){
          if(this.details.calls[i].sequenceNumber === callSequenceNumber){                
              if (this.details.calls[i].fetcherConnections){
                  return this.details.calls[i].fetcherConnections;
              }
              return "";
          }
      }
    }

    updateStops(expectedCall){
      if(!this.details){        
          return;
      }
  
      var seqNum = expectedCall.callSequenceNumber
      var holdReason = null;
      var holdUntil = null;
      if(expectedCall.holdReason){
          holdReason = expectedCall.holdReason;
      }
      if(expectedCall.holdUntil){
          holdUntil = expectedCall.holdUntil;
      }
  
      var prev = seqNum - 2;
      var next = seqNum - 1;
      var second = seqNum;
      var third = seqNum + 1;
      var numOfCalls = this.details.calls.length;
      
      var prevCall = null;
      var nextCall = null;
      var secondCall = null;
      var thirdCall = null;
  
      if(seqNum <= numOfCalls){
          if(prev >= 0){
              prevCall = this.details.calls[prev];
          }
          if(next <= numOfCalls){
              nextCall = this.details.calls[next];   
          }
          if(second < numOfCalls){
              secondCall = this.details.calls[second];            
          }
          if(third < numOfCalls){
              thirdCall = this.details.calls[third];            
          }
      }
  
      this.infoView.updatePreviousStop(prevCall);
      this.infoView.updateNextStop(nextCall, holdReason, holdUntil);
      this.infoView.updateSecondStop(secondCall);
      this.infoView.updateThirdStop(thirdCall);
    }
    handleLinkProgress(linkProgress){}
    handleStateMessage(state){}


    onConnectLocal(){
      console.log("Connection success!");
      App.app.client.subscribe(App.tobsSensorsGnssRmc);
      //client.subscribe(tobsCurrentVehicleJourneyCallEvent);
      App.app.client.subscribe(App.tobsCurrentVehicleJourneyDetails);
      //client.subscribe(tobsCurrentVehicleJourneyState);
      App.app.client.subscribe(App.tobsCurrentVehicleJourneyLinkProgress);
      App.app.client.subscribe(App.tobsCurrentVehicleJourneyExpectedCall);
    }


    convertLatitude(latitude){
      var deg = parseFloat(latitude.substring(0, 2));
      var min = parseFloat(latitude.substring(2));  
      var res = deg + min/60;  
      return res;
    }
      
    convertLongitude(longitude){
        var deg = parseFloat(longitude.substring(0,3));
        var min = parseFloat(longitude.substring(3));  
        var res = deg + min/60;
        return res;
    }
    // Demo functions, put in a new child?

    journeyStart(){     
      this.unsubscribeAllTopics();
      if(this.demoState != "journeyStart"){
          //clearGuideData()
          
          this.mapModel.removeAllLayers();
          this.mapModel.map.setPitch(60);
          this.mapModel.updateMap(59.314731, 18.003361, 335, 0);
          this.infoView.setHeader("2", "Sofia");
          this.infoView.setPreviousStop({
            "stopName": "",
            "time": "",
            "designation": "",
            "isRegulatedStop": "",
            "hasInterconnections": "",
            "isCancelled": "",
            "noBoarding": "",
            "noAlighting": ""
          });
          this.infoView.setNextStop({
            "stopName": "Primusga..",
            "time": "11:00",
            "designation": "",
            "isRegulatedStop": false,
            "hasInterconnections": false,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": true
          });
          this.infoView.setSecondStop({
            "stopName": "Sofiasko..",
            "time": "11:03",
            "designation": "Läge B",
            "isRegulatedStop": false,
            "hasInterconnections": false,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          });
          
          this.infoView.setThirdStop({
            "stopName": "Mandelpa..",
            "time": "11:07",
            "designation": "Läge A",
            "isRegulatedStop": false,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          });
          this.infoView.atStop(false);
          this.demoState = "journeyStart";
      }
    
    }

    firstStopInfoWindow(){
      if(this.infoView.infoWinOpen){
        this.infoView.closeInfoWindow();
        //clearInfoView();
      }else{
        this.setInfoWinFirstStop();
        this.infoView.openInfoWindow();
      }
    }

    setInfoWinFirstStop(){
      var timeCountDown = '<span class="time-count-down-span">00:59</span>'; 
      $(".stoppoint-info-content .time-count-down").html(timeCountDown);
      $(".sp-header").html("<i>TIMING_POINT</i>");
  
      this.countDown =  setInterval(function(){
          
          var time = $(".time-schedule-span").text();
          var timeToDrive = $(".time-count-down-span").text();
  
          if(!timeToDrive){
              clearInterval(this.countDown); 
              this.countDown = null;
              return;
          }
  
          $(".time-schedule-span").text(this.countDownTime(time));
          $(".time-count-down-span").text(this.countDownTime(timeToDrive));
      
      }, 1000);
    }    

    countDownTime(time){
      var min, sec
      var firstChar = "";
      var parts = time.split(":");
  
      if(parts[0].length > 2)    {
          firstChar = parts[0].substring(0, 1);
          min = parseInt(parts[0].substring(1));
      }else{
          min = parseInt(parts[0]);
      }
  
      sec = parseInt(parts[1]);
      
      if(min === 0 && sec===0){
          clearInterval(this.countDown);
          return;
      }else if(min > 0 && sec == 0){
          min -= 1;
          sec = 59;
      }else{
          sec -= 1;
      }
      var e = "";
      if(sec < 10){
          e = "0";
      }
      var f = "";
      if(min < 10){
          f = "0";
      }
      return firstChar + f + min.toString() + ":" + e + sec.toString();
    }
  
    countUpTime(time){
      var min, sec;
      var firstChar = "";
      var parts = time.split(":");
  
      if(parts[0].length > 2){
          firstChar  = parts[0].substring(0, 1);
          min = parseInt(parts[0].substring(1));
      }else{
          min = parseInt(parts[0]);
      }
  
      sec = parseInt(parts[1]);
  
      if(sec === 59){
          min += 1;
          sec = 0;
      }else{
          sec += 1;
      }
      var secStr = sec.toString();
      var minStr = min.toString();
  
      if(secStr.length < 2){
          secStr = "0" + secStr;
      }
      if(minStr.length < 2){
          minStr = "0" + minStr;
      }
      return firstChar + minStr + ":" + secStr;
    }
    

    atFirstStop(){
      this.unsubscribeAllTopics();
      if(this.demoState != "atFirstStop"){
        this.mapModel.removeAllLayers();
        this.mapModel.map.setPitch(0);
        this.mapModel.updateMap(59.325629, 18.002542, 60, 0);

        this.infoView.setHeader("2", "Sofia");
        this.infoView.setHeaderInfo("+01:59", "0m");

        this.infoView.setPreviousStop({
          "stopName": "",
          "time": "",
          "designation": "",
          "isRegulatedStop": "",
          "hasInterconnections": "",
          "isCancelled": "",
          "noBoarding": "",
          "noAlighting": ""
        });
        this.infoView.setNextStop({
          "stopName": "Primusga..",
          "time": "11:00",
          "designation": "",
          "isRegulatedStop": false,
          "hasInterconnections": false,
          "isCancelled": false,
          "noBoarding": false,
          "noAlighting": true
        });
        this.infoView.setSecondStop({
          "stopName": "Sofiasko..",
          "time": "11:03",
          "designation": "Läge B",
          "isRegulatedStop": false,
          "hasInterconnections": false,
          "isCancelled": false,
          "noBoarding": false,
          "noAlighting": false
        });
        this.infoView.setThirdStop({
          "stopName": "Mandelpa..",
          "time": "11:07",
          "designation": "Läge A",
          "isRegulatedStop": false,
          "hasInterconnections": true,
          "isCancelled": false,
          "noBoarding": false,
          "noAlighting": false
        });
        this.infoView.atStop(true);
        this.mapModel.addMarker(59.325642, 18.002937);
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
        };
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
        this.mapModel.addLayer(layer);

        //clearGuideData()        
        //$("#next-stop .row-circle").html('<circle cx=35px cy=50% r="20" stroke="white" stroke-width="4" fill="rgb(0, 200, 0)" />');
      
        this.demoState = "atFirstStop";
      }
    }

    drivingBetweenStops(){
      this.unsubscribeAllTopics();
      if(this.demoState != "driving"){
          this.mapModel.removeAllLayers();
          this.mapModel.map.setPitch(60);
          this.mapModel.updateMap(59.325662, 18.009497, 65, 0);
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
          this.mapModel.addLayer(layer);

          this.infoView.setPreviousStop({
            "stopName": "Primusga.."
          });

          this.infoView.setNextStop({
            "stopName": "Sofiasko..",
            "time": "11:03",
            "designation": "Läge B",
            "isRegulatedStop": false,
            "hasInterconnections": false,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          });

          this.infoView.setSecondStop({
            "stopName": "Mandelpa..",
            "time": "11:07",
            "designation": "Läge A",
            "isRegulatedStop": false,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          });

          this.infoView.setThirdStop({
            "stopName": "Flottbro..",
            "time": "11:16",
            "designation": "",
            "isRegulatedStop": true,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": true,
            "noAlighting": false
          });

          this.infoView.setHeader("2", "Sofia");
          this.infoView.setHeaderInfo("+00:42", "1231m");
          this.infoView.atStop(false);
          
          this.demoState ="driving";
      }
      /*   if(demoState != "driving"){
        clearGuideData(    */
    }

    drivingBetweenStops2(){
      this.unsubscribeAllTopics();
      if(this.demoState != "driving2"){
          this.mapModel.removeAllLayers();
          this.mapModel.map.setPitch(60);
          this.mapModel.updateMap(59.312347, 18.096730, 195, 0);
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
          this.mapModel.addLayer(layer);

          this.infoView.setPreviousStop({
            "stopName": "Sofiasko.."
          });

          this.infoView.setNextStop({
            "stopName": "Mandelpa..",
            "time": "11:07",
            "designation": "Läge A",
            "isRegulatedStop": false,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          });

          this.infoView.setSecondStop({
            "stopName": "Flottbro..",
            "time": "11:16",
            "designation": "",
            "isRegulatedStop": true,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": true,
            "noAlighting": false
          });

          this.infoView.setThirdStop({
            "stopName": "Broparke..",
            "time": "11:19",
            "designation": "",
            "isRegulatedStop": false,
            "hasInterconnections": false,
            "isCancelled": true,
            "noBoarding": false,
            "noAlighting": false
          });

          this.infoView.setHeader("2", "Sofia");
          this.infoView.setHeaderInfo("-00:10", "631m");
          this.infoView.atStop(false);
          
          this.demoState ="driving2";
      }
    }

    drivingBetweenStops3(){
      this.unsubscribeAllTopics();
      if(this.demoState != "driving3"){
        this.mapModel.removeAllLayers();
        this.mapModel.map.setPitch(60);
        this.mapModel.updateMap(59.310856, 18.098265, 16, 0);

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
        this.mapModel.addLayer(layer);
        this.mapModel.addMarker(59.311606, 18.098841);

        this.infoView.setPreviousStop({
          "stopName": "Sofiasko.."
        });

        this.infoView.setNextStop({
          "stopName": "Mandelpa..",
          "time": "11:07",
          "designation": "Läge A",
          "isRegulatedStop": false,
          "hasInterconnections": true,
          "isCancelled": false,
          "noBoarding": false,
          "noAlighting": false
        });

        this.infoView.setSecondStop({
          "stopName": "Flottbro..",
          "time": "11:16",
          "designation": "",
          "isRegulatedStop": true,
          "hasInterconnections": true,
          "isCancelled": false,
          "noBoarding": true,
          "noAlighting": false
        });

        this.infoView.setThirdStop({
          "stopName": "Broparke..",
          "time": "11:19",
          "designation": "",
          "isRegulatedStop": false,
          "hasInterconnections": false,
          "isCancelled": true,
          "noBoarding": false,
          "noAlighting": false
        });

        this.infoView.setHeader("2", "Sofia");
        this.infoView.setHeaderInfo("-00:20", "85");
        this.infoView.atStop(false);
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
          
          this.mapModel.removeAllLayers();
          this.mapModel.map.setPitch(0);
          this.mapModel.updateMap(59.313216, 18.094038, 105, 0);
          this.mapModel.addMarker(59.313163, 18.094006);

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
          this.mapModel.addLayer(layer);

          this.infoView.setHeader("2", "Sofia");
          this.infoView.setHeaderInfo("+00:10", "0m");

          this.infoView.setPreviousStop({
            stopName: "Primusga.."
          });

          this.infoView.setNextStop({
            "stopName": "Sofiasko..",
            "time": "11:03",
            "designation": "Läge B",
            "isRegulatedStop": false,
            "hasInterconnections": false,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          });

          this.infoView.setSecondStop({
            "stopName": "Mandelpa..",
            "time": "11:07",
            "designation": "Läge A",
            "isRegulatedStop": false,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          });

          this.infoView.setThirdStop({
            "stopName": "Flottbro..",
            "time": "11:16",
            "designation": "",
            "isRegulatedStop": true,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": true,
            "noAlighting": false
          });
          this.infoView.atStop(true);

          this.demoState = "atSecondStop";
      }
    }

    atThirdStop(){
      this.unsubscribeAllTopics();    
      if(this.demoState != "atThirdStop"){        
          //clearGuideData();
          //slideDownStops();
          this.mapModel.removeAllLayers();
          this.mapModel.map.setPitch(0);
          this.mapModel.updateMap(59.311550, 18.098672, 15, 0);

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
          this.mapModel.addLayer(layer);
          this.mapModel.addMarker(59.311606, 18.098841);
          
          this.infoView.setPreviousStop({
            "stopName": "Sofiasko.."
          });

          this.infoView.setNextStop({
            "stopName": "Mandelpa..",
            "time": "11:07",
            "designation": "Läge A",
            "isRegulatedStop": false,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": false,
            "noAlighting": false
          });

          this.infoView.setSecondStop({
            "stopName": "Flottbro..",
            "time": "11:16",
            "designation": "",
            "isRegulatedStop": true,
            "hasInterconnections": true,
            "isCancelled": false,
            "noBoarding": true,
            "noAlighting": false
          });

          this.infoView.setThirdStop({
            "stopName": "Broparke..",
            "time": "11:19",
            "designation": "",
            "isRegulatedStop": false,
            "hasInterconnections": false,
            "isCancelled": true,
            "noBoarding": false,
            "noAlighting": false
          });


          this.infoView.setHeader("2", "Sofia");
          this.infoView.setHeaderInfo("-00:59", "0m");
          this.infoView.atStop(true);
          this.demoState = "atThirdStop";         
      }
    }

    atFourthStop(){
      this.unsubscribeAllTopics();
      if(this.demoState != "atFourthStop"){
        this.mapModel.removeAllLayers();
        this.mapModel.map.setPitch(0);
        this.mapModel.updateMap(59.322356, 17.990093, 37, 0);

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

        this.mapModel.addLayer(layer);
        this.mapModel.addMarker(59.322428, 17.990164);

        this.infoView.setPreviousStop({
          "stopName": "Mandelpa.."
        });

        this.infoView.setNextStop({
          "stopName": "Flottbro..",
          "time": "11:16",
          "designation": "",
          "isRegulatedStop": true,
          "hasInterconnections": true,
          "isCancelled": false,
          "noBoarding": true,
          "noAlighting": false
        });

        this.infoView.setSecondStop({
          "stopName": "Broparke..",
          "time": "11:19",
          "designation": "",
          "isRegulatedStop": false,
          "hasInterconnections": false,
          "isCancelled": true,
          "noBoarding": false,
          "noAlighting": false
        });

        this.infoView.setThirdStop({
          "stopName": "",
          "time": "",
          "designation": "",
          "isRegulatedStop": false,
          "hasInterconnections": false,
          "isCancelled": false,
          "noBoarding": false,
          "noAlighting": false
        });

        this.infoView.setHeader("2", "Sofia");
        this.infoView.setHeaderInfo("+00:30", "0m");
        this.infoView.atStop(true);

        this.demoState = "atFourthStop";

      }
    }

    journeyEnd(){
      this.unsubscribeAllTopics();
      if(this.demoState != "journeyEnd"){

        this.mapModel.removeAllLayers();
        this.mapModel.map.setPitch(60);
        this.mapModel.updateMap(59.322497, 17.990307, 35, 0);

        this.infoView.setHeader("", "Ej i trafik");
        this.infoView.setHeaderInfo("", "");

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
        this.infoView.setPreviousStop(data);

        this.infoView.setNextStop(data);

        this.infoView.setSecondStop(data);

        this.infoView.setThirdStop(data);

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

