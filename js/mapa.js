$(function(){

	var map;
    
    var mapOptions;
    var lat = 19.005160;
    var lng = -98.204403;
    var geocoder;
    var myMarker;
    var markers = [];
    var imgMarker = ["img/icon_restaurant.png","img/icon_bar_2.png","img/icon_hobbie.png"];
    var directionsDisplay;
    var directionsService = new google.maps.DirectionsService();
    

    function initialize() {
      geocoder = new google.maps.Geocoder();
      directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true});
        mapOptions = {
          zoom: 15,
          scrollwheel: false,
          disableDefaultUI: true,
           styles: [{
                  featureType: 'water',
                  stylers: [{
                      color: '#46bcec'
                  }, {
                      visibility: 'on'
                  }]
              }, {
                  featureType: 'landscape',
                  stylers: [{
                      color: '#f2f2f2'
                  }]
              }, {
                  featureType: 'road',
                  stylers: [{
                      saturation: -100
                  }, {
                      lightness: 45
                  }]
              }, {
                  featureType: 'road.highway',
                  stylers: [{
                      visibility: 'simplified'
                  }]
              }, {
                  featureType: 'road.arterial',
                  elementType: 'labels.icon',
                  stylers: [{
                      visibility: 'off'
                  }]
              }, {
                  featureType: 'administrative',
                  elementType: 'labels.text.fill',
                  stylers: [{
                      color: '#444444'
                  }]
              }, {
                  featureType: 'transit',
                  stylers: [{
                      visibility: 'off'
                  }]
              }, {
                  featureType: 'poi',
                  stylers: [{
                      visibility: 'off'
                  }]
              }] 
        };

        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
        directionsDisplay.setMap(map);

        // Try HTML5 geolocation
        if(navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            posInicio = new google.maps.LatLng(position.coords.latitude,
                                             position.coords.longitude);

            map.setCenter(posInicio);
            myMarker = new google.maps.Marker({
              position: posInicio,
              map: map,
              icon: "img/icon_yourself.png"
            });

            $("#loading").hide();
          }, function() {
            handleNoGeolocation(true);
          });
        } else {
          // Browser doesn't support Geolocation
          handleNoGeolocation(false);
        }
        
    }

    function handleNoGeolocation(errorFlag) {
        if (errorFlag) {
          var content = 'Error: The Geolocation service failed.';
        } else {
          var content = 'Error: Your browser doesn\'t support geolocation.';
        }

        posInicio = new google.maps.LatLng(lat, lng); 

        var options = {
          map: map,
          position: posInicio,
          content: content
        };

        var infowindow = new google.maps.InfoWindow(options);
        map.setCenter(options.position);
      }

  


      //posicionar marcadores segun categoria
    
      
      $(".controles #action1 #categories a").click(function(e){
        var findResult = function(results, name){
            var result = $.grep(results, function(obj){
              return obj.types[0] == name && obj.types[1] == "political";
            });
            return result ? result[0].long_name : null;
        };
        var latlng = map.getCenter();
          var datos = { 
                idCategoria: $(this).attr('name'), 
              }
        
        geocoder.geocode( {'latLng': latlng}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
              resultados = results[0].address_components;             
             datos.ciudad = findResult(resultados, "locality");
             datos.estado = findResult(resultados, "administrative_area_level_1");
             datos.pais = findResult(resultados, "country");
             
             mapeoMarkers(datos);

            
            
          } else {
            alert('Geocode was not successful for the following reason: ' + status);
            
          }
        });
       

      });

    function mapeoMarkers(datos){

       $.ajax({ 
          url: 'php/getEstablecimientos.php',
          data: datos, 
          dataType: 'json', 
        }).done(function(data){

        deleteAllMarkers();
       
          if (data.length != 0) {

              map.setZoom(13);  
            
            $(".listaNegocios").show();
            $(".listaNegocios .lista").empty();
            directionsDisplay.setMap(); //limpia ruta si existe
            for (var i = 0; i < data.length; i++) {
              var posMarker = new google.maps.LatLng(parseFloat(data[i].lat), parseFloat(data[i].lng));

              console.log(getDistance(myMarker.getPosition(),posMarker));
              
              var image = imgMarker[data[i].categoria - 1];
              var marker = new google.maps.Marker({
                position: posMarker,
                map: map,
                icon: image
              });

              marker.info = new google.maps.InfoWindow({
                content: '<b>Nombre:</b> ' + data[i].nombre + '<br> <b>Direccion:</b> ' + data[i].direccion + '<br> <b>Telefono:</b> ' + data[i].tel + '<br><b>Celular:</b> ' + data[i].celular + '<br>'
              });

              
              markers.push(marker);

              var datos = '<h4>'+data[i].nombre+'</h4><p>'+data[i].direccion+'</p><p>Tel: '+data[i].tel+' | Cel: '+data[i].celular+'</p>';
              var imgDiv = '<img src="img/estable.png"><a id="ver" name="'+i+'" href="#">Ver</a><a id="rute" name="'+i+'" href="#">Ruta</a>';

              $(".listaNegocios .lista").append('<li class="item"><div class="container"></div></li>');
              $(".listaNegocios .lista li:last-child .container").append('<div class="datos"></div>');
              $(".listaNegocios .lista li:last-child .container .datos").append(datos);
              $(".listaNegocios .lista li:last-child .container").append('<div class="img"></div>');
              $(".listaNegocios .lista li:last-child .container .img").append(imgDiv);
              

            }
             $(".img #ver").click(function(){

              var index = parseInt($(this).attr('name'));
              map.setCenter(markers[index].position);
              map.setZoom(14);
              toggleBounce(markers[index],$(this));

              

              });
            $(".img #rute").click(function(){

              var index = parseInt($(this).attr('name'));
              if ($(this).html() == "Ruta") {
                $(".img #rute").not($(this)).html("Ruta");
                getRute(markers[index].getPosition());
                $(this).html("Limpia");
              }else{
                $(this).html("Ruta");
                directionsDisplay.setMap();
              }
              


            });

          }

          
          
        });
    }

    var rad = function(x) {
      return x * Math.PI / 180;
    };

    var getDistance = function(p1, p2) {
      var R = 6378137; // Earth’s mean radius in meter
      var dLat = rad(p2.lat() - p1.lat());
      var dLong = rad(p2.lng() - p1.lng());
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c;
      return d; // returns the distance in meter
    };
   

    function toggleBounce(marker,object) {
      if (marker.getAnimation() != null) {
        marker.setAnimation(null);
        object.css('background','#D8D8D8');
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        object.css('background','#979797');
      }
    }

    function deleteAllMarkers(){
      if (markers.length != 0) { //delete markers
            for (var i = 0; i < markers.length; i++) {
              markers[i].setMap(null);
            }
            markers = [];
          }
    }

    ////////servicio de Direcciones//////////

    function getRute(positionEnd){
      var posInit = myMarker.getPosition();
      
      var request = {
        origin:posInit,
        destination:positionEnd,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC
      };

      directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          directionsDisplay.setDirections(response);
          directionsDisplay.setMap(map);
        }
      });

    }


