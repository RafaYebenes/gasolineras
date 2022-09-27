import { Component, HostListener } from '@angular/core';
import { GasService } from '../services/gas.service';
import { Geolocation } from '@capacitor/geolocation';
import * as Leaflet from 'leaflet';
import { Platform } from '@ionic/angular';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  map: Leaflet.Map;
  constructor(private gas: GasService, private platform: Platform) {

    this.platform.backButton.subscribeWithPriority(10, () => {
      console.log('Handler was called!');
    });

  }
  load = false;

  coords;
  gasList;
  coordsChanged;
  markers = [];
  higherPrice = 0;
  lowerPrice = 0;
  mediumPrice = 0;
  rango1 = 0;
  rango2 = 0;
  stationSelected;
  gasMasBarata;
  isModalOpen = false;

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  async ngOnInit() {

    this.isModalOpen = false

    this.coords = await (await Geolocation.getCurrentPosition()).coords;

    this.leafletMap();

    this.gas.getGasData().subscribe((res: any) => {
      this.gasList = this.getGasStations(res);

      this.loadStations(this.coords.latitude, this.coords.longitude);
    });
  }

  getGasStations(list) {
    return list.ListaEESSPrecio.map((el, index) => {
      return {
        id: el.IDEESS,
        direccion: el['Dirección'],
        name: el['Rótulo'],
        provincia: el['Provincia'],
        lat: parseFloat(el.Latitud.replace(',', '.')),
        lng: parseFloat(el['Longitud (WGS84)'].replace(',', '.')),
        horario: el.Horario,
        biodiesel: el['Precio Biodiesel'],
        bioEtanol: el['Precio Bioetanol'],
        gasNaturalComp: el['Precio Gas Natural Comprimido'],
        gasNaturalLiq: el['Precio Gas Natural Licuado'],
        diesel: el['Precio Gasoleo A'],
        gasB: el['Precio Gasoleo B'],
        dieselPremium: el['Precio Gasoleo Premium'],
        gaso95: el['Precio Gasolina 95 E5'],
        gaso95Premium: el['Precio Gasolina 95 E5 Premium'],
        gaso95E10: el['Precio Gasolina 95 E10'],
        gaso98: el['Precio Gasolina 98 E5'],
        gaso98E10: el['Precio Gasolina 98 E10'],
        adBlue: el['Precio Hidrogeno'],
        tipoVenta: el['Tipo Venta'],
        link: "https://www.google.com/maps/dir/?api=1&destination="+parseFloat(el.Latitud.replace(',', '.')) + '/' + parseFloat(el['Longitud (WGS84)'].replace(',', '.'))
      };
    });
  }

  goBack(){
    this.setOpen(false)
  }

  setPrices() {

    this.mediumPrice = parseFloat(((this.higherPrice + this.lowerPrice) / 2).toFixed(5));

    this.rango1 = this.mediumPrice + (this.higherPrice - this.mediumPrice) / 2;

    this.rango2 = this.lowerPrice + (this.mediumPrice - this.lowerPrice) / 2;

  }

  leafletMap() {
    this.map = Leaflet.map('mapId', {
      center: [this.coords.latitude, this.coords.longitude],
      zoom: 12,
      zoomControl: false,
    });

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
      this.removeMarks();
      this.coordsChanged = data.target.getCenter();
      this.loadStations(this.coordsChanged.lat, this.coordsChanged.lng);
    });

    /*gasList.forEach((station, index) => {
      Leaflet.marker([parseFloat(station.Latitud), parseFloat(station['Longitud (WGS84)'])]).addTo(this.map).bindPopup(station['Rótulo']).openPopup();
      if(index == 50) return;
    });*/
  }

  getNearCoords(lat1, lat2, lon1, lon2, unit) {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == 'K') {
      dist = dist * 1.609344;
    }
    if (unit == 'N') {
      dist = dist * 0.8684;
    }

    return dist;
  }


  getNearStations(lat1, lng1){
    
    this.gasMasBarata = null
    let nearStations = this.gasList.filter((el) => {
      if (this.getNearCoords(lat1, el.lat, lng1, el.lng, 'K') < 5 && el.tipoVenta == 'P')  return el
    })

    nearStations.map((el, index) => {

      if (index == 0) {
        this.higherPrice = parseFloat(el.diesel.replace(',', '.') );
        this.lowerPrice = parseFloat(el.diesel.replace(',', '.'));
        this.gasMasBarata = el
      }

      if (  parseFloat(el.diesel.replace(',', '.')) > this.higherPrice && el.diesel )
        this.higherPrice = parseFloat(el.diesel.replace(',', '.'));
      
      
      if ( parseFloat(el.diesel.replace(',', '.')) < this.lowerPrice && el.diesel ){
        this.lowerPrice = parseFloat(el.diesel.replace(',', '.'));
        this.gasMasBarata = el
      }

    })

    console.log('station cheaper', this.gasMasBarata)

    this.setPrices();

    return nearStations
  }


  loadStations(lat1, lng1) {

    this.getNearStations(lat1, lng1).forEach((el, index) => {
        
        let diesel = parseFloat(el.diesel.replace(',', '.'));

        var greenIcon = Leaflet.icon({
          iconUrl: this.getIcon(diesel),
          iconSize: [50, 50], // size of the icon
        });


        let mark = Leaflet.marker([el.lat, el.lng], {
          icon: greenIcon,
          title: index,
        })
          .addTo(this.map)
          .bindTooltip(el.diesel + '€', { permanent: true, direction: 'top' }).addEventListener('click', (station) => {
            console.log('gas',el)
            this.stationSelected = el
            this.setOpen(true)
          });

        this.markers.push(mark);
    });
  }

  getIcon(diesel) {
    if (this.higherPrice >= diesel && diesel >= this.rango1) {
      return '../../assets/markers/pin-high.png';
    }

    if (this.rango1 > diesel && diesel >= this.mediumPrice) {
      return '../../assets/markers/pin-medium.png';
    }

    if (this.mediumPrice > diesel && diesel >= this.lowerPrice) {
      return '../../assets/markers/pin-low.png';
    }

    return '../../assets/markers/pin-medium.png';
  }


  openModalCheaper(){
    this.stationSelected = this.gasMasBarata
    this.setOpen(true)
  }

  removeMarks() {
    this.markers.forEach((mark) => {
      this.map.removeLayer(mark);
    });
  }

  centerMap() {
    this.removeMarks();
    this.loadStations(this.coords.latitude, this.coords.longitude);
    this.map.flyTo([this.coords.latitude, this.coords.longitude]);
  }
}
