(function(){
// returns the origin we should post messages to (if on same host), or null if
// no suitable origin is found
var getOrigin = function() {
   var origin = null; 
   // function to normalize hostnames
   var normalize = function(hostname) {
     if (hostname == "127.0.0.1")
       return "localhost";
     else
       return hostname;
   };

   // construct the parent origin if the hostnames match
   var parentUrl = (parent !== window) ? document.referrer : null;
   if (parentUrl) {
     // parse the parent href
     var a = document.createElement('a');
     a.href = parentUrl;

     if (normalize(a.hostname) == normalize(window.location.hostname)) {
       var protocol = a.protocol.replace(':',''); // browser compatability
       origin = protocol + '://' + a.hostname;
       if (a.port)
         origin = origin + ':' + a.port;
     } 
   }
   return origin;
};

// sets the location hash
var setHash = function(hash) {
   document.location.hash = hash;
}

// sets the document scroll position. this could be called before that part of
// the document has loaded, so if the position specified is not yet available,
// wait a few ms and try again.
var setScrollPos = function(pos) {
   console.log("setting scroll pos to " + pos);
   if (pos > document.body.scrollHeight) {
      window.setTimeout(function() { setScrollPos(pos) }, 500);
      console.log("waiting: " + document.body.scrollHeight);
   } else {
      document.body.scrollTop = pos;
      console.log("done setting scroll pos to " + pos);
   }
}

// obtain and validate the origin
var origin = getOrigin();
console.log("rsiframe wants to connect to " + origin);
if (origin === null)
   return;

// set up cross-domain send/receive
var send = function(data) {
   console.log("rsiframe posted " + data.event + ", " + data.data);
   parent.postMessage(data, origin);
};

var recv = function(evt) {
   console.log("rsiframe received from " + origin);
   // validate that message is from expected origin (i.e. our parent)
   if (evt.origin !== origin) 
      return;

   console.log("rsiframe dispatch method " + evt.data.method);

   switch (evt.data.method) {
   case "rs_set_scroll_pos":
      setScrollPos(evt.data.arg)
      break;
   case "rs_set_hash": 
      setHash(evt.data.arg)
      break;
   }
}

// document event handlers ---------------------------------------------------

// notify parent when scroll stops changing for ~0.25 s (don't spam during
// continuous/smooth scrolling)
var scrollTimer = 0;
var onScroll = function(pos) {
   if (scrollTimer !== 0)
      window.clearTimeout(scrollTimer)
   scrollTimer = window.setTimeout(function() {
      send({ event: "doc_scroll_change", data: document.body.scrollTop });
   }, 250);
}

var onHashChange = function(evt) {
   send({ event: "doc_hash_change", data: document.location.hash });
}

window.addEventListener("message", recv, false); 
window.addEventListener("scroll", onScroll, false); 
window.addEventListener("hashchange", onHashChange, false); 

// let parent know we're ready once the event loop finishes
window.setTimeout(function() {
   send({ event: "doc_ready", data: null });
}, 0);

})();

