import { Component } from '@angular/core';
import { GasService } from '../services/gas.service';
import { Geolocation } from '@capacitor/geolocation';
import * as Leaflet from 'leaflet';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage {

  map: Leaflet.Map;
  constructor(private gas: GasService) {}
  load = false;
 
  coords
  gasList;
  coordsChanged
  markers = []
  

  async ngOnInit() {

    this.coords = await (await Geolocation.getCurrentPosition()).coords;
    
    this.leafletMap();

    this.gas.getGasData().subscribe((res: any) => {

      this.gasList = res.ListaEESSPrecio.map(el => {
        return{
          'id': el.IDEESS,
          'name': el['Rótulo'],
          'provincia': el['Provincia'],
          'lat': parseFloat(el.Latitud.replace(',', '.')),
          'lng': parseFloat(el['Longitud (WGS84)'].replace(',', '.')),
          'horario': el.Horario,
          'biodiesel': el['Precio Biodiesel'],
          'bioEtanol': el['Precio Bioetanol'],
          'gasNaturalComp': el['Precio Gas Natural Comprimido'],
          'gasNaturalLiq': el['Precio Gas Natural Licuado'],
          'diesel': el['Precio Gasoleo A'],
          'gasB': el['Precio Gasoleo B'],
          'dieselPremium': el['Precio Gasoleo Premium'],
          'gaso95': el['Precio Gasolina 95 E5'],
          'gaso95Premium': el['Precio Gasolina 95 E5 Premium'],
          'gaso95E10': el['Precio Gasolina 95 E10'],
          'gaso98': el['Precio Gasolina 98 E5'],
          'gaso98E10': el['Precio Gasolina 98 E10'],
          'adBlue': el['Precio Hidrogeno'],
          'tipoVenta': el['Tipo Venta']
        }
      });

      this.loadStations(this.coords.latitude, this.coords.longitude)
      
    });
  
  }

  leafletMap() {

    this.map = Leaflet.map('mapId', {
      center: [this.coords.latitude, this.coords.longitude],
      zoom: 12
    })
    
    Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'yebenesApps',
    }).addTo(this.map);

    this.map.whenReady(() => {

      setTimeout(() => {
        this.map.invalidateSize();
        this.load = true;
      }, 1000);

    });

    this.map.on('dragend', (data) => {     

      this.removeMarks()
      this.coordsChanged = data.target.getCenter()
      this.loadStations(this.coordsChanged.lat, this.coordsChanged.lng)

    })
    
    /*gasList.forEach((station, index) => {
      Leaflet.marker([parseFloat(station.Latitud), parseFloat(station['Longitud (WGS84)'])]).addTo(this.map).bindPopup(station['Rótulo']).openPopup();
      if(index == 50) return;
    });*/
  }

  getNearCoords(lat1, lat2, lon1, lon2, unit){
  
    var radlat1 = Math.PI * lat1/180
    var radlat2 = Math.PI * lat2/180
    var theta = lon1-lon2
    var radtheta = Math.PI * theta/180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI
    dist = dist * 60 * 1.1515
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="N") { dist = dist * 0.8684 }

    return dist
  }


  loadStations(lat1, lng1){

    

    this.gasList.forEach(el => {
      if(this.getNearCoords(lat1, el.lat, lng1, el.lng, 'K') < 10){
        let mark = Leaflet.marker([el.lat, el.lng]).addTo(this.map).bindPopup(el.name);
        this.markers.push(mark)
      }
    });

  }

  removeMarks(){

    this.markers.forEach(mark => {
      this.map.removeLayer(mark)
    })

  }

}