//////////////////Campo de busqueda ////////////////

  $(".busqueda #buscarPlace").click(function(){

    if ($(".busqueda #search").val() != '') {
      $(".listaNegocios").hide();
      $("#loading").show();
      deleteAllMarkers();
      directionsDisplay.setMap();//limpia ruta si existe
      var address = $(".busqueda #search").val();
      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          map.setCenter(results[0].geometry.location);
          $(".busqueda #search").val(results[0].formatted_address);
          
          map.setZoom(13);
          $("#loading").hide();
        } else {
          alert('Geocode was not successful for the following reason: ' + status);
          $("#loading").hide();
        }
      });
      
    }

  });

  $(".busqueda #search").keyup(function(event){
    if(event.keyCode == 13){
       $(".busqueda #buscarPlace").click();
    }
  });


  $(".busqueda #geolocalizar").click(function(){
    deleteAllMarkers();
    directionsDisplay.setMap();//limpia ruta si existe
    $(".listaNegocios").hide();
    $("#loading").show();
    if(navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var center = new google.maps.LatLng(position.coords.latitude,
                                             position.coords.longitude);

            map.setCenter(center);
            myMarker.setPosition(center);

            $("#loading").hide();
            $(".busqueda #search").val('');
          
          }, function() {
            handleNoGeolocation(true);
          });
        } else {
          // Browser doesn't support Geolocation
          handleNoGeolocation(false);
        }
  });

  google.maps.event.addDomListener(window, 'load', initialize);
  

});

