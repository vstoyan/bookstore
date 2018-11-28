//==================== GOOGLE MAPS ===========================================

(function(globals){

  "use strict";

  var themeConfig = globals.themeConfig || {};

  // themeConfig["GOOGLE_MAPS"] = { REQUIRED SETTINGS }

  /*----[ ANIMATED PIN ]----------------------------------*/

  function animatedPin( latlng, map, args ) {
    this.latlng = latlng; 
    this.args   = args; 
    this.setMap(map); 
  }

  animatedPin.prototype = new google.maps.OverlayView();

  animatedPin.prototype.draw = function() {
    
    var self = this;
    var div  = this.div;
    
    if (!div) {
    
      div = this.div = document.createElement('div');
      div.className = 'pin_container';

      var pinDiv = document.createElement('div');
        pinDiv.className = 'pin';
      var pulseDiv = document.createElement('div');
        pulseDiv.className = 'pulse';
        pinDiv.appendChild(pulseDiv);
        div.appendChild(pinDiv);
      
      if (typeof(self.args.marker_id) !== 'undefined') {
        div.dataset.marker_id = self.args.marker_id;
      }
      
      google.maps.event.addDomListener(div, "click", function(event) {
        alert('You clicked on a custom marker!');     
        google.maps.event.trigger(self, "click");
      });
      
      var panes = this.getPanes();
      panes.overlayImage.appendChild(div);
    }
    
    var point = this.getProjection().fromLatLngToDivPixel(this.latlng);
    
    if (point) {
      div.style.left = (point.x - 10) + 'px';
      div.style.top = (point.y - 20) + 'px';
    }
  };

  animatedPin.prototype.remove = function() {
    if (this.div) {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    } 
  };

  animatedPin.prototype.getPosition = function() {
    return this.latlng; 
  };  

  /*----------------------------------[ ANIMATED PIN ]----*/

  function mapsInit() {

    themeConfig["GOOGLE_MAPS"].maps.forEach(function(map){

      var mapElement = document.getElementById( map.id );

      if ( mapElement !== null ){

        var myLatlng   = new google.maps.LatLng( map.lat, map.lon );       
        var mapOptions = {
          zoom                     : map.zoom,
          scrollwheel              : map.scrollWheel,                    
          disableDefaultUI         : map.disableDefaultUI,
          center                   : myLatlng,
          mapTypeId                : google.maps.MapTypeId[map.type],
          styles                   : map.styles,
          mapTypeControl           : map.type_switch,            
          mapTypeControlOptions    : {
            style                    : google.maps.MapTypeControlStyle[map.type_switch_style],   
            position                 : google.maps.ControlPosition[map.type_switch_position]
          },
          panControl               : map.pan_control,
          panControlOptions        : {
            position                 : google.maps.ControlPosition[map.pan_control_position]  
          },
          zoomControl              : map.zoom_control,
          zoomControlOptions       : {
            style                    : google.maps.ZoomControlStyle[map.zoom_control_style],                
            position                 : google.maps.ControlPosition[map.zoom_control_position]
          },
          scaleControl             : map.scale_control,  
          streetViewControlOptions : {
            position                 : google.maps.ControlPosition[map.streetView_position]
          }
        };

        /* DISABLE MAP SCROLLING / ENABLE UI ON MOBILE DEVICES */
        if ( window.innerWidth <= 990 ) {  
          mapOptions.draggable        = false;
          mapOptions.disableDefaultUI = false;
        }


        var gmap        = new google.maps.Map( mapElement, mapOptions );

        // INIT gmarker
        if ( map. animatedMarker ){
          var overlay = new animatedPin( myLatlng, gmap, { marker_id: 'custom_marker' });
        }

        /*----[ STREETVIEW ]------------------------------------*/

        if ( map.streetView ) {
   
          var panorama = new google.maps.StreetViewPanorama( mapElement, { position: myLatlng } );
          gmap.setStreetView(panorama);

        }

        /*------------------------------------[ STREETVIEW ]----*/

        /*----[ MAP MARKER ]------------------------------------*/

        if ( map.marker && !map. animatedMarker ){

          var image = "";

          if ( map.markerImageSrc !== "" ){
            var image = {
              url    : map.markerImageSrc,
              origin : new google.maps.Point(0,0),
              size   : new google.maps.Size( map.markerImageWidth, map.markerImageHeight ),
              anchor : new google.maps.Point( map.markerAnchorX, map.markerAnchorY )
            };
          } 

          var marker     = new google.maps.Marker({
            position : myLatlng,
            map      : gmap,
            icon     : image,
            draggable: map.draggable,
            title    : map.markerTitle
          });

        }

        /*------------------------------------[ MAP MARKER ]----*/

        /*----[ INFO WINDOWS ]----------------------------------*/

        if ( map.infoWindow !== "" ){

          var infowindow = new google.maps.InfoWindow({ content: map.infoWindow });          

          google.maps.event.addListener( marker, 'click', function(){ infowindow.open( gmap, marker ); });

        }

        /*----------------------------------[ INFO WINDOWS ]----*/

      }

    });

  }

  if ( 
    typeof google !== "undefined" && google.maps 
    && ( typeof themeConfig["GOOGLE_MAPS"] !== "undefined" )
    && ( themeConfig["GOOGLE_MAPS"].maps.length > 0 )
  ) google.maps.event.addDomListener( window, 'load', mapsInit );

}(this));

//END================= GOOGLE MAPS ===========================================