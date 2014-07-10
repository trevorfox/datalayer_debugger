(function (window) {

  'use strict'; // if you say so Mr. Crockford.

  // In case the dataLayer_debugger obj does not exist, make it.

  if (window.dataLayer_debugger === undefined) {

      // Set the value of the dataLayer_debugger variable
      // to the return value of an immediately evoked function.

      window.dataLayer_debugger = (function(){

      // Instantiate the main dldb object to be returned as mentioned above

      var dldb = {

        // Cache the dataLayer array.

        "dlCache" : window.dataLayer,

        // Cache the default dataLayer.push method.

        "pushCache" : window.dataLayer.push,

        // Acts as the on/of switch for on,off methods or book marklet.

        "keepState" : false,

        // Counts how many pushes occur.

        "pushCount" : window.dataLayer.length || 0,

        // time starts when GTM rule is fired or bookmarklet click

        "startTime" : new Date(),

        // to hold array of callback functions to call inside new .push method

        "callbacks" : [],

        // Does this debugger off cool logging features?

        "coolConsole" : navigator.userAgent.toLowerCase().match(/chrome|firefox/) ? true : false,

        // An object that holds all the current dataLayer values

        "current" : google_tag_manager.dataLayer

      };

      // Append methods to dldb object:

      // Returns time elapsed from startTime.
      // Used for timestamping dataLayer.push logs.

      dldb.now = function () {

        var now =  (new Date() - dldb.startTime) / 1000;

        return now;
      };

      // Returns whether the debugger is on or off.

      dldb.state = function () {

        var state = window.dataLayer_debugger.keepState ? "On" : "Off";

        return state;
      };


      // Turns the debugger on by changing the keepState variable,
      // changes the dataLayer.push method to add debugging functionality

      dldb.on = function () {

        dldb.keepState = true;
        window.dataLayer.push = window.dataLayer_debugger.push;

        console.log ("The dataLayer debugger is On");
        console.log ("Time is: " + window.dataLayer_debugger.now() + " To reset timer: dataLayer_debugger.reset('time')");

        for (var d = 0; d < window.dataLayer.length; d++){

          var obj = window.dataLayer[d],
          keys = Object.keys(obj);

          for (var k = 0; k < keys.length; k++){

            var key = keys[k],
            val = obj[key];

            // Set the new value of current

            //dldb.current[key] = val;
          }
        }

        window.dataLayer_debugger.log(window.dataLayer_debugger.current,"current dataLayer");

      };

      // Turns debugger off,
      // changes dataLayer.push method back to normal.

      dldb.off = function () {

        dldb.keepState = false;

        window.dataLayer = dldb.dlCache;
        window.dataLayer.push = dldb.pushCache;

        console.log("The dataLayer debugger is " + window.dataLayer_debugger.state() + ".");
        console.log("Current time is: " + window.dataLayer_debugger.now());
      };

      // Set one or many callback functions
      // to the debugging version of dataLayer.push method.

      dldb.setCallback = function (callback){

        window.dataLayer_debugger.callbacks.push(callback);
      };

      // Resets the timer, counter, and/or callbacks depending on arguments.
      // No arguments resets all- essentially the same as page refresh.

      dldb.reset = function () {

        for (var r = 0; r < arguments.length; r++){

          var arg = arguments[r];

          if (arg === "time") {

            dldb.startTime = new Date();

          }  if (arg === "count") {

            dldb.pushCount = 0;

          } else if (arg === "callbacks") {

            dldb.callbacks = [];

          } else {

            dldb.startTime = new Date();
            dldb.pushCount = 0;
            dldb.callbacks = [];

          }
        }
      };

      // Redefines the dataLayer.push method to add debugging functionality,
      // calls (applys) all the functions in the dldb.callbacks array,
      // calls the original dataLayer.push methon on all function arguments.

      dldb.push = function () {

        for (var a = 0; a < arguments.length; a++) {

          var obj = arguments[a];


          dldb.pushCount += 1;

          console.group( 'dataLayer.push: #' + dldb.pushCount + ", Time: " + window.dataLayer_debugger.now());

          window.dataLayer_debugger.log(obj,window.dataLayer_debugger.pushCount);

          console.groupEnd();
          console.dir(window.dataLayer);

          window.dataLayer_debugger.validate(obj, ['transactionTotal','transactionId'], ['transactionAffiliation', 'transactionShipping', 'transactionTax', 'transactionProducts'], "transaction");
          window.dataLayer_debugger.validate(obj, ['network','socialAction'],[], "social");

          // Call all callbacks within the context of the pushed object.

          if (window.dataLayer_debugger.callbacks){

            var callbacks = window.dataLayer_debugger.callbacks;

            for (var j = 0; j < callbacks.length; j++) {

              var callback = callbacks[j];

              callback.apply(obj);

            }
          }

          // Calls original cached version of dataLayer.push.

          dldb.pushCache(obj);
        }
      };

      // Pretty-logs an object's contents.

      dldb.log = function (object, optName){

        var ks = Object.keys(object).sort();

        for (var v = 0; v < ks.length; v++){

          if (ks[v] === 'event'){

            ks.unshift(ks.splice(v,1)[0]);
          }
        }

        console.group("object: " + (optName || ""));

        // Check for "event" property.
        // Put "event" property of pushed object first in list.

        try {

          for (var i = 0; i< ks.length; i++) {

            var key = ks[i],
            val = object[key],
            space = 25 - key.length;


            var logMessage = key + new Array(space).join(' ') + ': ';

            if (window.dataLayer_debugger.coolConsole) {

              var valType = (typeof(val) === 'object') ? '%O' : '%s';

              console.log( logMessage + valType, val);

            } else {

              console.log( logMessage + (typeof(val) !== 'object' ? val : "") );

              if (typeof(val) === 'object') {

                console.dir(val);

              }
            }

            // Set the new value of current

            dldb.current[key] = val;
          }
        }

        catch (e) {

          console.log("dataLayer error: " + e.message);

          if (window.dataLayer_debugger.coolConsole) {

            console.log("object was %O", object);

          } else {

            console.log( "object was:" );
            console.dir(val);
          }
        }
        console.groupEnd();
      };

      // Validates an object against an array mandatory valid key
      // and a second optional array of optional keys.
      // The last argument is the is a string name of the type of objec. ie 'social'

      dldb.validate = function (testObj, validKeys, optKeys, type) {

        var checked,
        validKey,
        optKey,
        checkedKeys = [],
        checks = validKeys.length > optKeys.length ? validKeys : optKeys;


        for (var j = 0; j < checks; j++) {

          validKey = validKeys[j];

          if (testObj[validKey]){

            checked = validKeys.splice(j,1);

            checkedKeys.push(checked);
          }

          else if (optKeys && testObj[optKey]) {

            optKey = optKey[j];

            checked = optKeys.splice(j,1);

            checkedKeys.push(checked);

            if (optKey === "transactionProducts" ) {

              var products = testObj.transactionProducts;

              for (var p = 0; p < products.length; p++) {

                var product = products[p];

                window.dataLayer_debugger.validate(product, ["name","sku","price","quantity"],  "product");

              }
            }
          }
        }

        if (validKeys.length) {

          console.log("Invalid " + (type ? type + " " : "") + "object pushed to dataLayer. Missing: " + validKeys.join(", "));

          return false;

        } else if (optKeys.length) {

          console.log("Valid " + (type ? type + " " : "") + "object pushed to dataLayer. Optional keys not used: " + validKeys.join(", "));
        }

        return true;
      };

      // End method definitions and return the created object.

      return dldb;

    })();

  }

  // Logic responsible for turning dataLayer_debugger on/off.

  if (!window.dataLayer_debugger.keepState) {

    window.dataLayer_debugger.on();

  }
  else {

    window.dataLayer_debugger.off();
  }

}(window));
