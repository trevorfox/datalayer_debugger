// console formating with "%" only works in Chrome/firefox... dang. fixed!

(function (window) {
  'use strict'; // if you say so Mr. Crockford.

  // In case the dataLayer_debugger obj does not exist, make it.

  if (window.dataLayer_debugger === undefined) {

    // Instantiate the main dldb object. (later window.dataLayer_debugger)

    var dldb = {

      // Cache the dataLayer array.

      "dlCache" : window.dataLayer,

      // Cache the default dataLayer.push method.

      "dotPush" : window.dataLayer.push,

      // Acts as the on/of switch for on,off methods or book marklet.

      "keepState" : false,

      // Counts how many pushes occur.

      "pushCount" : window.dataLayer.length || 0,

      // time starts when GTM rule is fired or bookmarklet click

      "startTime" : new Date(),

      // to hold array of callback functions to call inside new .push method

      "callbacks" : [],

      // Does this debugger off cool logging features?

      "coolConsole" : navigator
                      .userAgent
                      .toLowerCase()
                      .match(/chrome|firefox/) ? true : false
    };

    // Returns time elapsed from startTime.
    // Used for timestamping dataLayer.push logs.

    dldb.now = function () { return (new Date() - dldb.startTime) / 1000; };

    // Returns whether the debugger is on or off.

    dldb.state = function () {
        return (window.dataLayer_debugger.keepState ? "On" : "Off");
      };

    // Resets the timer, counter, and/or callbacks depending on arguments.
    // No arguments resets all- essentially the same as page refresh.

    dldb.validate = function (validKeys, testObj, type) {
      var checked,
      checkedKeys = [],
      keys = Object.keys(testObj);

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];

        for (var j = 0; j < validKeys.length; j++) {
          var validKey = validKeys[j];

          if (key === validKey){
            checked = validKeys.splice(j,1);
            checkedKeys.push(checked);

          }

          if (key === "transactionProducts" ) {
            var products = testObj.transactionProducts;

            for (var p = 0; p < products.length; p++) {
              var product = products[p];
              window.dataLayer_debugger.validate(["name","sku","price","quantity"], product, "product");
            }
          }
        }
        console.log("vk:" + validKeys.length + " ck:" + checkedKeys.length);
        console.log("validKeys: " + validKeys);
        console.log("checkedKeys:" + checkedKeys);
      }

      if (validKeys.length && checkedKeys.length){
        console.log("Invalid " + (type ? type + " " : "") + "object pushed to dataLayer. Missing: " + validKeys.join(", "));
        return false ;
      }
		console.log("object is valid");
      return true;

    };

    // Turns the debugger on by changing the keepState variable,
    // changes the dataLayer.push method to add debugging functionality

    dldb.on = function () {
      dldb.keepState = true;
      console.log ("The dataLayer debugger is On");
      console.log ("Time is: " + window.dataLayer_debugger.now() + " To reset timer: dataLayer_debugger.reset('time')");
      console.dir (window.dataLayer);

      // Redefines the dataLayer.push method to add debugging functionality,
      // calls (applys) all the functions in the dldb.callbacks array,
      // calls the original dataLayer.push methon on all function arguments.

      window.dataLayer.push = function () {

        for (var a = 0; a < arguments.length; a++) {

          var obj = arguments[a],
              ks = Object.keys(obj).sort();

              // Check for "event" property.
              // Put "event" property of pushed object first in list.
              
        	  window.dataLayer_debugger.validate(['transactionTotal','transactionId'], obj, "transaction");
              window.dataLayer_debugger.validate( ['network','socialAction'], obj, "social");

              for (var v = 0; v < ks.length; v++){
              	
                if (ks[v] === 'event'){
                  ks.unshift(ks.splice(v,1)[0]);
                }
              }


        try {
            dldb.pushCount += 1;
            console.group( 'dataLayer.push: #' + dldb.pushCount + ", Time: " + window.dataLayer_debugger.now());

            for (var i = 0; i< ks.length; i++) {
              var key = ks[i],
                val = obj[key],
                space = 25 - key.length;

              // validate transaction pushes, break if fail

              if (key.match(/^transaction(Id|Total|Affiliation|Shipping|Tax|Products)$/)){

                if (!window.dataLayer_debugger.validate(['transactionTotal','transactionId'], obj, "transaction") ) {
                  break;
                }
              }

              // validate social pushes, break if fail

              if (key.match(/^(network|socialAction|opt_(target|pagePath))$/)){

                if (!window.dataLayer_debugger.validate( ['network','socialAction'], obj, "social") ) {
                  break;
                }
              }

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
            }
          }
        catch (e) {
            console.log("dataLayer error: " + e.message);
            console.log("pushed object was %O", obj);
          }
          console.groupEnd();
          console.dir(window.dataLayer);

          // Call all callbacks within the context of the pushed object.

          if (window.dataLayer_debugger.callbacks){
            var callbacks = window.dataLayer_debugger.callbacks;
            for (var j = 0; j < callbacks.length; j++) {
              var callback = callbacks[j];
              callback.apply(obj);
            }
          }

          // Calls original cached version of dataLayer.push.

          dldb.dotPush(obj);
        }
      };
    };

    // Turns debugger off,
    // changes dataLayer.push method back to normal.

    dldb.off = function () {
      dldb.keepState = false;
      window.dataLayer = dldb.dlCache;
      window.dataLayer.push = dldb.dotPush;
      console.log("The dataLayer debugger is " + window.dataLayer_debugger.state() + ".");
      console.log("Current time is: " + window.dataLayer_debugger.now());
    };

      // Set one or many callback functions
      // to the debugging version of dataLayer.push method.

    dldb.setCallback = function (callback){
      window.dataLayer_debugger.callbacks.push(callback);
    };

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

    window.dataLayer_debugger = dldb;

    // In this case the dataLayer_debbugger does exist (after 1st run)

  } else {
    dldb = window.dataLayer_debugger;
  }

  // Logic responsible for turning dataLayer_debugger on/off.

  if (!window.dataLayer_debugger.keepState) {
    window.dataLayer_debugger.on();
  } else {
    window.dataLayer_debugger.off();
  }
}(window));
